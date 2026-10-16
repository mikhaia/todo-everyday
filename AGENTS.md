# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project

Todo Everyday — a Nuxt 4 SPA task manager. Users sign in with Google, tasks sync through Firebase Firestore, and tasks are organized by day and by customizable categories.

## Commands

```bash
npm run dev        # dev server on http://localhost:4000 (port set in nuxt.config.ts)
npm run build      # production build
npm run generate   # static generation (output in .output/public)
npm run preview     # preview the production build
npm run deploy     # nuxt generate + firebase deploy --only hosting,functions
```

There is no test runner and no linter configured. Firebase config comes from a local `.env` (see `.env.example`, keys prefixed `NUXT_PUBLIC_FIREBASE_*`); without it the app cannot connect to Firebase.

The Cloud Functions codebase lives in `functions/` (its own `package.json`, CommonJS, Node 22, `firebase-admin` + `firebase-functions` v2). It requires the Blaze plan. `npm install` inside `functions/` is only needed for local emulation (`firebase emulators:start --only functions`); `firebase deploy` builds it remotely.

## Architecture

**Rendering:** Client-only SPA (`ssr: false`). Deployed as static files to Firebase Hosting with a catch-all rewrite to `/index.html`.

**State — read this first.** Despite `@pinia/nuxt` being installed, there are no Pinia stores. All shared state uses Nuxt's `useState(key, ...)` with string keys referenced by name across components. When touching state, match the existing key exactly or the components will diverge. Key state keys:
- `user` — `{ uid, displayName, photoURL } | null`
- `day` — selected date string `YYYY-MM-DD`
- `tasks`, `categories`, `activeCategoryId` — current data + category filter
- `categorySidebarOpen`, and modal pairs like `taskToEdit`/`showTaskModal`, `taskToDelete`/`showDeleteTaskModal`, `categoryToEdit`/`showCategoryModal`, `categoryToDelete`/`showDeleteCategoryModal`

**Auth flow:** `app/plugins/auth.client.ts` initializes Firebase Auth (`browserLocalPersistence`), subscribes to `onAuthStateChanged`, and writes the `user` state. `app/middleware/auth.global.ts` redirects unauthenticated users to `/login` — except `/share/*`, which is public and bypasses auth.

**Firestore data model:**
- `users/{uid}/todos` — a todo is `{ title, order, date: string | null, done, categoryId: string | null, createdAt: serverTimestamp }`. `date === null` means an undated task.
- `users/{uid}/categories` — `{ title, icon, background, image? }`. `icon` is a Material Symbols name; `background` is a color; `image` is a Firebase Storage path.
- `share` (top-level) — `{ uid, date, categoryId }`. A share doc's ID is the public URL slug at `/share/{id}`.
- `users/{uid}` (the parent doc) — holds `apiToken` for the external API. Set via `setDoc(merge)` from `UserSettingsModal.vue`; may not exist until a token is generated.

**External task API (`functions/index.js`):** a single HTTPS function `api`, routed from Firebase Hosting via the `/api/**` rewrite. `POST /api/tasks` creates task(s), `POST /api/tasks/get` reads them, `POST /api/tasks/complete` marks them done, and `POST /api/tasks/delete` deletes them. Callers authenticate with the `apiToken` in the JSON body (not Firebase Auth); the function resolves token → `uid` by querying `users where apiToken == token` and category **name** → `categoryId` by title, using the Admin SDK (which bypasses security rules). Complete/delete accept `id` or `ids` and verify that every task belongs to the token owner. Create defaults: missing `date` → `null` (No date), missing/unknown `category` → `null` (No category). Get defaults: missing `date` → today. Written tasks use the same schema as the client.

**Data loading is real-time via `onSnapshot`**, not one-shot fetches:
- `TodoList.vue` subscribes to two queries — the current month's dated todos (range query on `date` with composite ordering `date, order, createdAt desc`) and all undated todos — then merges them into `tasks`. Changing `day` across months re-subscribes. The composite `orderBy` clauses require Firestore composite indexes.
- `CategoryList.vue` subscribes to the user's categories collection.
- The `/share/{id}` page fetches once (read-only, `getDocs`) and never mutates.

**Routing / pages:**
- `pages/index.vue` — always resets `day` to today, renders `TodoList`.
- `pages/date/[date].vue` — sets `day` from the route param, renders `TodoList`.
- `pages/share/[uid].vue` — public read-only view resolved from a `share` doc ID.
- `pages/login.vue` — Google sign-in.

**`app.vue` is the shell** (not just a `<NuxtPage/>` host): left sidebar with an always-open `DatePicker` whose day cells are colored by completion status (`dayMap` derived from `tasks`), a right category sidebar (`CategoryList`), the four global modals, and a background layer. The active category's `background` color and `image` (loaded from Firebase Storage, URL-cached) drive the whole-page theme. It special-cases `/share/*` (hides sidebars/modals) and `/login`.

**Todo list sections** (`TodoList.vue` → `TodoSection.vue`): the selected day's tasks, undated tasks, and "Outdated" (past-dated, not-done) tasks — each filtered by `activeCategoryId` when a category filter is active. Reordering commits new `order` values (`(idx+1)*1000`) via a Firestore `writeBatch`. Export/import serialize the current list to/from Markdown checkboxes on the clipboard.

**`app/utils/color.ts`** — `textColor(bg)` picks black/white text by luminance so labels stay readable over arbitrary category colors; used wherever a category `background` is applied.

## Conventions

- Auto-imports: Nuxt auto-imports `ref`, `computed`, `watch`, `useState`, `useRoute`, `navigateTo`, etc. — components rely on this heavily.
- Icons are Google Material Symbols Outlined (loaded via a font link in `nuxt.config.ts`), referenced by name in `<span class="material-symbols-outlined">`.
- Styling is Tailwind (`@nuxtjs/tailwindcss`); the glassmorphism look uses `bg-white/25 backdrop-blur-*` utilities.
