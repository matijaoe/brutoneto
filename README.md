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

<img width="2982" height="1730" alt="Preview" src="https://github.com/user-attachments/assets/330edcd7-f2b8-43ff-9c02-b64a8abc067f" />



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


