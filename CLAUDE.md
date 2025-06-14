# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Build**: `bun run build` - Builds TypeScript to dist/ with type definitions
- **Lint**: `bun run lint` - Runs ESLint
- **Format**: `bun run format` - Auto-fixes ESLint issues
- **Generate Tax Data**: `bun run generate` - Generates Croatian tax rate data from HTML tables
- **Development**: `bun run dev` - Runs the development version

## Architecture

This is a TypeScript library for Croatian salary calculations (bruto/neto conversions). Key components:

### Core Structure
- **Main exports** (`index.ts`): Directly exports all public APIs from source files
- **Calculations** (`src/calculations/`): Core salary computation logic
  - `gross-to-net.ts`: Main salary calculations
    - `grossToNetBreakdown()`: Comprehensive function with detailed breakdown
    - `grossToNet()`: Simplified version (faster, returns only net amount)
    - `handleThirdPillar()`: Utility for third pillar validation
  - `net-to-gross.ts`: Reverse calculation using binary search
  - `salary.ts`: Shared calculation utilities (pension, tax, allowances)
- **Places** (`src/places.ts`): Functions for Croatian location-based tax rates
- **Constants** (`src/constants.ts`): Tax rates, brackets, and allowances for 2025
- **Data** (`src/data/`): Generated tax data (not manually edited)
- **Utils** (`src/utils.ts`): Exported utilities for salary calculations (clamp, isBetween, range, toDecimal)
- **Scripts** (`scripts/`): Development-only utilities
  - `utils.ts`: Internal utilities only for generation (writeFile, convertFromPercentage, etc.)

### Generated Code
- **Tax data generation** (`scripts/gen-tax-rates.ts`): Parses HTML tables of Croatian tax rates and generates:
  - `src/data/places.ts`: TypeScript types and constants for all Croatian locations
  - `src/data/places.json`: Raw tax rate data (renamed from porezi.json)
- Generated files should not be manually edited

### Key Dependencies
- **Decimal.js**: For precise financial calculations
- **Bun**: Runtime and package manager
- Uses ESLint with @antfu/eslint-config for code style

### Tax Calculation Flow
The library calculates Croatian salary taxes considering:
- Personal allowance coefficients
- Two-bracket tax system (20% low, 30% high at 5000 HRK threshold)
- Mandatory pension contributions (1st and 2nd pillar)
- Health insurance contributions
- Optional 3rd pillar pension contributions
- Location-specific tax rates (surtax)
