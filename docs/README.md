# 📚 RestifiedTS Documentation

Welcome to the comprehensive documentation for RestifiedTS - the enterprise-grade API testing framework.

## 🚀 **Getting Started**

Perfect for newcomers to RestifiedTS:

- **[⚙️ Installation](./getting-started/installation.md)** - Set up RestifiedTS in your project
- **[🚀 Quick Start Guide](./getting-started/quick-start.md)** - Your first test in 5 minutes
- **[📖 Basic Concepts](./getting-started/basic-concepts.md)** - Core concepts and terminology

## 🔧 **Configuration**

Master the configuration-driven approach:

- **[🔧 Configuration Guide](./CONFIG-BASED-SETUP.md)** - Complete guide to `restified.config.ts`
- **[🔐 Authentication Setup](./AUTOMATIC-HEADERS-AUTH.md)** - Automatic auth token injection
- **[🏢 Enterprise Features](./ENTERPRISE-FEATURES.md)** - Enterprise-grade capabilities

## 📊 **Advanced Topics**

Deep dive into advanced features:

- **[📊 Reporting & Analytics](./REPORTING-MADE-EASY.md)** - Comprehensive reporting system
- **[👤 User Guide](./USER-GUIDE.md)** - Complete user reference
- **[🛡️ Security](./SECURITY.md)** - Security testing and compliance

## 🔧 **Development & Contributing**

For contributors and maintainers:

- **[🤝 Contributing](./CONTRIBUTING.md)** - How to contribute to RestifiedTS
- **[📝 Changelog](./CHANGELOG.md)** - Version history and updates
- **[🔧 Claude AI Instructions](./CLAUDE.md)** - AI assistant development guidelines

## 📋 **Quick Reference**

### **Configuration Patterns**

```typescript
// Basic configuration
const config: RestifiedConfig = {
  clients: {
    api: { baseURL: 'https://api.example.com' }
  },
  authentication: {
    endpoint: '/oauth/token',
    autoApplyToClients: 'all'
  }
};
```

### **Test Patterns**

```typescript
// Basic test
const response = await restified
  .given().useClient('api')
  .when().get('/users/1').execute();

await response
  .statusCode(200)
  .jsonPath('$.name', 'Expected Name')
  .execute();
```

### **Current Working Commands**

```bash
# Run comprehensive examples
npm run examples

# Generate HTML reports
npm run report

# Build framework
npm run build

# CLI (in development)
restifiedts init ProjectName    # Basic scaffolding
restifiedts generate test       # Template stubs
```

## 🏢 **Enterprise Documentation**

For enterprise deployments and large-scale usage:

### **Architecture Guides**
- Multi-tenant configuration
- Microservices testing patterns
- CI/CD integration strategies
- Performance and security testing

### **Compliance & Security**
- GDPR, SOX, HIPAA compliance
- Security testing automation
- Audit trail and reporting
- Data privacy and protection

### **Monitoring & Observability**
- Distributed tracing setup
- Metrics collection and analysis
- Performance monitoring
- Business intelligence reporting

## 🔍 **Find What You Need**

| **I want to...** | **Go to...** |
|------------------|--------------|
| Get started quickly | [Quick Start Guide](./getting-started/quick-start.md) |
| Set up authentication | [Authentication Setup](./AUTOMATIC-HEADERS-AUTH.md) |
| Configure for enterprise | [Enterprise Features](./ENTERPRISE-FEATURES.md) |
| Generate reports | [Reporting Guide](./REPORTING-MADE-EASY.md) |
| Contribute code | [Contributing Guide](./CONTRIBUTING.md) |
| See what's new | [Changelog](./CHANGELOG.md) |

## 🎯 **Documentation Feedback**

Found an error or have a suggestion? 

- **Create an issue**: [GitHub Issues](https://github.com/yourorg/restifiedts/issues)
- **Contribute**: [Contributing Guide](./CONTRIBUTING.md)
- **Enterprise support**: enterprise@restifiedts.com

---

**💡 Pro Tip**: Use the search function in your IDE or browser to quickly find specific topics across all documentation files.

---

**🚀 Ready to dive deeper? Start with the [Quick Start Guide](./getting-started/quick-start.md)!**