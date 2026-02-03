# Adding New Models and Providers to OpenCode

This guide explains how contributors add new models and providers to OpenCode, including the relationship with models.dev and example PRs.

## Quick Start

**Want to add a provider?** Here are your options:

1. **Just for you?** → Use [custom provider config](#approach-3-custom-provider-config-only) (no PR needed)
2. **Provider exists on models.dev?** → [Single PR to OpenCode](#approach-1-opencode-only-single-pr)
3. **Completely new provider?** → [Two PRs](#approach-2-modelsdev--opencode-two-prs) (models.dev first, then OpenCode)

**Example:** See [PR #1 - Adding Puter Provider](https://github.com/velzie/opencode/pull/1) for a complete example.

## Table of Contents
- [Overview](#overview)
- [Models.dev Integration](#modelsdev-integration)
- [Adding a Provider](#adding-a-provider)
- [Example PRs](#example-prs)
- [Process Summary](#process-summary)

---

## Overview

OpenCode uses the [AI SDK](https://ai-sdk.dev/) and [Models.dev](https://models.dev) to support 75+ LLM providers. The architecture involves:

1. **Models.dev** - A centralized registry of provider and model metadata (pricing, capabilities, limits)
2. **OpenCode Repository** - Provider integration code and UI components
3. **AI SDK Packages** - npm packages that handle the actual API communication

## Models.dev Integration

### What is Models.dev?

Models.dev is a JSON API that provides a centralized database of:
- Provider information (API endpoints, authentication methods)
- Model metadata (context limits, pricing, capabilities)
- Model features (tool calling, attachments, reasoning, etc.)

### How OpenCode Uses Models.dev

OpenCode fetches and caches model data from `https://models.dev/api.json`:

```typescript
// packages/opencode/src/provider/models.ts
export async function refresh() {
  const result = await fetch(`https://models.dev/api.json`)
  await Bun.write(file, await result.text())
}
```

This data is:
- Cached locally at `~/.local/share/opencode/cache/models.json`
- Refreshed every 60 minutes during runtime
- Used to populate the `/models` UI with accurate information

### When Do You Need Models.dev?

**You DO need models.dev** if you want:
- Model information to appear in the `/models` UI selection
- Automatic pricing information
- Context window and output limit tracking
- Model capability badges (reasoning, attachments, etc.)

**You DON'T need models.dev** if:
- You're only adding OpenCode integration code (provider works via custom config)
- You're adding a custom/internal provider for personal use
- The provider is already on models.dev and you just need OpenCode integration

## Adding a Provider

There are **two main approaches** depending on whether the provider needs models.dev support:

### Approach 1: OpenCode-Only (Single PR)

Use this approach when:
- The provider already exists on models.dev
- You're adding a niche/custom provider for configuration-based use
- You want to add provider-specific features (custom headers, auth flows)

**Steps:**

1. **Add the provider loader** in `packages/opencode/src/provider/provider.ts`:

```typescript
const CUSTOM_LOADERS: Record<string, CustomLoader> = {
  // ... existing loaders
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
}
```

2. **Add auth hints** in `packages/opencode/src/cli/cmd/auth.ts` (if needed):

```typescript
if (provider === "puter") {
  prompts.log.info("Get your API key at https://puter.com/?action=copyauth")
}
```

3. **Add provider icon** to `packages/ui/src/components/provider-icons/`:
   - Add SVG symbol to `sprite.svg`
   - Register name in `types.ts`

4. **Update documentation** in `packages/web/src/content/docs/providers.mdx`:
   - Add provider section with setup instructions
   - Include example configuration

**Example PR:** [#1 - feat(provider): Add Puter integration](https://github.com/velzie/opencode/pull/1)

### Approach 2: Models.dev + OpenCode (Two PRs)

Use this approach when adding a completely new provider that should have:
- Full model catalog with pricing
- Capability tracking
- Official support in the UI

**Steps:**

1. **First PR: Submit to Models.dev**
   - Fork the models.dev repository
   - Add provider and model definitions following their schema
   - Submit PR for review
   - Wait for approval and merge

2. **Second PR: OpenCode Integration**
   - Once models.dev is updated, OpenCode will automatically pull the data
   - Add any custom loader logic if needed (headers, auth, etc.)
   - Add provider icon and UI components
   - Update documentation

**When to use this:** Adding major new providers (e.g., new AI company, new model family)

### Approach 3: Custom Provider (Config-Only)

Users can add providers without any code changes using `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "myprovider": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "My AI Provider",
      "options": {
        "baseURL": "https://api.myprovider.com/v1",
        "apiKey": "{env:MY_PROVIDER_KEY}"
      },
      "models": {
        "my-model": {
          "name": "My Model",
          "limit": {
            "context": 128000,
            "output": 4096
          }
        }
      }
    }
  }
}
```

This approach requires no PRs and is documented in the [providers documentation](https://opencode.ai/docs/providers#custom).

## Example PRs

### PR #1: Puter Provider Integration

**What it does:** Adds Puter as a provider with custom headers

**Files changed:**
- `packages/opencode/src/provider/provider.ts` - Custom loader with HTTP referer
- `packages/ui/src/components/provider-icons/sprite.svg` - Puter icon SVG
- `packages/ui/src/components/provider-icons/types.ts` - Icon registration
- `packages/opencode/src/cli/cmd/auth.ts` - Auth hint with URL

**Key points:**
- Single PR to OpenCode repository
- Follows standard provider pattern (like Vercel, Cloudflare, OpenRouter)
- No models.dev changes needed
- Provider accessible via `/connect` → puter

**View:** https://github.com/velzie/opencode/pull/1

### Other Examples to Study

While this repository is new, you can study similar patterns in the main OpenCode ecosystem:

- Look for providers like `vercel`, `cloudflare`, `openrouter` in `provider.ts`
- Check how bundled providers use `BUNDLED_PROVIDERS` object
- Study custom loaders that add headers or modify options

## Process Summary

### Quick Decision Tree

```
Want to add a provider to OpenCode?
│
├─ Is it already on models.dev?
│  ├─ Yes → Single PR to OpenCode (add integration code)
│  └─ No → Do you need full model metadata?
│     ├─ Yes → Two PRs (models.dev first, then OpenCode)
│     └─ No → Single PR to OpenCode (custom loader only)
│
└─ Just for personal use?
   └─ No PR needed (use opencode.json custom provider)
```

### Typical Timeline

**OpenCode-only PR:**
- 1-3 days for review and merge
- Available immediately after merge

**Models.dev + OpenCode:**
- Models.dev PR: 3-7 days (external repository)
- OpenCode PR: 1-3 days after models.dev merge
- Total: ~1-2 weeks

### What Makes a Good Provider PR?

✅ **Good:**
- Follows existing patterns in the codebase
- Minimal code changes (surgical additions)
- Includes provider icon and documentation
- Tests with actual API credentials
- Explains how to get API keys

❌ **Avoid:**
- Large refactors or changes to existing providers
- Untested code
- Missing documentation
- Breaking changes to provider interfaces

## How to Contribute

1. **Open an issue first** - Describe which provider you want to add
2. **Check if it exists** - Search models.dev and OpenCode for existing support
3. **Follow the pattern** - Study similar providers (especially recent additions)
4. **Test thoroughly** - Actually connect and test with the provider
5. **Update docs** - Add setup instructions to `providers.mdx`
6. **Keep it minimal** - Only add what's necessary for the provider to work

## Step-by-Step: Adding a New Provider (Example)

Let's say you want to add "MyAI" provider to OpenCode. Here's exactly what you'd do:

### Step 1: Research

```bash
# Check if it's already on models.dev
curl https://models.dev/api.json | grep -i "myai"

# Check if OpenCode already has it
cd opencode
grep -r "myai" packages/opencode/src/provider/
```

### Step 2: Determine Approach

- **MyAI exists on models.dev?** → Go to Step 3 (OpenCode-only PR)
- **MyAI not on models.dev AND you want full metadata?** → Submit to models.dev first
- **Just want to use it yourself?** → Skip to custom config (Step 7)

### Step 3: Fork and Clone

```bash
git clone https://github.com/YOUR_USERNAME/opencode.git
cd opencode
git checkout -b feat/add-myai-provider
bun install
```

### Step 4: Add Provider Code

Edit `packages/opencode/src/provider/provider.ts`:

```typescript
const CUSTOM_LOADERS: Record<string, CustomLoader> = {
  // ... existing providers
  myai: async () => {
    return {
      autoload: false,
      options: {
        // Add any custom headers or options
        headers: {
          "X-Custom-Header": "opencode",
        },
      },
    }
  },
}
```

### Step 5: Add Auth Hints (Optional)

Edit `packages/opencode/src/cli/cmd/auth.ts`:

```typescript
if (provider === "myai") {
  prompts.log.info("Get your API key at https://myai.com/api-keys")
}
```

### Step 6: Add Provider Icon

1. Get SVG icon for MyAI (must be proper SVG format)
2. Add to `packages/ui/src/components/provider-icons/sprite.svg`:

```xml
<symbol viewBox="0 0 24 24" fill="none" id="myai">
  <!-- Your SVG path here -->
  <path d="..." fill="currentColor"></path>
</symbol>
```

3. Register in `packages/ui/src/components/provider-icons/types.ts`:

```typescript
export const iconNames = [
  // ... existing names
  "myai",
  // ... rest
] as const
```

### Step 7: Test Locally

```bash
# Start dev server
bun dev

# In OpenCode TUI, test the connection
/connect
# Select "myai" and enter API key

# Test model selection
/models
# Verify MyAI models appear
```

### Step 8: Update Documentation

Add a section to `packages/web/src/content/docs/providers.mdx`:

```markdown
### MyAI

1. Head over to [MyAI console](https://myai.com/console) and create an API key.

2. Run the `/connect` command and search for MyAI.

   ```txt
   /connect
   ```

3. Enter your MyAI API key.

4. Run `/models` to select a model.
```

### Step 9: Commit and Open PR

```bash
git add .
git commit -m "feat(provider): Add MyAI integration"
git push origin feat/add-myai-provider

# Open PR on GitHub
# Reference PR #1 as an example
```

### Step 10: Alternative - Custom Config (No PR)

If you just want to use it yourself without contributing:

Create `opencode.json` in your project:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "myai": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "MyAI",
      "options": {
        "baseURL": "https://api.myai.com/v1",
        "apiKey": "{env:MYAI_API_KEY}"
      },
      "models": {
        "myai-large": {
          "name": "MyAI Large",
          "limit": {
            "context": 128000,
            "output": 4096
          }
        }
      }
    }
  }
}
```

Then just run:
```bash
export MYAI_API_KEY="your-key-here"
opencode
```

## Need Help?

- Check existing provider implementations in `packages/opencode/src/provider/provider.ts`
- Read the [Contributing Guide](./CONTRIBUTING.md)
- Look at [models.dev documentation](https://models.dev)
- Ask in GitHub issues with the `help wanted` label

---

*Last updated: 2026-02-03*
