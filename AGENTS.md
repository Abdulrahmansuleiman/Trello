# Trello Board — Content Card Memory

This is the standalone repo for the LaunchOps content Trello board (React + Vite).
Scope: **the board only** — not the wider LinkedinOS project.

## Card structure — ALWAYS follow this
Every card represents **one post**.

- **Card Title = the HOOK** — the hook of the post, always. Nothing else.
- **Card Description ("Post body") = the BODY** — the full post copy goes here.

So when creating or editing a card: the top title field is the hook, the description field is the post body. Never put the body in the title.

## No dashes — hard rule
**Post text must never contain a dash.** No em dash (`—`), en dash (`–`), or hyphen (`-`).

- Applies to hooks (titles), post bodies (descriptions), and checklist items.
- Use a comma, a period, or a space instead.
  - Bad: `Meta Ads MCP — control campaigns` → Good: `Meta Ads MCP, control campaigns`
  - Bad: `cold-call agent` → Good: `cold call agent`

Enforced in code: `stripDashes()` / `sanitizeState()` in `src/lib/seed.js` run on every board load and clean any dash from titles, descriptions, and checklist text.

## Board lists (columns), in order
Ideas → Scripting → Filming → Editing → Quality Assurance → Launched Post

- New seed cards are added in `src/lib/seed.js`.
- `ensureLists()` inserts missing lists into boards already saved in localStorage.

## Dev / deploy
- Run locally: `npm run dev` → http://localhost:5173/
- Build: `npm run build`
- Repo: https://github.com/Abdulrahmansuleiman/Trello (branch `main`)
- Any update to the board is committed and pushed to this repo.
