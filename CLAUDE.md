# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Build**: `pnpm run build` - Builds all packages
- **Test**: `pnpm run test` - Runs Vitest tests on core package
- **Test Single File**: `pnpm --filter @brutoneto/core run test net-to-gross` - Run specific test file
- **Lint**: `pnpm run lint` - Runs ESLint across all packages
- **Format**: `pnpm run format` - Auto-fix ESLint issues across all packages
- **Generate Tax Data**: `pnpm run generate` - Scrapes and generates Croatian tax rate data
- **Clean**: `pnpm run clean` - Remove all dist/, .output/, and cache directories

### Development Commands
- **Dev All**: `pnpm run dev` - Start all packages in dev mode (parallel)
- **Core Dev**: `pnpm --filter @brutoneto/core run dev` - Run core package with Bun
- **API Dev**: `pnpm --filter @brutoneto/api run dev` - Start API server in dev mode
- **API Preview**: `pnpm run preview` - Start API in production preview mode

### Package-Specific Commands
- **Core Build**: `pnpm --filter @brutoneto/core run build` - Build TypeScript to dist/ with declarations
- **Core Bump**: `pnpm --filter @brutoneto/core run bump` - Bump version using bumpp
- **API Build**: `pnpm --filter @brutoneto/api run build` - Build Nitro API server

## Architecture

This is a **pnpm workspace monorepo** for Croatian salary calculations with **EUR currency** (Croatia adopted Euro). The project includes production-ready packages and development placeholders.

### Package Status
- **@brutoneto/core** (`packages/core/`) - ✅ **Production-ready** salary calculation engine
- **@brutoneto/api** (`packages/api/`) - ✅ **Production-ready** REST API service (Nitro)
- **@brutoneto/web** (`packages/web/`) - ❌ **Placeholder** Nuxt web interface
- **@brutoneto/cli** (`packages/cli/`) - ❌ **Placeholder** command-line tool

### Core Package Architecture (`packages/core/`)
**Main entry**: `index.ts` - Exports all public APIs

**Key calculations**:
- `grossToNet(gross, options?)` - Simple gross-to-net conversion
- `grossToNetBreakdown(gross, options?)` - Detailed breakdown with all tax components
- `netToGross(net, options?)` - Reverse calculation using binary search

**Source structure**:
- `src/calculations/` - Core salary computation logic
  - `gross-to-net.ts` - Primary calculation functions
  - `net-to-gross.ts` - Reverse calculation algorithm
  - `salary.ts` - Shared tax, pension, and allowance utilities
- `src/constants.ts` - 2025 tax rates, brackets (20%/30% at €5,000), allowances (€600 base)
- `src/places.ts` - Croatian location functions with surtax rates
- `src/data/` - Generated tax data (556+ locations) - **never manually edit**
- `src/lib/decimal.ts` - Configured Decimal.js wrapper for financial precision
- `src/utils.ts` - Exported utilities (clamp, isBetween, range, toDecimal)

### API Package Architecture (`packages/api/`)
**Framework**: Nitro (serverless Node.js)
**Documentation**: Available at `/_scalar` and `/_swagger` endpoints

**Key endpoints**:
- `GET /neto/{gross}` - Gross to net calculation
- `GET /bruto/{net}` - Net to gross calculation
- `GET /places` - All Croatian locations and tax rates
- `GET /taxes/*` - Tax system information

**Features**:
- Zod schema validation
- Support for place shortcuts, tax coefficients, third pillar contributions
- Detailed/simple response modes, yearly/monthly calculations
- Comprehensive error handling

### Croatian Tax System (2025)
- **Currency**: EUR (European Euro) with 2 decimal precision
- **Tax brackets**: 20% (up to €5,000), 30% (above €5,000)
- **Personal allowance**: €600 base with coefficient system (0.3-6.0)
- **Pension contributions**: 1st pillar (15%), 2nd pillar (5%)
- **Health insurance**: 16.5% of gross salary
- **Third pillar**: Optional up to €67/month
- **Surtax**: Location-specific rates (0-18%)

### Data Generation System
- **Script**: `scripts/gen-tax-rates.ts` - Scrapes Croatian government tax tables
- **Generates**:
  - `src/data/places.ts` - TypeScript types and location constants
  - `src/data/places.json` - Raw tax rate data
  - `src/data/places-metadata.json` - Location metadata
- **ESLint rule**: Prevents direct `decimal.js` imports (must use configured wrapper)

### Testing
- **Framework**: Vitest
- **Coverage**: Comprehensive tests for all calculation functions
- **Location**: Test files alongside source files (`.test.ts` suffix)
- **Run single test**: `pnpm --filter @brutoneto/core run test {filename}`
