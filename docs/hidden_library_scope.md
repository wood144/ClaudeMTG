# Hidden Library Feature — Scope Document

## Problem
When Claude scries, uses Mystic Forge, or has any "look at top N" effect, the user currently has to tell Claude what's on top. This forces the user to see Claude's library order — violating hidden information rules. The user is both opponent and tracker operator, so there's no clean separation.

## Goal
Claude can see the top N cards of its own library without the user seeing them. Draws, scries, and "peek" effects (Mystic Forge, Sensei's Divining Top) are all handled without exposing library order to the user.

---

## Current Architecture (relevant parts)

| Component | What it does |
|-----------|-------------|
| `state[player].library` (JS) | Array of card objects in the tracker. Index 0 = top. |
| `drawCard()` in `js/main.js` | `.shift()` from library array, `.push()` to hand. |
| Scry modal in `js/main.js` | Visual UI — user sees top N cards, toggles keep/bottom. |
| `game_live.txt` | Written by `live_server.py` via WebSocket. Shows `LIB:count` (not contents). |
| `assets/decks.json` | Full decklists. 20 decks, `"1 Card Name\n"` format. |
| `assets/card_data.json` | Card oracle text/stats cache. |

**Key point:** The tracker already stores the full library as an ordered array. It just isn't hidden from the user's view.

---

## Proposed Solution

### New file: `claude_library.json`
An ordered JSON array of card names. Index 0 = top of library. Written at game start, updated on every draw/scry/shuffle/search.

```json
["Kozilek, Butcher of Truth", "Forsaken Monument", "Platinum Angel", ...]
```

### New script: `scripts/library.py`
CLI tool Claude calls via Bash. Manages `claude_library.json` independently of the tracker UI.

**Commands:**

| Command | What it does | When used |
|---------|-------------|-----------|
| `shuffle <deck_name>` | Load decklist from `decks.json`, remove commander + opening hand cards (read from `game_live.txt`), shuffle remainder, write to `claude_library.json` | Game start (after hand is dealt) |
| `draw [N]` | Pop top N cards, print them, update file | Claude's draw step |
| `peek [N]` | Print top N cards, don't remove | Mystic Forge, Sensei's Divining Top, Courser of Kruphix |
| `scry <N> --keep 0,2 --bottom 1` | Show top N, reorder by index — keeps go to top in specified order, bottoms go to bottom | Scry triggers |
| `remove <card_name>` | Remove a specific card from library (first match) | Tutors, cascade exile, search effects |
| `add-top <card_name>` | Add card to top of library | Vampiric Tutor, putting cards back |
| `add-bottom <card_name>` | Add card to bottom of library | Cascade misses, failed scry |
| `shuffle-in <card_name>` | Insert card at random position, re-shuffle | Shuffle effects, cards returning to library |
| `reshuffle` | Shuffle entire library in place | Any "shuffle your library" effect |
| `count` | Print card count | Sanity check |

### Tracker JS changes (minimal)

1. **Game start for Claude's side:** After deck load + initial hand deal, send a WebSocket message or call an endpoint to trigger `library.py shuffle`. The tracker removes the library array for Claude (or keeps it as count-only).

2. **Claude's draw step:** Instead of the user clicking "Draw" for Claude:
   - Claude runs `python scripts/library.py draw` → gets card name
   - Tracker needs to know what was drawn to add to `CLD_H`. Two options:
     - **Option A (simpler):** Claude tells the tracker via a command in chat, user adds card to hand manually. Works today, no JS changes.
     - **Option B (automated):** `library.py draw` also sends a WebSocket message to the tracker with the card name. Tracker auto-adds to Claude's hand. Requires extending `live_server.py` to send messages TO the tracker (currently one-way).

3. **Scry for Claude:** User clicks "Scry N" for Claude → tracker does NOT show the scry modal. Instead, tracker sends a signal (or Claude just knows to run `library.py peek N`). Claude sees the cards, decides order, runs `library.py scry` to commit. Tracker just logs "Claude: Scried N — kept X, sent Y to bottom."

### live_server.py changes

**Option B only:** Add bidirectional WebSocket support. Server can push messages to the tracker (e.g., "add card X to Claude's hand"). This also enables future automation.

---

## Implementation Phases

### Phase 1: Core hidden library (minimum viable)
- [ ] Write `scripts/library.py` with all commands above
- [ ] `shuffle` reads from `decks.json`, excludes cards already in hand/battlefield/GY (reads `game_live.txt` to determine)
- [ ] Claude uses `peek`, `scry`, `draw` via Bash during games
- [ ] User still manually adds drawn cards to tracker hand (Option A)
- [ ] User still clicks draw/scry buttons but skips the modal for Claude — just triggers Claude to use the script
- **No JS changes required. Fully functional with existing tracker.**

### Phase 2: Automated draw sync
- [ ] Extend `live_server.py` to accept commands from `library.py` (or add HTTP endpoint)
- [ ] `library.py draw` sends card name to tracker via WebSocket/HTTP
- [ ] Tracker JS listens for incoming messages, auto-adds card to Claude's hand
- [ ] Eliminates manual "add card to hand" step for user

### Phase 3: Integrated scry/peek UI
- [ ] When user triggers scry for Claude's side, tracker suppresses the visual modal
- [ ] Tracker logs "Claude is scrying N..."
- [ ] Claude runs `library.py scry` commands
- [ ] Tracker receives confirmation and logs result
- [ ] Full invisible flow — user sees "Claude scried 2, kept 1 on top" without seeing card names

---

## Edge Cases to Handle

| Scenario | How library.py handles it |
|----------|--------------------------|
| Cascade (exile until hit) | `peek 1` repeatedly, or `peek N` with large N. `remove` each exiled card, `add-bottom` non-hits. |
| Tutor (search library) | Claude runs `python scripts/library.py search <query>` — new command that lists matching cards without showing order. `remove` the chosen card. `reshuffle` after. |
| Opponent mills Claude | User tells Claude "milled 3" → Claude runs `draw 3` equivalent but moves to GY instead of hand. New command: `mill N` — pops top N from library, prints them (they go to GY = public info). |
| Shuffle effects | `reshuffle` — randomizes entire library. |
| Dredge / bottom-of-library | `add-bottom` for specific cards. |
| Card put on top by opponent | `add-top <card_name>` |
| Library count mismatch | `count` command for sanity checks. If tracker count ≠ file count, something desynced. |
| Mid-game reconnect | `claude_library.json` persists on disk. Survives page refresh. |
| Multiple games | `shuffle` overwrites the file. Each new game starts fresh. |

---

## File Locations

```
mtg-commander/
├── scripts/
│   ├── library.py          ← NEW: hidden library manager
│   └── live_server.py      ← Modified in Phase 2
├── claude_library.json      ← NEW: runtime file, gitignored
├── js/
│   └── main.js             ← Modified in Phase 3
└── .gitignore              ← Add claude_library.json
```

---

## Effort Estimate

| Phase | Scope | Files touched |
|-------|-------|---------------|
| Phase 1 | ~150-200 lines Python | `scripts/library.py` (new), `.gitignore` |
| Phase 2 | ~50-80 lines Python + ~30 lines JS | `scripts/live_server.py`, `js/main.js` or `js/live-bridge.js` |
| Phase 3 | ~50 lines JS | `js/main.js` (scry modal suppression) |

Phase 1 is fully standalone and usable immediately. Phases 2-3 are quality-of-life improvements that reduce manual steps.

---

## Open Questions for User

1. **Phase 1 sufficient to start?** Manual draw sync (user adds card to tracker hand) vs. automated.
2. **Cascade handling:** Should `library.py` have a dedicated `cascade <max_mv>` command that auto-resolves the exile chain? Or keep it manual (peek/remove/add-bottom)?
3. **Opponent's library too?** Currently only scoping Claude's library. If future decks need opponent-side hidden info (e.g., Claude piloting a mill deck), same system could support both players.
4. **Search command format:** When Claude tutors, should the script show all matching cards (could be long) or accept a specific name to remove?
