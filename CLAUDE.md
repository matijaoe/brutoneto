# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Build**: `pnpm run build` - Builds the core package using Bun
- **Test**: `pnpm run test` - Runs Vitest on core package 
- **Test Single File**: `pnpm --filter @brutoneto/core run test gross-to-net` - Run specific test file
- **Lint**: `pnpm run lint` - Runs ESLint with @antfu/eslint-config
- **Generate Tax Data**: `pnpm run generate` - Generates Croatian tax rate data from HTML tables

### Publishing
- **Bump Version**: `pnpm --filter @brutoneto/core run bump` - Bumps version using bumpp
- **Publish Core**: `pnpm --filter @brutoneto/core run release` - Bumps version and publishes to npm

### Core Package Development
- **Dev Mode**: `pnpm --filter @brutoneto/core run dev` - Runs src/index.ts with Bun
- **Core Build**: `pnpm --filter @brutoneto/core run build` - Builds TypeScript to dist/ with type definitions

## Architecture

This is a pnpm workspace monorepo for Croatian salary calculations (bruto/neto conversions). Only the core package contains implementation - other packages are minimal placeholders.

### Active Package
- **@brutoneto/core** (`packages/core/`) - Complete salary calculation engine and data generation
- **@brutoneto/cli**, **@brutoneto/api**, **@brutoneto/web** - Minimal placeholder packages with no implementation

### Core Package Architecture (`packages/core/`)
- **Main exports** (`index.ts`): Directly exports all public APIs from source files
- **Calculations** (`src/calculations/`): Core salary computation logic
  - `gross-to-net.ts`: Main calculations with `grossToNetBreakdown()` (comprehensive) and `grossToNet()` (simple)
  - `net-to-gross.ts`: Reverse calculation using binary search algorithm
  - `salary.ts`: Shared utilities for pension, tax, and allowance calculations
- **Places** (`src/places.ts`): Functions for Croatian location-based tax rates  
- **Constants** (`src/constants.ts`): Tax rates, brackets, and allowances for 2025
- **Data** (`src/data/`): Generated tax data - never manually edit these files
- **Utils** (`src/utils.ts`): Exported calculation utilities (clamp, isBetween, range, toDecimal)
- **Decimal wrapper** (`src/lib/decimal.ts`): Configured Decimal.js for precise financial calculations

### Data Generation System
- **Generator** (`scripts/gen-tax-rates.ts`): Parses HTML tables of Croatian tax rates to generate:
  - `src/data/places.ts`: TypeScript types and constants for all Croatian locations
  - `src/data/places.json`: Raw tax rate data  
- **ESLint rule**: Forbids raw `decimal.js` imports - must use the configured wrapper

### Calculation Model
Croatian salary calculations with:
- Personal allowance coefficients and two-bracket tax system (20%/30% at 5000 HRK threshold)
- Mandatory pension contributions (1st/2nd pillar) and health insurance
- Optional 3rd pillar pension contributions and location-specific surtax rates
