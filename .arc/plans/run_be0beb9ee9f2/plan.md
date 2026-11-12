summary: |
  Shoppers can create an account (email + password only, no name) and sign in. Today the repo is a bare scaffold: the Fastify API has only `GET /health` and a lazy `pg` pool (`services/api/src/db.ts`), and the web app renders a single `<h1>` with Tailwind imported but no design tokens loaded. This plan adds (1) an `accounts` + `sessions` PostgreSQL schema with a plain-SQL migration, (2) `POST /api/auth/register` and `POST /api/auth/login` in the Storefront API (scrypt password hashing from `node:crypto`, opaque session token in an HttpOnly cookie, a deliberately generic login failure), and (3) the Sign in and Create account screens in the Storefront Web UI built from the approved prototype (one centred `.card`, inline `.field-error` messages, generic `.alert-danger` on sign-in failure, links between the two screens, "origin = checkout" handling for the post-success destination). Tests are written first at every layer: API unit/inject tests, a pure validation module, and React Testing Library component tests, one or more per acceptance criterion.
scope:
  - description: |
      Load the design system once in the web app. In `apps/web/src/index.css` keep `@import "tailwindcss";` first, then add
      `@import "../../../design-system/tokens.css";` and `@import "../../../design-system/prototype-utils.css";`
      (path relative to `apps/web/src`). Today `index.css` contains only the Tailwind import (line 1) and `main.tsx` line 4 imports it, so no token or component class (`.card`, `.field`, `.input`, `.is-invalid`, `.field-error`, `.field-hint`, `.alert`, `.alert-danger`, `.btn`, `.btn-primary`, `.btn-lg`, `.spinner`) is loaded yet; all of these are defined in `design-system/prototype-utils.css`.
      Add `apps/web/src/auth.css` (imported from `index.css`) defining only the classes the prototype defines in its own inline style block, on tokens only: `.auth-card` (max-width 420px per prototype, margin `var(--space-5)` auto, padding `var(--space-4)`), `.auth-note`, `.auth-submit` (width 100%), `.auth-switch`, `.link-btn` (min-height `var(--tap-target-min)`, colour `var(--color-primary)`, focus ring `var(--focus-ring-width)`), `.auth-success` and its `.mark` (size `var(--avatar-size)`, `var(--color-success-bg)`/`var(--color-success)`).
    files:
      - apps/web/src/index.css
      - apps/web/src/auth.css
    rationale: |
      The UI guidelines require every UI step to style with tokens only; the prototype's utility and component classes come from `design-system/prototype-utils.css`, and its auth-specific classes exist only in the prototype's inline style, so they are re-defined in the app on the same tokens. The 420px card width is the prototype's own literal (no token covers it; see open questions).
  - description: |
      Database migration. Add `services/api/migrations/001_accounts_and_sessions.sql` and a small runner `services/api/src/migrate.ts` exporting `runMigrations(pool: pg.Pool): Promise<void>` (applies `*.sql` files in name order, recorded in a `schema_migrations(name text primary key)` table, each file in a transaction, idempotent on re-run). Add script `"migrate": "tsx src/migrate.ts"` to `services/api/package.json`.
      ```sql
      CREATE TABLE accounts (
        id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email         text NOT NULL,
        password_hash text NOT NULL,
        created_at    timestamptz NOT NULL DEFAULT now()
      );
      CREATE UNIQUE INDEX accounts_email_lower_key ON accounts (lower(email));
      CREATE TABLE sessions (
        token_hash text PRIMARY KEY,           -- sha256 of the cookie token, never the token itself
        account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        expires_at timestamptz NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      ```
    files:
      - services/api/migrations/001_accounts_and_sessions.sql
      - services/api/src/migrate.ts
      - services/api/package.json
    rationale: |
      No migration tooling or schema exists yet (only `db.ts` with a pool), and the database is owned by the Storefront API per the stack. Plain SQL plus a tiny runner avoids adding a dependency. The unique index on `lower(email)` is what makes "already registered" (AC 3) race-safe and case-insensitive.
  - description: |
      API validation module `services/api/src/auth/validation.ts`:
      ```ts
      export type FieldErrors = { email?: string; password?: string };
      export function validateRegistration(input: { email?: unknown; password?: unknown }): FieldErrors;
      export function validateLogin(input: { email?: unknown; password?: unknown }): FieldErrors;
      ```
      Registration rules (same messages as the prototype): empty email -> `Enter your email address.`; no `@` -> `Enter an email address with an @, like you@example.com.`; empty password -> `Create a password.`; length < 8 -> `Use at least 8 characters.`; no letter or no digit -> `Add at least one letter and one number.`. Login rules: empty email -> `Enter your email address.`, empty password -> `Enter your password.`. Email is trimmed and lower-cased before use.
    files:
      - services/api/src/auth/validation.ts
    rationale: |
      Server-side validation is the source of truth for AC 9, 10, 13, 14, 15 (the web form mirrors it for instant feedback but is not trusted).
  - description: |
      Password hashing and sessions. `services/api/src/auth/password.ts`: `hashPassword(plain: string): Promise<string>` and `verifyPassword(plain: string, stored: string): Promise<boolean>` using `crypto.scrypt` with a random 16-byte salt and `timingSafeEqual`, stored as `scrypt$N$r$p$salt$hash`. `services/api/src/auth/sessions.ts`: `createSession(pool, accountId): Promise<{ token: string; expiresAt: Date }>` (32 random bytes base64url, store sha256, 30-day expiry) and `sessionCookie(token, expiresAt): string` returning `sid=<token>; HttpOnly; SameSite=Lax; Path=/; Expires=...` plus `Secure` when `NODE_ENV === 'production'`. No cookie-parsing dependency is needed because this story only sets the cookie; reading it belongs to the sign-out/profile stories.
    files:
      - services/api/src/auth/password.ts
      - services/api/src/auth/sessions.ts
    rationale: |
      Passwords are never stored in clear (open data-protection question; this is the minimum sane default). `node:crypto` keeps `package_dependencies` empty. Stored session hash means a DB leak does not leak live sessions.
  - description: |
      Auth routes `services/api/src/routes/auth.ts`, registered in `services/api/src/app.ts` with `app.register(authRoutes, { prefix: '/api/auth' })`. Signature: `export async function authRoutes(app: FastifyInstance, opts?: { pool?: pg.Pool }): Promise<void>`; the pool defaults to `getPool()` and is injectable so tests use a fake in-memory store.
      - `POST /api/auth/register` body `{ email, password }` -> 422 `{ errors: FieldErrors }` on validation failure (no insert); 409 `{ errors: { email: 'An account with this email already exists.' } }` when the unique index is violated (pg code `23505`); otherwise insert, create a session, `Set-Cookie`, respond 201 `{ account: { id, email } }` (signed in on creation: AC 16).
      - `POST /api/auth/login` body `{ email, password }` -> 422 `{ errors }` for empty fields; 401 `{ error: 'invalid_credentials', message: 'The email or password is not right. Try again.' }` for BOTH wrong password and unknown email (AC 4, 12), running `verifyPassword` against a fixed dummy hash when the email is unknown so response time does not reveal which case it was; success -> session cookie and 200 `{ account: { id, email } }`.
      Responses never include the hash.
    files:
      - services/api/src/routes/auth.ts
      - services/api/src/app.ts
    rationale: |
      Mirrors the existing `healthRoutes` plugin pattern in `app.ts`. The `/api` prefix lets the web dev server proxy a single path.
  - description: |
      Web API client and validation. `apps/web/src/auth/api.ts`:
      ```ts
      export type AuthResult =
        | { ok: true; account: { id: string; email: string } }
        | { ok: false; kind: 'field'; errors: { email?: string; password?: string } }
        | { ok: false; kind: 'invalid_credentials' }
        | { ok: false; kind: 'network' };
      export function register(email: string, password: string): Promise<AuthResult>;
      export function login(email: string, password: string): Promise<AuthResult>;
      ```
      using `fetch('/api/auth/...', { method: 'POST', credentials: 'include', ... })`. `apps/web/src/auth/validation.ts` repeats the registration/login rules (same message strings) so errors show before a round trip. Add `server.proxy: { '/api': 'http://localhost:3000' }` to `apps/web/vite.config.ts` for local development (confirm the API dev port in `services/api/src/server.ts` when implementing).
    files:
      - apps/web/src/auth/api.ts
      - apps/web/src/auth/validation.ts
      - apps/web/vite.config.ts
    rationale: |
      Single place for network calls so component tests can mock `api.ts`. Duplicated rules are intentional: client for speed, server for trust.
  - description: |
      Screens, from the approved prototype (`SHOPPING-WEB-STORY-014-design.html`, screens "Sign in" and "Create account"). `apps/web/src/auth/AuthCard.tsx` is shared markup: `<div class="card auth-card stack">` with `<h1>` (serif via `h1` rule), optional `.auth-note` ("Sign in to continue to checkout." / "Create an account to continue to checkout." when `origin === 'checkout'`), a `<form class="stack" noValidate>`, one full-width `btn btn-primary btn-lg auth-submit` and the `.auth-switch` paragraph with a `.link-btn`.
      - `SignInScreen.tsx`: props `{ origin: 'checkout' | 'other'; onAuthenticated(dest: 'checkout' | 'account'): void; onSwitch(): void }`. Fields Email (`type=email`, `autocomplete=email`, placeholder `you@example.com`) and Password (`type=password`, `autocomplete=current-password`), each in a `.field` with `.input`, `.is-invalid`, `aria-invalid="true"`, `aria-describedby` and a `<p class="field-error" role="alert">` under the field. Empty email/password -> field-level error under that field and no request (AC 15). Wrong password or unknown email (server `invalid_credentials`) -> `<div class="alert alert-danger" role="alert">The email or password is not right. Try again.</div>` below the `<h1>`, both inputs `.is-invalid`, password cleared and focused (AC 4, 12). Pending: button disabled with label `Signing in…`. Link: `New here? [Create an account]` calls `onSwitch` (AC 7).
      - `CreateAccountScreen.tsx`: same props. Fields Email (`autocomplete=email`) and Password (`autocomplete=new-password`, `field-hint` "At least 8 characters, with a letter and a number." wired by `aria-describedby`). NO name field (AC 11). Client rules/messages as in the validation module; server 409 -> email field error "An account with this email already exists." with a `Sign in instead` `.link-btn` inside the error (calls `onSwitch`); typed values are kept on errors. Pending label `Creating account…`. Link: `Already have an account? [Sign in]` (AC 8).
      - On success both screens call `onAuthenticated(origin === 'checkout' ? 'checkout' : 'account')` (AC 5, 6, 17, 18); creation already signs the shopper in because the API sets the session cookie (AC 16).
      - `apps/web/src/auth/AuthFlow.tsx`: owns `screen: 'sign-in' | 'create-account'` state, takes `origin` and `onAuthenticated`, and renders one screen; `apps/web/src/App.tsx` renders `AuthFlow` with `origin="other"` and, after success, the prototype's success panel (`.auth-success`: check mark, "You’re signed in" / "Your account is ready", "Taking you to Account…", `.spinner`, button "Go to Account" / "Continue to checkout").
      Only token-based CSS from `index.css`/`auth.css`; layout works from 375px because the card is `max-width` with `width: 100%` content. Sentence-case copy and verb-first button labels per the voice guidelines.
    files:
      - apps/web/src/auth/AuthCard.tsx
      - apps/web/src/auth/SignInScreen.tsx
      - apps/web/src/auth/CreateAccountScreen.tsx
      - apps/web/src/auth/AuthFlow.tsx
      - apps/web/src/App.tsx
    rationale: |
      Builds exactly the prototype's default, error, email-taken, password-error, from-checkout and success states. Checkout and Account screens belong to other stories, so `App` only receives the destination and shows the prototype's "taking you to…" panel; the real router hookup is a one-line change in the stories that own those pages.
