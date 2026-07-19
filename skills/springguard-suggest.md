# springguard-suggest

Get improvement suggestions for Spring Boot project.

## Usage

```bash
node /Users/Aditya/CommandCode/springguard/bin/springguard.js analyze /path/to/project
```

## Suggestions Include

1. **Architecture**: Layer improvements
2. **Best Practices**: Constructor injection, validation
3. **Security**: Input validation, error handling
4. **Performance**: Transaction management

## Example Output

```
💡 Suggestions:

🔴 Add Service Layer
   Create service classes to separate business logic from controllers
   
   Example:
   @Service
   public class UserService {
       private final UserRepository userRepository;
       
       public UserService(UserRepository userRepository) {
           this.userRepository = userRepository;
       }
   }
```
