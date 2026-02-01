# CLAUDE.md

Guide for working with this repository.

## Quick Commands

```bash
pnpm run dev              # Start all (API:4000, Web:3000, Tests:watch)
pnpm run build            # Build all packages
pnpm run ci               # Full CI: lint, typecheck, test, build
pnpm run preview:prod     # Test production locally (port 8080)
pnpm run kill-ports       # Kill stuck dev processes
pnpm run clean            # Remove all build outputs
```

## Versioning & Releases

```bash
# From root - easy bump commands
pnpm run bump:core        # Bump Core (interactive: patch/minor/major)
pnpm run bump:api         # Bump API
pnpm run bump:web         # Bump Web
pnpm run bump:packages    # Bump both API and Web together
pnpm run release:core     # Build → bump → publish Core to npm

# When to bump:
# - Core: When dependencies change OR public API changes
# - API/Web: After merging changes (patch for maintenance, minor for features)
```

## Package Commands

```bash
# Core (npm package)
pnpm --filter @brutoneto/core run dev      # Tests in watch mode
pnpm --filter @brutoneto/core run build    # Build to dist/
pnpm --filter @brutoneto/core run release  # Build → bump → publish to npm

# API (Vercel)
pnpm run dev:api          # Start API dev server (port 4000)
pnpm run build:api        # Build Nitro serverless

# Web (Vercel)
pnpm run dev:web          # Start Nuxt dev (port 3000)
pnpm run build:web        # Build Nuxt SSR
```

## Architecture

**Monorepo**: pnpm workspace for Croatian salary calculations (EUR currency)

### Packages

| Package | Version | Status | Purpose |
|---------|---------|--------|---------|
| `@brutoneto/core` | 1.1.0 | ✅ Published to npm | Calculation engine |
| `@brutoneto/api` | 0.1.0 | ✅ Deployed to Vercel | REST API (Nitro) |
| `@brutoneto/web` | 0.1.0 | 🚧 In development | Nuxt interface |

### Versioning

- **Core**: Independent, published to npm, semantic versioning
- **API/Web**: Internal tracking, deployed together, use `workspace:*` for Core
- See `VERSIONING.md` for workflows

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

## Croatian Tax System (2025)

- **Currency**: EUR
- **Brackets**: 20% (≤€5,000), 30% (>€5,000)
- **Allowance**: €600 base, coefficient 0.3-6.0
- **Pension**: 1st pillar 15%, 2nd pillar 5%
- **Health**: 16.5% of gross
- **Third pillar**: Optional up to €67/month
- **Surtax**: 0-18% (location-specific)

## Testing

- **Framework**: Vitest
- **Location**: `.test.ts` files alongside source
- **Watch**: `pnpm run test:watch`
- **Single file**: `pnpm --filter @brutoneto/core run test {filename}`

## Troubleshooting

**Port errors**: Run `pnpm run kill-ports` before starting dev servers
