import fs from 'fs';
import path from 'path';

// Spring Boot annotations
const ANNOTATIONS = {
  controller: ['@RestController', '@Controller', '@RequestMapping', '@GetMapping', '@PostMapping', '@PutMapping', '@DeleteMapping', '@PatchMapping'],
  service: ['@Service', '@Component', '@Transactional'],
  repository: ['@Repository', '@JpaRepository', '@CrudRepository', '@MongoRepository'],
  entity: ['@Entity', '@Table', '@Document', '@MappedSuperclass'],
  dto: ['@Data', '@Builder', '@Value', '@Getter', '@Setter', '@NoArgsConstructor', '@AllArgsConstructor'],
  config: ['@Configuration', '@Bean', '@ConfigurationProperties'],
  security: ['@EnableWebSecurity', '@Secured', '@PreAuthorize', '@PostAuthorize'],
  validation: ['@Valid', '@NotNull', '@NotEmpty', '@NotBlank', '@Size', '@Min', '@Max', '@Email', '@Pattern']
};

// Layer directory patterns
const LAYER_DIRS = {
  controller: ['controller', 'controllers', 'rest', 'api', 'web', 'resource'],
  service: ['service', 'services', 'impl', 'business'],
  repository: ['repository', 'repositories', 'dao', 'persistence'],
  entity: ['entity', 'entities', 'model', 'models', 'domain'],
  dto: ['dto', 'dtos', 'request', 'response', 'vo', 'transfer'],
  config: ['config', 'configuration', 'properties'],
  security: ['security', 'auth'],
  exception: ['exception', 'exceptions', 'error', 'errors', 'handler'],
  util: ['util', 'utils', 'helper', 'helpers', 'common']
};

export function analyzeProject(projectPath) {
  const results = {
    path: projectPath,
    language: 'Java',
    framework: 'Spring Boot',
    modules: [],
    layers: {},
    patterns: [],
    violations: [],
    warnings: [],
    suggestions: [],
    stats: {
      totalFiles: 0,
      totalLines: 0,
      byLayer: {},
      byAnnotation: {}
    }
  };

  // Initialize layers
  for (const layer of Object.keys(LAYER_DIRS)) {
    results.layers[layer] = [];
  }

  // Find all Java files
  const javaFiles = findJavaFiles(projectPath);
  results.stats.totalFiles = javaFiles.length;

  // Analyze each file
  for (const filePath of javaFiles) {
    const analysis = analyzeJavaFile(filePath, projectPath);
    if (analysis) {
      results.modules.push(analysis);
      
      // Add to layer
      if (results.layers[analysis.layer]) {
        results.layers[analysis.layer].push(analysis);
      }
      
      // Count lines
      results.stats.totalLines += analysis.lines;
      
      // Count by layer
      results.stats.byLayer[analysis.layer] = (results.stats.byLayer[analysis.layer] || 0) + 1;
    }
  }

  // Detect patterns
  results.patterns = detectPatterns(results);
  
  // Check violations
  results.violations = checkViolations(results);
  
  // Generate warnings
  results.warnings = checkWarnings(results);
  
  // Generate suggestions
  results.suggestions = generateSuggestions(results);

  return results;
}

function findJavaFiles(dir) {
  const files = [];
  
  function walk(currentDir) {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        // Skip build directories
        if (entry.isDirectory() && !entry.name.startsWith('.') && 
            !['target', 'build', 'node_modules', '.git', '.idea', '.mvn'].includes(entry.name)) {
          walk(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.java')) {
          files.push(fullPath);
        }
      }
    } catch (e) {
      // Skip unreadable directories
    }
  }
  
  walk(dir);
  return files;
}

