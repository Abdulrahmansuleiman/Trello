# Board sync

How the board saves, and the rules that keep it from ever going back to an older
version of itself.

## What went wrong (fixed 2026-10-29)

The board used to be stored as one gzipped blob in a Vercel Global Config
(Edge Config) store, and every save was the **whole board**.

Three things combined to lose work:

1. **Whole board writes.** A tab holding a copy from ten minutes ago pushed its
   copy on any change. That copy was missing everything added, moved or edited
   since, so saving one card silently undid all of it. This is why cards
   disappeared and why moved cards jumped back.
2. **Reads were treated as truth.** Global Config takes up to 10 seconds to
   propagate a write, and the client read the board back every 5 seconds and
   repainted whatever came back. A read taken before a save landed repainted the
   old board.
3. **Failures were silent.** `pushBoard()` ended in `.catch(() => null)`, so a
   failed save looked exactly like a successful one, and a refresh revealed the
   truth.

## How it works now

| Piece | File | What it does |
| --- | --- | --- |
| Store | `api/_store.js` | Supabase Postgres, one row per board, `rev` counter |
| Endpoint | `api/board.js` | `GET` returns `{rev, state}`, `POST` takes ops, never snapshots |
| Ops | `shared/ops.js` | The only way to change a card, shared by browser and server |
| Client | `src/lib/sync.js` | Optimistic apply, queue, retry, revision guard |

**Writes are operations, not snapshots.** `move`, `addCard`, `updateCard`,
`deleteCard`, `addList`, `renameList`, `renameBoard`, `setStar`. The server reads
the newest revision, applies the ops, and saves with a compare and set:

```sql
update board_state set rev = rev + 1, state = $new
 where id = $id and rev = $base_rev   -- 0 rows updated means somebody else won
```

If that returns 0 rows the caller re-reads and re-applies. Ops are absolute, so
re-applying is safe and **no write can be dropped**. Every accepted revision is
copied into `board_history`, so any version can be restored.

**The client never trusts a read blindly.** It only repaints when the incoming
`rev` is higher than the one it already applied, so a slow or repeated read can
not roll the board back. A change is applied to the screen immediately, queued in
`localStorage`, and re-sent until the server confirms it, which also means a
refresh mid-save finishes the job instead of losing it. `pagehide` flushes the
queue with `sendBeacon`. The top bar shows `Saved` / `Saving…` / `Not saved,
retry` so a failed save is visible, not hidden.

## Rules for anything that touches the board

- Send **ops**. Never POST a whole `state`. The endpoint answers `409` on purpose.
- Treat `rev` as the version. Do not write from a copy you did not just read.
- Every op must stay idempotent. Retries are expected: `addCard` skips cards that
  already exist, `deleteCard` on a missing card is a no-op, `move` is absolute.
  That is why `setStar` exists instead of a toggle.
- Add a new behaviour by adding an op to `shared/ops.js`, not by editing state in
  two places.

## Verify, do not hope

```powershell
cd board
npm run verify        # full suite on a scratch board row: moves, deletes, stale
                      # writers, concurrent writes, retries, history, restore
npm run verify:live   # end to end against https://trello.launchopsai.click,
                      # creates its own card and deletes it again
```

`npm run verify:live` is the regression test for the original bug: add, reload,
move, reload, wait, reload, delete, reload. If it passes, a card can not jump back.

## Recovery

Every revision is kept in `board_history` (last 500 pruned daily by
`/api/generate`). To inspect or roll back:

```powershell
# list revisions (needs the CRON_SECRET bearer token)
curl -H "Authorization: Bearer $env:CRON_SECRET" `
  "https://trello.launchopsai.click/api/board?history=1&limit=20"

# roll the board back to a revision
curl -X POST -H "Authorization: Bearer $env:CRON_SECRET" -H "Content-Type: application/json" `
  -d '{"restoreRev": 42}' "https://trello.launchopsai.click/api/board"
```

## Environment

| Variable | Where | Purpose |
| --- | --- | --- |
| `SUPABASE_URL` | Vercel env | Store host |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel env, server only | Store write key |
| `CRON_SECRET` | Vercel env | Protects history, restore and the ideas generator |

`BOARD_EDGE_CONFIG_ID` / `BOARD_VERCEL_TOKEN` are from the old store and are no
longer read.
