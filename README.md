# SpringGuard

*He knows Spring. He's seen the mistakes. He won't let you make them.*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**SpringGuard** makes your AI agent think like a senior Spring Boot developer. Before writing code, it enforces best practices, layered architecture, and proper patterns.

## What It Detects

### ❌ Violations
| ID | Rule | Severity |
|----|------|----------|
| V001 | Controller → Repository (should use Service) | Error |
| V002 | Entity → Service (wrong direction) | Error |
| V003 | Business logic in Controller | Warning |
| V004 | Missing @Transactional | Warning |
| V005 | Field injection (@Autowired on fields) | Info |
| V006 | Missing validation | Warning |
| V007 | Missing exception handling | Warning |

### ⚠️ Warnings
| ID | Issue |
|----|-------|
| W001 | No Service layer |
| W002 | No Repository layer |
| W003 | No DTOs |
| W004 | No validation |
| W005 | Large classes (>300 lines) |

### ✅ Patterns Detected
- MVC Pattern
- Service Layer Pattern
- DTO Pattern
- Constructor Injection
- Layered Architecture

## Install

### Claude Code
```
/plugin marketplace add yourusername/springguard
/plugin install springguard@springguard
```

### Cursor / Windsurf / Cline
Copy `.cursor/rules/springguard.md` to your project's rules directory.

### Any AI Agent
Copy `AGENTS.md` to your project root. Works everywhere.

## Usage

```bash
# Analyze project
node bin/springguard.js analyze /path/to/spring-boot-project

# Quick check (exit code 1 if violations)
node bin/springguard.js check /path/to/spring-boot-project

# Output as JSON
node bin/springguard.js analyze . --json
```

## Example Output

```
🛡️ SpringGuard - Spring Boot Best Practices Enforcer

📦 Architecture Layers:
  🎮 controller: 3 file(s)
  ⚙️ service: 3 file(s)
  💾 repository: 3 file(s)
  📊 entity: 3 file(s)

🔍 Patterns Detected:
  ✅ MVC Pattern
  ✅ Service Layer Pattern
  ✅ Constructor Injection

⚠️  Violations Found: 2

Errors:
  ✗ Controller-Repository Direct Access
    File: UserController.java
    Fix: Inject and use a Service class instead

💡 Suggestions:
  🔴 Add Global Exception Handling
     Create a @ControllerAdvice for consistent error responses
```

## Best Practices Enforced

### 1. Layered Architecture
```
Controller → Service → Repository → Entity
     ↓
    DTO (request/response)
```

### 2. Constructor Injection
```java
// ✅ Good
@Service
public class UserService {
    private final UserRepository userRepository;
    
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
}

// ❌ Bad
@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;
}
```

### 3. Validation
```java
// ✅ Good
@PostMapping("/users")
public User createUser(@Valid @RequestBody CreateUserRequest request) {
    return userService.createUser(request);
}
```

### 4. Exception Handling
```java
// ✅ Good
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(UserNotFoundException ex) {
        // Handle error
    }
}
```

## Commands

| Command | Description |
|---------|-------------|
| `/springguard analyze` | Analyze Spring Boot project |
| `/springguard check` | Check for violations |
| `/springguard suggest` | Get improvement suggestions |

## Philosophy

Spring Boot best practices exist for a reason:
- **Layered architecture**: Separation of concerns
- **Constructor injection**: Testability, immutability
- **Validation**: Security, data integrity
- **@Transactional**: Data consistency
- **DTOs**: API stability, security

## License

MIT
