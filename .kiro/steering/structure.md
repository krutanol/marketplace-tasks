# Project Structure

## Current Structure

```
marketplace/
├── .kiro/
│   └── steering/         # AI assistant steering rules
├── src/                  # Application source code
│   ├── components/       # Reusable UI components
│   ├── pages/            # Route-level views or page components
│   ├── features/         # Feature-scoped modules (listings, orders, users, etc.)
│   ├── services/         # API clients, external integrations
│   ├── utils/            # Shared utilities and helpers
│   └── types/            # Shared type definitions
├── tests/                # Test files (mirror src/ structure)
├── public/               # Static assets
└── docs/                 # Project documentation
```

## Conventions (Defaults — Update as Needed)

- **Feature modules**: Group related logic (components, hooks, services, types) by domain feature rather than by technical layer
- **Naming**: Use `kebab-case` for files and directories; `PascalCase` for components/classes; `camelCase` for functions and variables
- **Tests**: Co-locate unit tests with source files or mirror structure under `tests/`
- **Environment config**: Use `.env` files for environment-specific values; never commit secrets
- **Imports**: Prefer absolute imports over deep relative paths once path aliases are configured
