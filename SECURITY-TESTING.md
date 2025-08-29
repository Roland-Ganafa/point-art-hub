# Point Art Hub Security Testing Guide

This guide explains how to run security tests for the Point Art Hub application to identify and address potential security vulnerabilities.

## Available Security Tests

The Point Art Hub project includes several security testing scripts to help identify potential security issues:

1. **NPM Audit Test**: Checks for vulnerabilities in dependencies
2. **Core Security Tests**: Tests authentication, authorization, and data security
3. **Security Headers Test**: Analyzes HTML and headers for security best practices
4. **Codebase Security Scan**: Scans the codebase for common security vulnerabilities

## Running Security Tests

### Basic Security Test

This runs a basic security test that checks for vulnerabilities in dependencies and performs basic security checks:

```bash
npm run test:security
```

### Security Headers Test

This analyzes HTML and headers for security best practices:

```bash
npm run test:security:headers
```

### Codebase Security Scan

This scans the codebase for common security vulnerabilities:

```bash
npm run test:security:codebase
```

### All Security Tests

To run all security tests:

```bash
npm run test:security:all
```

## Understanding Test Results

The security tests will output results in the terminal with color-coded messages:

- **GREEN** (✓ SUCCESS): No issues found
- **YELLOW** (⚠ WARNING): Potential issues that should be reviewed
- **RED** (✗ ERROR): Serious issues that should be addressed

## Common Security Issues and Fixes

### Dependency Vulnerabilities

If `npm audit` reports vulnerabilities, you can attempt to fix them with:

```bash
npm audit fix
```

For major version updates that may include breaking changes:

```bash
npm audit fix --force
```

### Content Security Policy (CSP)

If the security headers test reports missing CSP, consider adding a CSP meta tag to your HTML:

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self';">
```

### Other Security Headers

Consider adding these security headers in your HTML:

```html
<meta http-equiv="X-Content-Type-Options" content="nosniff">
<meta http-equiv="X-Frame-Options" content="DENY">
<meta name="referrer" content="same-origin">
```

### Code Vulnerabilities

For code vulnerabilities detected by the codebase scan:

1. **Hardcoded Credentials**: Move all credentials to environment variables
2. **Cross-site Scripting (XSS)**: Avoid using `dangerouslySetInnerHTML` or `innerHTML`
3. **Insecure Authentication**: Implement proper session management
4. **SQL Injection**: Use parameterized queries instead of string concatenation
5. **Sensitive Data Exposure**: Avoid logging sensitive information

## Security Best Practices

1. **Keep Dependencies Updated**: Regularly run `npm audit` and update dependencies
2. **Implement Proper Authentication**: Use Supabase authentication with proper session management
3. **Use Row-Level Security (RLS)**: Apply RLS policies to protect database resources
4. **Validate User Input**: Always validate and sanitize user input
5. **Implement Content Security Policy**: Use CSP to prevent XSS attacks
6. **Secure Storage**: Never store sensitive information in local storage
7. **HTTPS Only**: Always use HTTPS in production
8. **Regular Testing**: Run security tests regularly

## Resources

- [OWASP Top Ten](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Web Security Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#security)