function analyzeJavaFile(filePath, projectPath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(projectPath, filePath);
  const fileName = path.basename(filePath, '.java');
  const lines = content.split('\n').length;
  
  // Extract package
  const packageMatch = content.match(/package\s+([\w.]+);/);
  const packageName = packageMatch ? packageMatch[1] : '';
  
  // Extract class name
  const classMatch = content.match(/(?:public|private|protected)?\s*(?:abstract\s+)?(?:class|interface|enum)\s+(\w+)/);
  const className = classMatch ? classMatch[1] : fileName;
  
  // Extract annotations
  const annotations = [];
  const annotationRegex = /@(\w+)/g;
  let match;
  while ((match = annotationRegex.exec(content)) !== null) {
    annotations.push(`@${match[1]}`);
  }
  
  // Detect layer
  const layer = detectLayer(relativePath, annotations, content);
  
  // Extract imports
  const imports = [];
  const importRegex = /import\s+(?:static\s+)?([\w.*]+);/g;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  // Extract methods
  const methods = [];
  const methodRegex = /(?:public|private|protected)\s+(?:static\s+)?(?:final\s+)?(?:<[^>]+>\s+)?(\w+)\s+(\w+)\s*\([^)]*\)/g;
  while ((match = methodRegex.exec(content)) !== null) {
    methods.push({
      returnType: match[1],
      name: match[2]
    });
  }
  
  // Extract fields
  const fields = [];
  const fieldRegex = /(?:private|protected|public)\s+(?:static\s+)?(?:final\s+)?(\w+(?:<[^>]+>)?)\s+(\w+)\s*[;=]/g;
  while ((match = fieldRegex.exec(content)) !== null) {
    fields.push({
      type: match[1],
      name: match[2]
    });
  }
  
  // Check for specific patterns
  const hasAutowired = annotations.includes('@Autowired');
  const hasConstructorInjection = content.includes('constructor') || /public\s+\w+\s*\([^)]*\w+\s+\w+[^)]*\)\s*\{/.test(content);
  const hasFieldInjection = /@Autowired\s+(?:private|protected)\s+/.test(content);
  const hasLombok = annotations.some(a => ['@Data', '@Builder', '@Value', '@Getter', '@Setter'].includes(a));
  const hasValidation = annotations.some(a => ANNOTATIONS.validation.includes(a));
  const hasTransactional = annotations.includes('@Transactional');
  
  return {
    name: fileName,
    className,
    path: relativePath,
    package: packageName,
    layer,
    annotations,
    imports,
    methods,
    fields,
    lines,
    patterns: {
      hasAutowired,
      hasConstructorInjection,
      hasFieldInjection,
      hasLombok,
      hasValidation,
      hasTransactional
    }
  };
}

function detectLayer(filePath, annotations, content) {
  const lowerPath = filePath.toLowerCase();
  
  // Check by annotations first
  if (annotations.some(a => ANNOTATIONS.controller.includes(a))) return 'controller';
  if (annotations.some(a => ANNOTATIONS.service.includes(a))) return 'service';
  if (annotations.some(a => ANNOTATIONS.repository.includes(a))) return 'repository';
  if (annotations.some(a => ANNOTATIONS.entity.includes(a))) return 'entity';
  if (annotations.some(a => ANNOTATIONS.dto.includes(a))) return 'dto';
  if (annotations.some(a => ANNOTATIONS.config.includes(a))) return 'config';
  if (annotations.some(a => ANNOTATIONS.security.includes(a))) return 'security';
  
  // Check by directory
  for (const [layer, dirs] of Object.entries(LAYER_DIRS)) {
    for (const dir of dirs) {
      if (lowerPath.includes(`/${dir}/`) || lowerPath.includes(`\\${dir}\\`)) {
        return layer;
      }
    }
  }
  
  // Check by class name patterns
  if (lowerPath.endsWith('controller.java')) return 'controller';
  if (lowerPath.endsWith('service.java') || lowerPath.endsWith('serviceimpl.java')) return 'service';
  if (lowerPath.endsWith('repository.java')) return 'repository';
  if (lowerPath.endsWith('entity.java') || lowerPath.endsWith('model.java')) return 'entity';
  if (lowerPath.endsWith('dto.java') || lowerPath.endsWith('request.java') || lowerPath.endsWith('response.java')) return 'dto';
  if (lowerPath.endsWith('config.java') || lowerPath.endsWith('configuration.java')) return 'config';
  if (lowerPath.endsWith('exception.java')) return 'exception';
  
  return 'other';
}

function detectPatterns(results) {
  const patterns = [];
  const { layers } = results;
  
  // MVC Pattern
  if (layers.controller.length > 0 && layers.service.length > 0) {
    patterns.push({
      name: 'MVC Pattern',
      description: 'Controller-Service separation detected',
      status: 'detected'
    });
  }
  
  // Service Layer Pattern
  if (layers.service.length > 0 && layers.repository.length > 0) {
    patterns.push({
      name: 'Service Layer Pattern',
      description: 'Service-Repository separation detected',
      status: 'detected'
    });
  }
  
  // DTO Pattern
  if (layers.dto.length > 0) {
    patterns.push({
      name: 'DTO Pattern',
      description: 'Data Transfer Objects used',
      status: 'detected'
    });
  }
  
  // Layered Architecture
  const activeLayers = Object.entries(layers).filter(([_, mods]) => mods.length > 0).map(([name]) => name);
  if (activeLayers.length >= 3) {
    patterns.push({
      name: 'Layered Architecture',
      description: `${activeLayers.length} layers detected: ${activeLayers.join(', ')}`,
      status: 'detected'
    });
  }
  
  // Constructor Injection
  const hasConstructorInjection = results.modules.some(m => m.patterns.hasConstructorInjection);
  if (hasConstructorInjection) {
    patterns.push({
      name: 'Constructor Injection',
      description: 'Dependency injection via constructor (recommended)',
      status: 'detected'
    });
  }
  
  // Field Injection (anti-pattern)
  const hasFieldInjection = results.modules.some(m => m.patterns.hasFieldInjection);
  if (hasFieldInjection) {
    patterns.push({
      name: 'Field Injection',
      description: 'Using @Autowired on fields (not recommended)',
      status: 'warning'
    });
  }
  
  return patterns;
}

