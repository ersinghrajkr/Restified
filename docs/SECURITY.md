# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

The Restified team takes security bugs seriously. We appreciate your efforts to responsibly disclose your findings, and will make every effort to acknowledge your contributions.

To report a security issue, please use the GitHub Security Advisory ["Report a Vulnerability"](https://github.com/ersinghrajkr/Restified/security/advisories/new) tab.

The Restified team will send a response indicating the next steps in handling your report. After the initial reply to your report, the security team will keep you informed of the progress towards a fix and full announcement, and may ask for additional information or guidance.

## What to Include

When reporting security issues, please include the following information:

- Type of issue (e.g. buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit the issue

## Security Considerations for Users

When using Restified, please be aware of the following security considerations:

### API Keys and Tokens

- Never hardcode API keys, tokens, or credentials in your test files
- Use environment variables or secure configuration files
- Add `.env` files to your `.gitignore`
- Consider using secure vaults for sensitive credentials

### Test Data

- Be cautious about using real production data in tests
- Use faker.js or similar libraries to generate realistic test data
- Avoid exposing sensitive information in test reports

### Network Security

- Be careful when testing against production APIs
- Consider using VPNs or secure networks for API testing
- Validate SSL/TLS certificates in production environments

### Reporting Security

- Consider security implications when generating and sharing test reports
- Be mindful of what information is logged or reported
- Sanitize sensitive data from test outputs

## Known Security Considerations

### Environment Variable Exposure

Restified supports environment variable substitution in configuration. Be careful not to expose sensitive environment variables in logs or reports.

### Request/Response Logging

By default, Restified may log request and response data for debugging. Ensure sensitive data is not logged in production environments.

### File System Access

The CLI and configuration system have file system access. Ensure proper permissions are set on configuration files and output directories.

## Security Updates

Security updates will be released as patch versions and announced through:

- GitHub Security Advisories
- Release notes
- NPM security notifications

## Best Practices

1. **Keep Dependencies Updated**: Regularly update Restified and its dependencies
2. **Secure Configuration**: Store sensitive configuration securely
3. **Network Isolation**: Run tests in isolated network environments when possible
4. **Data Sanitization**: Sanitize sensitive data from logs and reports
5. **Access Control**: Implement proper access controls for test environments

## Contact

If you have any questions about this security policy, please contact the maintainers at:

- **Email**: er.singhrajkr@gmail.com
- **GitHub**: [@ersinghrajkr](https://github.com/ersinghrajkr)

## Acknowledgments

We would like to thank the following individuals for their responsible disclosure of security vulnerabilities:

*None yet - be the first to help make Restified more secure!*

---

*This security policy is adapted from the [GitHub Security Lab](https://securitylab.github.com/advisories) template.*