## Project Configuration

- **Language**: TypeScript
- **Package Manager**: pnpm
- **Add-ons**: prettier, eslint, mcp

<!--## TypeScript Rules

- **TypeScript first**: Always use `.ts` / `.svelte.ts` files, never `.js` / `.svelte.js`. All code must be fully typed.
- **No `any`**: Never use `any`. Use proper types, generics, `unknown`, or type narrowing instead. If an external API lacks types, create explicit type definitions.
- **No file extensions in imports**: Never include `.js`, `.ts`, or other extensions in import paths. The bundler handles resolution. Write `from '$lib/foo'`, not `from '$lib/foo.js'`.-->

## Architecture Rules

- **Remote Functions**: Lives in `$api/` (`src/lib/api/`). NEVER create `+server.ts` files. Use `.remote.ts` files with `query`, `form`, and `command` from `$app/server`. Queries with arguments MUST include a valibot schema as first arg.
- **Single File Responsibility**: Each `.remote.ts` has one domain. E.g. `products.remote.ts`, `cart.remote.ts`, `customer.remote.ts` — NOT `data.remote.ts`.
- **Files**: Files is never camelCase, always my-file.ts with dash and lowercase.
- **Components**: Small, single-responsibility components in `$lib/components/`. Keep HTML/CSS minimal. Extract repeating elements into their own files.
- **Auth**: Uses Svelte context (`$lib/auth.svelte.ts`). `createAuthContext()` in root layout, `getAuth()` in components. Provides `isLoggedIn`, `isB2B`, and `customer`.
<!--- **B2B/B2C**: Customer `tags` array from Shopify determines B2B status. B2B customers see prices excl. tax. Use the `<Price>` component for all prices.
- **Shopify**: Storefront API via `@shopify/storefront-api-client`. Types generated via `pnpm codegen`.
- **Env vars**: `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_API_VERSION`, `SHOPIFY_STOREFRONT_TOKEN` (Storefront API public token), `SHOPIFY_ADMIN_TOKEN` (Storefront API private token `shpat_`), `SHOPIFY_APP_ID` (App client ID), `SHOPIFY_APP_SECRET` (App client secret `shpss_`)-->
- **Path aliases**: `$api` → `src/lib/api`
- **SSR**: Always ensure SSR works correctly with no hydration glitches. Test that components render properly on the server.
- **Reactivity**: Avoid `$effect` as a last resort. Prefer `$derived` for reactive computations — most things can be expressed declaratively without effects.

---

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.
