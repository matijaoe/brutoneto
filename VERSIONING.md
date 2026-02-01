# Versioning Strategy

## 🎯 Current Strategy: Hybrid Versioning

This monorepo uses **different versioning strategies** for different packages based on their purpose:

### Package Versions

```
@brutoneto/core  → v1.1.0  ✅ Published to npm (public package)
@brutoneto/api   → v0.1.0  ❌ Private (deployed to Vercel)
@brutoneto/web   → v0.1.0  ❌ Private (deployed to Vercel)
```

---

## 📦 Core Package (Published to npm)

**Status**: Public npm package at https://www.npmjs.com/package/@brutoneto/core

### Versioning

Core has **independent versioning** because it's published to npm and can be used by external projects.

### How to Release Core

```bash
# 1. Make your changes to @brutoneto/core

# 2. Release new version (builds, bumps version, publishes to npm)
cd packages/core
pnpm run release

# This will:
# - Build the package (dist/)
# - Bump version (interactive: patch/minor/major)
# - Create git commit and tag
# - Publish to npm
```

Or manually:

```bash
# Build
pnpm --filter @brutoneto/core run build

# Bump version (interactive)
pnpm --filter @brutoneto/core run bump

# Or specify type
pnpm --filter @brutoneto/core run bump --patch  # 1.1.0 → 1.1.1
pnpm --filter @brutoneto/core run bump --minor  # 1.1.0 → 1.2.0
pnpm --filter @brutoneto/core run bump --major  # 1.1.0 → 2.0.0

# Publish to npm
cd packages/core
npm publish
```

### Core Dependency in API/Web

API and Web use Core via workspace protocol:

```json
{
  "dependencies": {
    "@brutoneto/core": "workspace:*"
  }
}
```

This means they **always use the local version** during development and deployment, not the npm version.

---

## 🌐 API & Web Packages (Deployed to Vercel)

**Status**: Private packages deployed together to Vercel

### Versioning

API and Web have **synchronized versioning** because they deploy together. Their versions don't affect npm or external consumers.

### How to Bump API/Web Versions

You can bump these manually when you want to track releases:

```bash
# Update version in package.json manually
# or use bumpp in each package

cd packages/api
npx bumpp --patch  # 0.1.0 → 0.1.1

cd packages/web
npx bumpp --patch  # 0.1.0 → 0.1.1
```

**Note**: These versions are for internal tracking only. They don't get published anywhere.

---

## 🚀 Deployment Workflow

### Scenario 1: Update Core (No API/Web Changes)

```bash
# 1. Update Core
cd packages/core
# make changes...

# 2. Release Core to npm
pnpm run release  # Builds, bumps, publishes

# 3. Push to GitHub
git push && git push --tags

# 4. Vercel auto-deploys (API/Web will use new Core via workspace:*)
```

### Scenario 2: Update API/Web Only

```bash
# 1. Make changes to API or Web
# (no Core changes)

# 2. Optional: Bump API/Web versions for tracking
cd packages/api
npx bumpp --patch

# 3. Commit and push
git add .
git commit -m "feat: update API endpoint"
git push

# 4. Vercel auto-deploys
```

### Scenario 3: Update Everything

```bash
# 1. Make changes to Core, API, and Web

# 2. Release Core to npm
cd packages/core
pnpm run release

# 3. Optional: Bump API/Web versions
cd ../api && npx bumpp --patch
cd ../web && npx bumpp --patch

# 4. Commit and push
git push && git push --tags

# 5. Vercel auto-deploys
```

---

## 📊 Version Synchronization

### Current Versions

| Package | Version | Published | Deployed |
|---------|---------|-----------|----------|
| `@brutoneto/core` | `1.1.0` | ✅ npm | ✅ Vercel (via workspace) |
| `@brutoneto/api` | `0.1.0` | ❌ | ✅ Vercel |
| `@brutoneto/web` | `0.1.0` | ❌ | ✅ Vercel |

### Why Different Strategies?

1. **Core is published to npm** → Needs semantic versioning for external consumers
2. **API/Web are private** → Versions are for internal tracking only
3. **Vercel deploys everything together** → Always uses latest workspace versions
4. **External apps can use Core from npm** → Requires stable, versioned releases

---

## 🔄 External Usage vs Deployment

### For External Developers (using Core from npm)

```bash
# Install published version from npm
npm install @brutoneto/core

# Use in their app
import { grossToNet } from '@brutoneto/core'
```

They get the **published npm version** (e.g., 1.1.0).

### For This Monorepo (Vercel deployment)

API and Web use:

```json
"@brutoneto/core": "workspace:*"
```

They get the **local workspace version** (whatever is in `packages/core/`), which may be ahead of npm.

---

## 📋 Quick Reference

| Task | Command | Location |
|------|---------|----------|
| Release Core to npm | `pnpm run release` | `packages/core/` |
| Bump Core version | `pnpm run bump` | `packages/core/` |
| Bump API version | `npx bumpp` | `packages/api/` |
| Bump Web version | `npx bumpp` | `packages/web/` |
| Build everything | `pnpm run build` | Root |
| Deploy to Vercel | `git push` | Root (auto-deploy) |

---

## 🎓 Summary

**Core**: Independent versioning, published to npm, semantic versioning matters  
**API/Web**: Internal versioning, not published, deploy together to Vercel

This hybrid approach gives you:
- ✅ Public npm package (Core) for external use
- ✅ Private deployment packages (API/Web) that use latest Core
- ✅ Flexibility to update Core without forcing API/Web changes
- ✅ Single deployment unit for the full application
