# CLAUDE.md

Guide for working with this repository.

## Quick Commands

```bash
pnpm run dev              # Start all (API:4000, Web:3000, Tests:watch)
pnpm run build            # Build all packages
pnpm run ci               # Full CI: lint, typecheck, test, build
pnpm run preview:prod     # Test production locally (port 8080)
pnpm run clean            # Remove all build outputs
```

## Versioning & Releases

**Quick commands**: See `BUMP_GUIDE.md` for all bump commands and workflows

- `pnpm run release:core` - Build → bump → publish Core to npm
- `pnpm run bump:packages` - Bump API + Web together

## Package Commands

```bash
# Core (npm package)
pnpm --filter @brutoneto/core run dev      # Tests in watch mode
pnpm --filter @brutoneto/core run build    # Build to dist/
pnpm --filter @brutoneto/core run release  # Build → bump → publish to npm

# API 
pnpm run dev:api          # Start API dev server (port 4000)
pnpm run build:api        # Build Nitro serverless

# Web
pnpm run dev:web          # Start Nuxt dev (port 3000)
pnpm run build:web        # Build Nuxt SSR
```

## Architecture

**Monorepo**: pnpm workspace for Croatian salary calculations (EUR currency)

### Packages

| Package | Status | Purpose |
|---------|--------|---------|
| `@brutoneto/core` | ✅ Published to npm | Calculation engine |
| `@brutoneto/api` | ✅ Deployed to Vercel | REST API (Nitro) |
| `@brutoneto/web` | 🚧 In development | Nuxt interface |



### Versioning

- **Core**: Independent versioning, published to npm (https://www.npmjs.com/package/@brutoneto/core)
  - Semantic versioning for external consumers
  - Release: `pnpm run release:core` (builds, bumps, publishes)
- **API/Web**: Internal tracking, deployed together to Vercel
  - Versions don't affect npm or external consumers
  - Bump: `pnpm run bump:packages`
- **Dependency Strategy**: API/Web use `workspace:*` for Core
  - Always use **local workspace version** (not npm version)
  - Vercel deployments get latest Core from monorepo, not npm
  - External apps installing `@brutoneto/core` get published npm version
- **Commands & Workflows**: See `BUMP_GUIDE.md` for complete guide

### Deployment (Vercel)

- **Build**: Node.js 24.x, runs `pnpm run build`
- **Routes**: `/api/*` → API function, `/*` → Web SSR
- **Config**: `vercel.json` with `nodejs24.x` runtime

## Core Package

**Entry**: `index.ts`

**Main functions**:
- `grossToNet(gross, opts?)` - Salary → net income
- `grossToNetBreakdown(gross, opts?)` - Detailed breakdown
- `netToGross(net, opts?)` - Reverse calculation (binary search)

**Structure**:
```
src/
├── calculations/  # Core logic (gross-to-net, net-to-gross, salary)
├── constants.ts   # 2025 tax rates (20%/30% brackets at €5k)
├── places.ts      # Croatian locations + surtax rates
├── data/          # Generated tax data (556+ locations) - DO NOT EDIT
├── lib/decimal.ts # Configured Decimal.js wrapper
└── utils.ts       # Utilities (clamp, isBetween, range, toDecimal)
```

**Data generation**: `pnpm run generate` scrapes Croatian government tax tables

**ESLint rule**: Never import `decimal.js` directly, use `src/lib/decimal.ts`

## API Package (Nitro)

**Endpoints**:
- `GET /neto/{gross}` - Gross → net
- `GET /bruto/{net}` - Net → gross
- `GET /places` - All locations
- `GET /taxes/*` - Tax info
- Docs: `/_scalar`, `/_swagger`

**Features**: Zod validation, place shortcuts, coefficients, third pillar, detailed/simple modes

## Testing

- **Framework**: Vitest
- **Location**: `.test.ts` files alongside source
- **Watch**: `pnpm run test:watch`
- **Single file**: `pnpm --filter @brutoneto/core run test {filename}`