tests:
  - |
    AC 1 + 16 (API, `services/api/test/auth.register.test.ts`, written first, fails because `/api/auth/register` does not exist):
    ```ts
    const res = await app.inject({ method: 'POST', url: '/api/auth/register', payload: { email: 'new@example.com', password: 'plum2024' } });
    expect(res.statusCode).toBe(201);
    expect(res.json().account.email).toBe('new@example.com');
    expect(res.headers['set-cookie']).toMatch(/^sid=.+HttpOnly/);
    expect(store.accounts).toHaveLength(1);
    expect(store.accounts[0].password_hash).not.toContain('plum2024');
    ```
  - |
    AC 2 (API, `auth.login.test.ts`): seed an account via `hashPassword`, then
    ```ts
    const res = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { email: 'maya@example.com', password: 'plum2024' } });
    expect(res.statusCode).toBe(200);
    expect(res.headers['set-cookie']).toMatch(/^sid=/);
    ```
  - |
    AC 3 (API): registering an already-registered email, including different case, returns 409 and no second row:
    ```ts
    expect(res.statusCode).toBe(409);
    expect(res.json().errors.email).toMatch(/already exists/);
    expect(store.accounts).toHaveLength(1);
    ```
  - |
    AC 4 + 12 (API): wrong password and unknown email give byte-identical bodies:
    ```ts
    expect(wrongPw.statusCode).toBe(401);
    expect(unknown.statusCode).toBe(401);
    expect(unknown.json()).toEqual(wrongPw.json());
    expect(JSON.stringify(wrongPw.json())).not.toMatch(/email is|password is (wrong|incorrect)|no account/i);
    ```
  - |
    AC 4 + 12 (web, `apps/web/src/auth/SignInScreen.test.tsx`, `api.login` mocked to `{ ok: false, kind: 'invalid_credentials' }`):
    ```tsx
    await user.type(screen.getByLabelText('Email'), 'a@b.com');
    await user.type(screen.getByLabelText('Password'), 'nope1234');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('The email or password is not right. Try again.');
    ```
  - |
    AC 5 + 6 (web, `SignInScreen.test.tsx`): with `api.login` resolving `{ ok: true, ... }`:
    ```tsx
    render(<SignInScreen origin="checkout" onAuthenticated={fn} onSwitch={noop} />);
    /* fill valid values, submit */
    await waitFor(() => expect(fn).toHaveBeenCalledWith('checkout'));
    // and with origin="other":
    await waitFor(() => expect(fn).toHaveBeenCalledWith('account'));
    ```
  - |
    AC 7 + 8 (web, `AuthFlow.test.tsx`):
    ```tsx
    render(<AuthFlow origin="other" onAuthenticated={noop} />);
    await user.click(screen.getByRole('button', { name: 'Create an account' }));
    expect(screen.getByRole('heading', { name: 'Create account' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    ```
  - |
    AC 9 + 10 (API `validation.test.ts` and web `CreateAccountScreen.test.tsx`): a 7-character `abc1234` and an 8-letter `abcdefgh` password produce a password error and no registration call:
    ```ts
    expect(validateRegistration({ email: 'a@b.com', password: 'abc1234' }).password).toBe('Use at least 8 characters.');
    expect(validateRegistration({ email: 'a@b.com', password: 'abcdefgh' }).password).toBe('Add at least one letter and one number.');
    ```
    ```tsx
    expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'true');
    expect(api.register).not.toHaveBeenCalled();
    ```
    Plus an API inject test asserting 422 and `store.accounts` stays empty.
  - |
    AC 11 (web): `expect(screen.queryByLabelText(/name/i)).not.toBeInTheDocument();` on the Create account screen (only Email and Password labels exist).
  - |
    AC 13 + 14 (API `validation.test.ts` + web): empty email and `no-at-sign.example.com` both set `errors.email`, show `field-error` under the email field and never call `api.register`:
    ```ts
    expect(validateRegistration({ email: '', password: 'plum2024' }).email).toBe('Enter your email address.');
    expect(validateRegistration({ email: 'foo.example.com', password: 'plum2024' }).email).toMatch(/@/);
    ```
  - |
    AC 15 (web `SignInScreen.test.tsx` + API 422): empty password shows an error next to the password field and `api.login` is not called:
    ```tsx
    expect(await screen.findByText('Enter your password.')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toHaveClass('is-invalid');
    expect(api.login).not.toHaveBeenCalled();
    ```
  - |
    AC 17 + 18 (web `CreateAccountScreen.test.tsx`): with `api.register` resolving ok, `origin="checkout"` calls `onAuthenticated('checkout')`, `origin="other"` calls `onAuthenticated('account')`; the checkout variant also shows the "Create an account to continue to checkout." note.
  - |
    Web 409 handling (supports AC 3 in the UI): `api.register` resolving `{ ok: false, kind: 'field', errors: { email: 'An account with this email already exists.' } }` shows that text inside the Email `.field` and keeps the typed values.
  - |
    Migration test (`services/api/test/migrate.test.ts`): `runMigrations` run twice against a fake pool executes each file once, and `001_accounts_and_sessions.sql` contains the `accounts_email_lower_key` unique index (guard for AC 3).
  - |
    Optional e2e (`apps/web/e2e/auth.spec.ts`, Playwright): create an account, land on the success panel, sign in with the same credentials. Needs a running API and database, so it is run in the e2e stage rather than the unit command.
