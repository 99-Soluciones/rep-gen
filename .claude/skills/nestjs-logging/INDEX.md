# 📚 Winston Logging Skill - Complete Resource Index

## Quick Navigation

### 🚀 Getting Started

- **[SKILL.md](./SKILL.md)** - Start here! Complete implementation guide with step-by-step instructions
- **[Quick Start for Developers](./references/LOGGER_QUICK_START.md)** - 5-minute reference for using the logger in your code

### 📖 Learning the System

- **[Winston Deep Dive](./references/winston-deep-dive.md)** - Visual flow diagrams + execution walkthrough (recommended for visual learners)
- **[Winston Cheat Sheet](./references/winston-cheatsheet.md)** - Exact code line-by-line mapeo with file paths (recommended for code-first learners)

### 💻 Implementation Examples

- **[Logger Examples & Best Practices](./references/LOGGER_EXAMPLES.ts)** - Code patterns, error handling, warnings
- **[Complete Implementation Guide](./references/LOGGER_IMPLEMENTATION.md)** - Comprehensive walkthrough (400+ lines)

### ⚙️ Configuration & Advanced

- **[Winston Configuration Reference](./references/winston-config.md)** - Log levels, transport options, format customization
- **[Testing Logging](./references/testing-logging.md)** - Unit tests & E2E tests examples

### 🔌 ELK Stack (Optional)

- **[ELK Stack Setup](./references/elk-stack-setup.md)** - Docker Compose configuration for Elasticsearch + Kibana
- **[Production Deployment Considerations](./references/LOGGER_IMPLEMENTATION.md#production-deployment)** - See LOGGER_IMPLEMENTATION.md

---

## Learning Paths

### 👨‍💻 For Backend Developers

1. **Start**: [SKILL.md](./SKILL.md) - Implement the logger
2. **Reference**: [Quick Start for Developers](./references/LOGGER_QUICK_START.md) - How to use it
3. **Examples**: [Logger Examples](./references/LOGGER_EXAMPLES.ts) - Real code patterns
4. **Deep Dive**: Choose your learning style:
   - Visual → [Deep Dive](./references/winston-deep-dive.md)
   - Code-focused → [Cheat Sheet](./references/winston-cheatsheet.md)

### 🏗️ For DevOps/Architecture

1. **Overview**: [SKILL.md](./SKILL.md) - System architecture
2. **Configuration**: [Winston Configuration](./references/winston-config.md) - Tuning options
3. **Deployment**: [ELK Stack Setup](./references/elk-stack-setup.md) - Production setup
4. **Optimization**: See "Performance Considerations" in Deep Dive/Cheat Sheet

### 🧪 For QA/Testing

1. **Testing**: [Testing Logging](./references/testing-logging.md) - Unit & E2E tests
2. **Examples**: [Logger Examples](./references/LOGGER_EXAMPLES.ts) - Error scenarios
3. **Architecture**: [Winston Deep Dive](./references/winston-deep-dive.md) - Understand flow

---

## Document Types

| Document                                                | Type        | Length     | Best For                                   |
| ------------------------------------------------------- | ----------- | ---------- | ------------------------------------------ |
| [SKILL.md](./SKILL.md)                                  | Guide       | 300+ lines | Implementation, setup                      |
| [Deep Dive](./references/winston-deep-dive.md)          | Learning    | 600+ lines | Understanding architecture visually        |
| [Cheat Sheet](./references/winston-cheatsheet.md)       | Reference   | 500+ lines | Code-first learning, line-by-line analysis |
| [Quick Start](./references/LOGGER_QUICK_START.md)       | Cheat Sheet | 100 lines  | Daily usage reference                      |
| [Examples](./references/LOGGER_EXAMPLES.ts)             | Code        | 200+ lines | Copy-paste patterns                        |
| [Testing](./references/testing-logging.md)              | Guide       | 200+ lines | Writing tests                              |
| [Winston Config](./references/winston-config.md)        | Reference   | 150+ lines | Advanced tuning                            |
| [ELK Stack](./references/elk-stack-setup.md)            | Guide       | 100+ lines | Production monitoring                      |
| [Implementation](./references/LOGGER_IMPLEMENTATION.md) | Guide       | 400+ lines | Complete walkthrough                       |

---

## Core Files in Codebase

```
src/common/logger/
├── logger.service.ts          ← Main injectable logger with 3 transports
├── http-logger.middleware.ts  ← Auto-logs all HTTP requests
├── logger.module.ts           ← NestJS module for dependency injection
└── index.ts                   ← Barrel exports

src/
└── app.module.ts              ← Modified to register middleware

.env                           ← Configuration (LOG_LEVEL, LOG_DIR, etc)

logs/                          ← Generated at runtime
├── combined-2026-05-07.log    ← All logs (info, warn, error)
├── error-2026-05-07.log       ← Errors only
└── ...                        ← Rotated by date
```

---

## Key Concepts at a Glance

### 3 Transport Pipeline

```
HTTP Request
    ↓
HTTP Middleware captures
    ↓
logger.info() called
    ↓
Winston receives
    ↓
┌────────────────────────────────────┐
│      Formats Applied Globally      │
│ - Timestamp - Errors - JSON        │
└────────────────────────────────────┘
    ↓
Distributed to 3 Transports:
├─→ Console (immediate, colored)
├─→ combined-*.log (JSON, all levels)
└─→ error-*.log (JSON, errors only)
```

### Log Levels

```
debug < info < warn < error

Default LOG_LEVEL in .env = 'info'
Means: debug is ignored, info/warn/error pass through
```

### When to Use Each

- `logger.debug()` - Detailed development info (only if LOG_LEVEL=debug)
- `logger.info()` - Normal operations, requests, milestones
- `logger.warn()` - Potential issues, deprecated features
- `logger.error()` - Failures, exceptions, problems to fix

---

## Troubleshooting Quick Reference

| Issue                         | Check This                                        | Document              |
| ----------------------------- | ------------------------------------------------- | --------------------- |
| Logs not appearing            | Verify HTTP middleware registered in AppModule    | SKILL.md              |
| Only seeing console, no files | Logs are async, wait 1sec, files may have created | Cheat Sheet           |
| Wrong log format              | Check LOG_LEVEL in .env                           | LOGGER_QUICK_START.md |
| Performance issues            | See "Performance Considerations" section          | Deep Dive             |
| Need to test logging          | See testing examples                              | testing-logging.md    |
| Want to add ELK               | See Docker Compose setup                          | elk-stack-setup.md    |

---

## Version Information

- **Winston**: 3.19.0
- **NestJS**: 11.1.19
- **winston-daily-rotate-file**: 5.0.0
- **@elastic/elasticsearch**: 9.4.0 (optional, for ELK)
- **Node.js**: 18+ recommended

---

## Next Steps

1. **Implement**: Follow [SKILL.md](./SKILL.md) if not done
2. **Understand**: Choose [Deep Dive](./references/winston-deep-dive.md) or [Cheat Sheet](./references/winston-cheatsheet.md)
3. **Use**: Reference [Quick Start](./references/LOGGER_QUICK_START.md) for daily coding
4. **Scale**: When ready for production, see [ELK Stack Setup](./references/elk-stack-setup.md)

---

**Created**: ReportesEjemplo Backend  
**Status**: ✅ Production Ready  
**Last Updated**: This Index
