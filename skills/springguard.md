# springguard

Analyze Spring Boot project for best practices and violations.

## Usage

When the user asks about their Spring Boot project architecture:

```bash
node /Users/Aditya/CommandCode/springguard/bin/springguard.js analyze /path/to/project
```

## What It Checks

1. **Layer Architecture**: Controller → Service → Repository
2. **Dependency Injection**: Constructor vs Field injection
3. **Validation**: @Valid and validation annotations
4. **Transactions**: @Transactional usage
5. **Exception Handling**: @ControllerAdvice
6. **DTOs**: API contracts vs entities

## When to Use

- User asks "analyze my Spring Boot project"
- User asks "check my architecture"
- User asks "what's wrong with my Spring code"
- Before code review
- During refactoring

## Output Example

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