assumptions_or_open_questions:
  - |
    Repeated failed sign-in attempts (throttling or lockout) are NOT in any acceptance criterion and are left out of this plan. Open question for a human: is per-IP/per-email throttling needed in the first release? It would add `@fastify/rate-limit` and a lockout policy that must not leak whether an account exists.
  - |
    Data protection and retention (project-wide questions): this plan only commits to scrypt-hashed passwords, hashed session tokens, an HttpOnly SameSite=Lax cookie (Secure in production) and generic login errors. Retention period and deletion on request are undecided and not built here. ADR-0009 states no compliance regime applies.
  - |
    Supported browsers and device widths (project-wide question): planned for 375px and up per the UI guidelines, with no browser matrix decided.
  - |
    The prototype's site header and nav (Shop, Categories, Deals, Wishlist, Account, Bag) is the app shell, not part of this story, and is not built here; `App.tsx` renders only the auth screens. The prototype's "That page belongs to another story" toasts and its in-page demo accounts (maya.fernandes@example.com / plum2024) are prototype shortcuts and are not carried into code.
  - |
    Checkout and Account destinations belong to other stories. `AuthFlow` reports the destination via `onAuthenticated('checkout' | 'account')`, and `App` shows the prototype's success panel. How the shopper arrives at Sign in from checkout (the `origin` prop source) is wired by the Bag and checkout story; here it is a prop defaulting to `other`.
  - |
    No routing library is added; screen switching is local state, since the story's scope is the two screens and moving between them. Real URLs (e.g. `/sign-in`) can be added when a router is introduced by the shell.
  - |
    Production topology is not stated: the web UI is static assets on a CDN and the API a separate ECS service. The cookie flow assumes the browser reaches the API on the same site (a reverse-proxy path `/api`, as the Vite dev proxy does). If the API is on another origin, CORS with credentials and `SameSite=None; Secure` are needed. Please confirm.
  - |
    `.auth-card` max-width 420px is the prototype's own literal and no token covers it. Also the `design-system/tokens.css` relative `@import` from `apps/web/src/index.css` crosses the Vite project root; if the dev server rejects it (`server.fs.allow`), copy or alias the two files instead.
  - |
    Email validation is only "contains @" (AC 14) on both sides; no stricter format check is added. Email matching is case-insensitive and trimmed; passwords are not trimmed. Maximum password length and email length caps (for example 72/254) are not specified and are not enforced.
  - |
    The current `index.css` Tailwind import is kept, but the design-system classes are used for the auth screens (the project stack says Tailwind, the UI guidelines say design-system classes); Tailwind utilities are not used in the new components.
