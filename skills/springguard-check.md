# springguard-check

Quick check for Spring Boot violations.

## Usage

```bash
node /Users/Aditya/CommandCode/springguard/bin/springguard.js check /path/to/project
```

## Exit Codes

- `0`: No violations
- `1`: Violations found

## When to Use

- Pre-commit hooks
- CI/CD pipelines
- Quick validation

## Example

```bash
# In CI/CD
springguard check . || exit 1

# Pre-commit hook
#!/bin/bash
springguard check .
if [ $? -ne 0 ]; then
  echo "Fix violations before committing"
  exit 1
fi
```
