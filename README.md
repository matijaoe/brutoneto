# brutoneto

Croatian salary calculation library (bruto/neto conversions) - now as a centralized monorepo with multiple packages.

## Packages

| Package | Description | Available |
|---------|-------------|-------------|
| `@brutoneto/core` | Pure salary calculation engine | ✅ |
| `@brutoneto/cli` | Command-line tool | ❌ |
| `@brutoneto/api` | REST API service | ✅ |
| `@brutoneto/web` | Web interface | ✅ |


## Preview

<img width="2102" height="1174" alt="CleanShot 2026-02-01 at 18 55 02@2x" src="https://github.com/user-attachments/assets/6d58cd46-100e-4f5e-805e-c8a037311156" />


## Installation

```bash
pnpm install
```

## Development

### Build all packages
```bash
pnpm run build
```

### Run tests
```bash
pnpm run test
```

### Lint all packages
```bash
pnpm run lint
```

### Generate tax data
```bash
pnpm run generate
```

### Run individual packages

**Web interface (Vue.js):**
```bash
pnpm run dev
# or
pnpm --filter @brutoneto/web run dev
```

**API service:**
```bash
pnpm run dev:api
# or
pnpm --filter @brutoneto/api run dev
```

**CLI tool:**
```bash
pnpm run dev:cli
# or
pnpm --filter @brutoneto/cli run dev
```

**Core library:**
```bash
pnpm --filter @brutoneto/core run dev
```

### Start production API
```bash
pnpm run start:api
```

## Package Development

To work on a specific package:

```bash
# Install dependencies for specific package
pnpm --filter @brutoneto/core install

# Build specific package
pnpm --filter @brutoneto/core run build

# Test specific package
pnpm --filter @brutoneto/core run test
```