function checkViolations(results) {
  const violations = [];
  
  for (const module of results.modules) {
    // V1: Controller directly accessing Repository
    if (module.layer === 'controller') {
      const repoImports = module.imports.filter(i => 
        i.includes('Repository') || i.includes('Dao')
      );
      if (repoImports.length > 0) {
        violations.push({
          id: 'V001',
          severity: 'error',
          file: module.name,
          path: module.path,
          rule: 'Controller-Repository Direct Access',
          message: 'Controller directly accesses Repository (should use Service)',
          fix: 'Inject and use a Service class instead'
        });
      }
    }
    
    // V2: Entity depends on Service
    if (module.layer === 'entity') {
      const serviceImports = module.imports.filter(i => 
        i.includes('Service') || i.includes('Component')
      );
      if (serviceImports.length > 0) {
        violations.push({
          id: 'V002',
          severity: 'error',
          file: module.name,
          path: module.path,
          rule: 'Entity-Service Dependency',
          message: 'Entity depends on Service (wrong direction)',
          fix: 'Remove Service dependency from Entity'
        });
      }
    }
    
    // V3: Business logic in Controller
    if (module.layer === 'controller') {
      const hasBusinessLogic = module.methods.some(m => 
        ['calculate', 'process', 'validate', 'transform', 'convert'].some(bl => 
          m.name.toLowerCase().includes(bl)
        )
      );
      if (hasBusinessLogic) {
        violations.push({
          id: 'V003',
          severity: 'warning',
          file: module.name,
          path: module.path,
          rule: 'Business Logic in Controller',
          message: 'Controller contains business logic',
          fix: 'Move business logic to Service layer'
        });
      }
    }
    
    // V4: Missing @Transactional on Service methods
    if (module.layer === 'service') {
      const hasWriteMethods = module.methods.some(m => 
        ['save', 'update', 'delete', 'create', 'remove', 'insert'].some(write => 
          m.name.toLowerCase().includes(write)
        )
      );
      if (hasWriteMethods && !module.patterns.hasTransactional) {
        violations.push({
          id: 'V004',
          severity: 'warning',
          file: module.name,
          path: module.path,
          rule: 'Missing @Transactional',
          message: 'Service has write methods without @Transactional',
          fix: 'Add @Transactional annotation to the class or method'
        });
      }
    }
    
    // V5: Field Injection
    if (module.patterns.hasFieldInjection) {
      violations.push({
        id: 'V005',
        severity: 'info',
        file: module.name,
        path: module.path,
        rule: 'Field Injection',
        message: 'Using @Autowired on fields (not recommended)',
        fix: 'Use constructor injection instead'
      });
    }
    
    // V6: Missing validation on DTOs
    if (module.layer === 'dto' || module.layer === 'controller') {
      if (!module.patterns.hasValidation && module.annotations.some(a => ['@RequestBody', '@ModelAttribute'].includes(a))) {
        violations.push({
          id: 'V006',
          severity: 'warning',
          file: module.name,
          path: module.path,
          rule: 'Missing Validation',
          message: 'Request body without validation annotations',
          fix: 'Add @Valid and validation annotations (@NotNull, @Size, etc.)'
        });
      }
    }
    
    // V7: Missing exception handling
    if (module.layer === 'controller') {
      const hasExceptionHandler = module.annotations.some(a => 
        ['@ExceptionHandler', '@ControllerAdvice', '@RestControllerAdvice'].includes(a)
      );
      const throwsExceptions = module.methods.some(m => 
        m.name.includes('throw') || m.name.includes('Exception')
      );
      if (!hasExceptionHandler && throwsExceptions) {
        violations.push({
          id: 'V007',
          severity: 'warning',
          file: module.name,
          path: module.path,
          rule: 'Missing Exception Handling',
          message: 'Controller throws exceptions without handler',
          fix: 'Add @ControllerAdvice with @ExceptionHandler'
        });
      }
    }
  }
  
  return violations;
}

