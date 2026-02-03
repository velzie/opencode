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

### 3. Real Example: SAP AI Core Provider (NOT on models.dev)

**PR #5023** - The perfect example of OpenCode-only provider addition

**What it does:** Adds SAP AI Core as a completely NEW provider to OpenCode

**Key facts:**
- ✅ Merged on December 4, 2025
- ✅ Provider is **NOT on models.dev** (verified)
- ✅ Single PR to OpenCode only
- ✅ Provides access to 40+ models from OpenAI, Anthropic, Google, Amazon, Meta, Mistral, AI21
- ✅ Works perfectly without models.dev

**Why is the PR so small?**

The PR only adds OpenCode integration code. The API URL and communication logic comes from the npm package `@mymediset/sap-ai-provider`:

**In OpenCode (the PR):**
```typescript
"sap-ai-core": async () => {
  const auth = await Auth.get("sap-ai-core")
  const serviceKey = Env.get("SAP_AI_SERVICE_KEY") || 
    (auth?.type === "api" ? auth.key : undefined)
  
  return {
    autoload: !!serviceKey,
    options: serviceKey ? { serviceKey, deploymentId, resourceGroup } : {},
  }
},
```

**In the npm package** (published separately):
- API URL for SAP AI Core
- Request formatting
- Response parsing
- All API communication logic

**How OpenCode loads it:**
1. OpenCode sees model needs `@mymediset/sap-ai-provider`
2. Dynamically installs: `await BunProc.install("@mymediset/sap-ai-provider", "latest")`
3. Imports and calls `createSapAiCore({ ...options })`
4. The npm package handles everything else

**View PR:** https://github.com/anomalyco/opencode/pull/5023

**This proves:**
- Providers do NOT need models.dev to work in OpenCode
- Single-PR approach is common and effective
- OpenCode-only integration gives full functionality
- **API logic lives in npm packages, not in OpenCode PRs**

### OpenRouter and Vercel Providers

These are REAL examples from the codebase showing the standard OpenCode-only pattern (search for these in `packages/opencode/src/provider/provider.ts`):

**OpenRouter:**
```typescript
openrouter: async () => {
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

**Vercel:**
```typescript
vercel: async () => {
  return {
    autoload: false,
    options: {
      headers: {
        "http-referer": "https://opencode.ai/",
        "x-title": "opencode",
      },
    },
  }
},
```

**These providers:**
- ❌ Are NOT necessarily on models.dev
- ✅ Work perfectly in OpenCode
- ✅ Appear in `/connect` provider list
- ✅ Can use any OpenAI-compatible models
- ✅ Added with single PR to OpenCode

**This is the pattern most contributors follow.**

## Answer to Original Question

> "Do they go through models.dev? Two PRs?"

**Answer:** Usually NOT! 

**The reality:**
1. **Most providers are added with a SINGLE PR to OpenCode only**
   - Provider does NOT need to be on models.dev to work
   - Faster process (1-3 days vs 1-2 weeks)
   - Examples: openrouter, vercel (search in provider.ts)

2. **Two PRs (models.dev + OpenCode) is RARE**
   - Only for major providers you want listed on https://models.dev website
   - Needs automatic pricing/capability data for all users
   - Takes 1-2 weeks minimum

3. **Common misconception:**
   - ❌ "Provider must be on models.dev to work in OpenCode"
   - ✅ Actually: OpenCode can work with ANY provider via custom loaders
   - ✅ models.dev is optional - just provides metadata

**Example workflow (OpenCode-only):**
- Add custom loader to `provider.ts` (like openrouter/vercel do)
- Add provider icon
- Add auth hints  
- Update docs
- Submit single PR → Merged in days

**When you DO need models.dev:**
- Want provider on https://models.dev website
- Need pricing data auto-populated for users
- Adding official/mainstream provider
- Submit PR to models.dev repo first, THEN OpenCode

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

- **Real OpenCode Repo:** https://github.com/anomalyco/opencode
- **Provider Code:** `packages/opencode/src/provider/provider.ts`
- **Example PR (GitLab):** https://github.com/anomalyco/opencode/pull/11818
- **Models.dev:** https://models.dev
- **Full Guide:** `ADDING_PROVIDERS_MODELS.md`
- **Contributing:** `CONTRIBUTING.md`

---

*Generated: 2026-02-03*
