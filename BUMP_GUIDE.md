# Quick Reference - Version Bumping

## 🚀 Easy Commands (From Root)

```bash
# Bump individual packages
pnpm run bump:core        # Bump Core (interactive)
pnpm run bump:api         # Bump API (interactive)
pnpm run bump:web         # Bump Web (interactive)

# Bump API + Web together
pnpm run bump:packages    # Bumps both at once

# Release Core to npm
pnpm run release:core     # Build → bump → publish
```

---

## 📋 When to Bump What

### Core (npm package - v1.1.0)

**Bump when:**
- ✅ Dependencies updated (even dev deps) → **patch**
- ✅ Bug fixes in calculations → **patch**
- ✅ New functions added → **minor**
- ✅ Breaking API changes → **major**

**Command:**
```bash
pnpm run bump:core     # Interactive choice
# or
pnpm run release:core  # Builds, bumps, publishes to npm
```

### API & Web (Vercel deployments - v0.1.0)

**Bump when:**
- ✅ After dependency updates → **patch**
- ✅ Bug fixes → **patch**
- ✅ New features → **minor**
- ✅ Breaking changes → **major**

**Commands:**
```bash
# Bump both together (recommended)
pnpm run bump:packages

# Or individually
pnpm run bump:api
pnpm run bump:web
```

---

## 🎯 Typical Workflow

### Scenario 1: Just Updated Dependencies

```bash
# 1. Bump versions
pnpm run bump:core       # Choose "patch"
pnpm run bump:packages   # Choose "patch" for both

# 2. Commit version bumps
git add .
git commit -m "chore: bump versions to x.x.x"

# 3. Push (triggers Vercel deployment)
git push && git push --tags
```

### Scenario 2: Added New Feature

```bash
# 1. Bump versions
pnpm run bump:api        # Choose "minor"
pnpm run bump:web        # Choose "minor" (if changed)

# 2. Commit & push
git add .
git commit -m "chore: bump API to v0.2.0"
git push && git push --tags
```

### Scenario 3: Core API Change

```bash
# 1. Release Core to npm
pnpm run release:core    # Choose version type

# 2. Bump API/Web if they use new Core features
pnpm run bump:packages   # Choose "minor" or "patch"

# 3. Commit & push
git add .
git commit -m "chore: release Core v1.2.0, bump packages"
git push && git push --tags
```

---

## ⚡ Quick Tips

- **bumpp is interactive** - it will ask you to choose patch/minor/major
- **Always bump before merging PR** - keeps version changes with the code
- **Core publishes to npm** - others can `npm install @brutoneto/core`
- **API/Web deploy to Vercel** - versions are for internal tracking
- **Use `bump:packages`** to bump both API & Web at once

---

## 🔍 Check Current Versions

```bash
# View all versions
pnpm list --depth=0 --workspace

# Or check package.json files
cat packages/core/package.json | grep version
cat packages/api/package.json | grep version
cat packages/web/package.json | grep version
```