function checkWarnings(results) {
  const warnings = [];
  
  // W1: No Service layer
  if (results.layers.controller.length > 0 && results.layers.service.length === 0) {
    warnings.push({
      id: 'W001',
      severity: 'high',
      message: 'No Service layer detected',
      description: 'Controllers should not contain business logic',
      suggestion: 'Create a service/ directory and add Service classes'
    });
  }
  
  // W2: No Repository layer
  if (results.layers.service.length > 0 && results.layers.repository.length === 0) {
    warnings.push({
      id: 'W002',
      severity: 'medium',
      message: 'No Repository layer detected',
      description: 'Consider using Repository pattern for data access',
      suggestion: 'Create a repository/ directory and use Spring Data JPA'
    });
  }
  
  // W3: No DTOs
  if (results.layers.controller.length > 0 && results.layers.dto.length === 0) {
    warnings.push({
      id: 'W003',
      severity: 'low',
      message: 'No DTOs detected',
      description: 'Consider using DTOs to separate API contracts from entities',
      suggestion: 'Create DTO classes for request/response objects'
    });
  }
  
  // W4: No validation
  const hasValidation = results.modules.some(m => m.patterns.hasValidation);
  if (!hasValidation && results.layers.controller.length > 0) {
    warnings.push({
      id: 'W004',
      severity: 'medium',
      message: 'No validation detected',
      description: 'Input validation is important for security',
      suggestion: 'Add @Valid and validation annotations to request bodies'
    });
  }
  
  // W5: Large classes
  const largeClasses = results.modules.filter(m => m.lines > 300);
  if (largeClasses.length > 0) {
    warnings.push({
      id: 'W005',
      severity: 'medium',
      message: `${largeClasses.length} large class(es) detected`,
      description: 'Classes over 300 lines may need refactoring',
      suggestion: 'Consider splitting into smaller, focused classes'
    });
  }
  
  return warnings;
}

function generateSuggestions(results) {
  const suggestions = [];
  
  // S1: Architecture improvements
  if (results.layers.controller.length > 0 && results.layers.service.length === 0) {
    suggestions.push({
      priority: 'high',
      category: 'architecture',
      title: 'Add Service Layer',
      description: 'Create service classes to separate business logic from controllers',
      example: `
@Service
public class UserService {
    private final UserRepository userRepository;
    
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    
    public User findById(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new UserNotFoundException(id));
    }
}
`
    });
  }
  
  // S2: Constructor injection
  const hasFieldInjection = results.modules.some(m => m.patterns.hasFieldInjection);
  if (hasFieldInjection) {
    suggestions.push({
      priority: 'medium',
      category: 'best-practice',
      title: 'Use Constructor Injection',
      description: 'Constructor injection is preferred over field injection',
      example: `
// ❌ Field injection (not recommended)
@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;
}

// ✅ Constructor injection (recommended)
@Service
public class UserService {
    private final UserRepository userRepository;
    
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
}
`
    });
  }
  
  // S3: Add validation
  const hasValidation = results.modules.some(m => m.patterns.hasValidation);
  if (!hasValidation) {
    suggestions.push({
      priority: 'medium',
      category: 'security',
      title: 'Add Input Validation',
      description: 'Validate all user input to prevent security issues',
      example: `
@Data
public class CreateUserRequest {
    @NotNull(message = "Name is required")
    @Size(min = 2, max = 100)
    private String name;
    
    @NotNull(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;
}

@PostMapping("/users")
public User createUser(@Valid @RequestBody CreateUserRequest request) {
    return userService.createUser(request);
}
`
    });
  }
  
  // S4: Exception handling
  const hasExceptionHandler = results.modules.some(m => 
    m.annotations.some(a => ['@ControllerAdvice', '@RestControllerAdvice'].includes(a))
  );
  if (!hasExceptionHandler && results.layers.controller.length > 0) {
    suggestions.push({
      priority: 'high',
      category: 'best-practice',
      title: 'Add Global Exception Handling',
      description: 'Create a @ControllerAdvice for consistent error responses',
      example: `
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleUserNotFound(UserNotFoundException ex) {
        ErrorResponse error = new ErrorResponse("USER_NOT_FOUND", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        ErrorResponse error = new ErrorResponse("VALIDATION_ERROR", ex.getMessage());
        return ResponseEntity.badRequest().body(error);
    }
}
`
    });
  }
  
  // S5: Use DTOs
  if (results.layers.dto.length === 0 && results.layers.entity.length > 0) {
    suggestions.push({
      priority: 'medium',
      category: 'architecture',
      title: 'Use DTOs for API Responses',
      description: 'Separate API contracts from database entities',
      example: `
// Entity (database)
@Entity
public class User {
    @Id
    private Long id;
    private String name;
    private String email;
    private String passwordHash; // Don't expose this!
}

// DTO (API response)
@Data
public class UserResponse {
    private Long id;
    private String name;
    private String email;
    // No passwordHash!
}
`
    });
  }
  
  return suggestions;
}
