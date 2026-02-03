# Summary: How to Add New Models/Providers to OpenCode

## Research Findings

Based on investigation of the OpenCode repository and example PRs, here's what I discovered about adding new models and providers:

## Key Findings

### 1. Models.dev is Central to the Architecture

- **Models.dev** is a separate service (https://models.dev) that provides a JSON API
- OpenCode fetches provider/model metadata from `https://models.dev/api.json`
- Data is cached locally at `~/.local/share/opencode/cache/models.json`
- Refreshes every 60 minutes during runtime
- Provides: pricing, context limits, capabilities, model features

### 2. Three Ways to Add a Provider

#### Option A: OpenCode-Only (Single PR)
**When to use:** Provider already exists on models.dev OR you're adding custom integration

**Example:** [PR #1 - Puter Provider](https://github.com/velzie/opencode/pull/1)

**Files changed:**
- `packages/opencode/src/provider/provider.ts` - Add custom loader
- `packages/ui/src/components/provider-icons/sprite.svg` - Add icon
- `packages/ui/src/components/provider-icons/types.ts` - Register icon
- `packages/opencode/src/cli/cmd/auth.ts` - Add auth hints (optional)
- `packages/web/src/content/docs/providers.mdx` - Add documentation

**Timeline:** 1-3 days for review and merge

#### Option B: Models.dev + OpenCode (Two PRs)
**When to use:** Completely new provider that needs full model catalog

**Process:**
1. Submit PR to models.dev repository with provider/model definitions
2. Wait for approval and merge (3-7 days)
3. Submit PR to OpenCode with integration code (1-3 days)

**Timeline:** 1-2 weeks total

#### Option C: Custom Config (No PR)
**When to use:** Personal/internal use, no contribution needed

**Method:** Add provider config to `opencode.json`:

```json
{
  "provider": {
    "myprovider": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "My Provider",
      "options": {
        "baseURL": "https://api.myprovider.com/v1"
      },
      "models": {
        "model-name": {
          "limit": { "context": 128000, "output": 4096 }
        }
      }
    }
  }
}
```

### 3. Real Example: Puter Provider Integration

The Puter PR demonstrates the standard pattern:

**Added custom loader with headers:**
```typescript
puter: async () => {
  return {
    autoload: false,
    options: {
      headers: {
        "HTTP-Referer": "https://opencode.ai/",
        "X-Title": "opencode",
      },
    },
  }
},
```

**Added auth hint:**
```typescript
if (provider === "puter") {
  prompts.log.info("Get your API key at https://puter.com/?action=copyauth")
}
```

**This follows the same pattern as other providers like Vercel, Cloudflare, and OpenRouter.**

## Answer to Original Question

> "Do they go through models.dev? Two PRs?"

**Answer:** It depends on the provider:

1. **If provider exists on models.dev:** Single PR to OpenCode
2. **If provider is new AND you want full metadata:** Two PRs (models.dev first, then OpenCode)
3. **If just for personal use:** No PR needed (config-only)

Most community contributions are **single PR** because:
- Many providers already exist on models.dev
- Contributors just need to add integration code to OpenCode
- Custom loaders handle provider-specific requirements (headers, auth, etc.)

## Documentation Created

I've created comprehensive documentation at:
- **`ADDING_PROVIDERS_MODELS.md`** - Complete guide with:
  - Overview of architecture
  - Models.dev integration explanation
  - Three approaches with examples
  - Step-by-step instructions
  - Code examples
  - Decision tree
  - Timeline estimates
  - Real PR references

## How You Would Add a Provider

1. **Check if provider exists:**
   ```bash
   curl https://models.dev/api.json | grep -i "provider-name"
   ```

2. **Fork OpenCode and create branch:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/opencode.git
   git checkout -b feat/add-provider-name
   ```

3. **Add custom loader** in `packages/opencode/src/provider/provider.ts`

4. **Add provider icon** to `packages/ui/src/components/provider-icons/`

5. **Add auth hints** in `packages/opencode/src/cli/cmd/auth.ts` (optional)

6. **Update docs** in `packages/web/src/content/docs/providers.mdx`

7. **Test locally:**
   ```bash
   bun dev
   # Test /connect and /models commands
   ```

8. **Submit PR** following the pattern from PR #1

## References

- **Example PR:** https://github.com/velzie/opencode/pull/1
- **Models.dev:** https://models.dev
- **Full Guide:** `ADDING_PROVIDERS_MODELS.md`
- **Contributing:** `CONTRIBUTING.md`

---

*Generated: 2026-02-03*