estimated_points: 8
package_dependencies: []
notes: |
  ### Data & rollout

  - **Existing data**: the database has no application tables today (only `db.ts` with a pool), so migration `001_accounts_and_sessions.sql` only creates new tables; no existing rows are altered or locked.
  - **Backfill / seed**: none. `runMigrations` is idempotent (records applied names in `schema_migrations`) and safe to re-run.
  - **Settings**: no new env var. Uses the existing `DATABASE_URL` read by `services/api/src/db.ts`; the session cookie adds `Secure` when `NODE_ENV=production`. Web dev proxy target for `/api` is set in `apps/web/vite.config.ts`.
  - **Provisioning**: the managed PostgreSQL (comp_database) must be reachable, and the `gen_random_uuid()` function needs PostgreSQL 13+ (built in). `pnpm migrate` in `services/api` must be run once per environment by the deploy process.
  - **Order and rollback**: run the migration before deploying the new API; the web UI deploys after the API. Rollback: leave the tables in place (they are additive and unused by old code); to remove, `DROP TABLE sessions; DROP TABLE accounts;` then delete the row names from `schema_migrations`.

  ### Design source

  Read in full: `SHOPPING-WEB-STORY-014-design.html`. Screens: "Sign in" (states default, error, from-checkout, success, success-checkout) and "Create account" (default, email-taken, password-error, from-checkout, success, success-checkout). One `.card.auth-card` per screen, serif `h1`, `.field` rows, one `btn-primary btn-lg` submit, `.link-btn` to the other screen. No AC conflicts with the prototype. One minor point: the prototype's sign-in failure marks both inputs `.is-invalid` plus the banner (AC 4 asks for an inline error that does not say which was wrong; that satisfies it).

  ### Tokens used

  `--color-bg`, `--color-fg`, `--color-fg-muted`, `--color-primary`, `--color-danger`, `--color-danger-bg`, `--color-success`, `--color-success-bg`, `--color-border`, `--space-1..5`, `--radius-md`, `--radius-lg`, `--font-size-sm/md/lg/xl`, `--font-serif`, `--tap-target-min`, `--control-height-md/lg`, `--focus-ring-width`, `--avatar-size`, `--spinner-size`, `--letter-spacing-wide`. Component classes used all exist in `design-system/prototype-utils.css`.

  ### Shape

  ```mermaid
  flowchart TD
    main[apps/web/src/main.tsx] --> App[apps/web/src/App.tsx]
    main --> css[apps/web/src/index.css]
    css --> auth_css[apps/web/src/auth.css]
    App --> Flow[auth/AuthFlow.tsx]
    Flow --> SignIn[auth/SignInScreen.tsx]
    Flow --> Create[auth/CreateAccountScreen.tsx]
    SignIn --> Card[auth/AuthCard.tsx]
    Create --> Card
    SignIn --> WApi[auth/api.ts]
    Create --> WApi
    WApi -->|POST /api/auth/*| Routes[services/api/src/routes/auth.ts]
    AppTs[services/api/src/app.ts] --> Routes
    Routes --> Val[auth/validation.ts]
    Routes --> Pw[auth/password.ts]
    Routes --> Sess[auth/sessions.ts]
    Sess --> DB[services/api/src/db.ts]
    Routes --> DB
    Mig[services/api/src/migrate.ts] --> DB
    classDef touched fill:#f96,color:#000
    class App,css,auth_css,Flow,SignIn,Create,Card,WApi,Routes,AppTs,Val,Pw,Sess,Mig touched
  ```
  Orange nodes are created or modified; `main.tsx` and `db.ts` are existing, unchanged context.
review_focus: |
  IN scope: email+password registration and sign-in (API routes, schema, hashing, session cookie) and the two web screens with inline errors, screen switching and checkout-vs-other destination. OUT: throttling/lockout, sign-out, reading the session, profile, addresses, the app shell/header, and real Checkout/Account pages (only a destination callback and the prototype's success panel). Riskiest areas: keeping login failures indistinguishable (body, status and timing) for unknown email vs wrong password, and the case-insensitive unique email constraint under concurrent sign-ups. Deliberate choices: no new dependencies (node:crypto scrypt, hand-built Set-Cookie), no router, client validation duplicated server-side on purpose.
