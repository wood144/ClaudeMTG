# Phase 2: Bidirectional Live Bridge — Claude Interacts with Tracker

## Goal
Claude sends commands back to the tracker via WebSocket, so the user only manages their own side. Claude's plays (tap, cast, move cards, create tokens) execute directly in the tracker UI.

## Architecture

### WebSocket becomes bidirectional
- **Browser → Server → File**: Already working (Phase 1)
- **Claude → Server → Browser**: New. Claude sends JSON commands, server relays to browser, tracker executes them.

### Command Protocol (Claude → Tracker)
```json
{"action": "play", "uid": "#7", "to": "battlefield"}
{"action": "tap", "uid": "#3"}
{"action": "untap", "uid": "#3"}
{"action": "move", "uid": "#5", "from": "hand", "to": "graveyard"}
{"action": "draw", "player": "opp"}
{"action": "create_token", "name": "Cat", "power": 1, "toughness": 1, "keywords": ["lifelink"]}
{"action": "add_counter", "uid": "#3", "type": "+1/+1", "count": 1}
{"action": "remove_counter", "uid": "#3", "type": "+1/+1", "count": 1}
{"action": "set_life", "player": "opp", "value": 38}
{"action": "next_phase"}
{"action": "next_turn"}
```

### Hidden Library Interactions (Key Feature)
This is the main reason for Phase 2 — stop leaking Claude's library info to the user.

When a scry/hideaway/cascade/Atla flip/tutor happens:
1. Tracker sends the hidden card options to Claude via WebSocket (user never sees them)
2. Claude picks and sends the choice back
3. Tracker executes silently — user sees "Claude scried 2" or "Hideaway resolved" but not card names

Requires tracker to have Claude's library loaded and ordered (it already does internally).

### Components to Build

#### 1. `live_server.py` changes (~20 lines)
- Accept messages from TWO sources: browser WebSocket + Claude's commands
- Route browser messages → game_live.txt (existing)
- Route Claude commands → browser WebSocket (new)
- Claude sends commands by writing to a `game_command.txt` file, or via a second WebSocket, or via HTTP POST to the server

**Simplest approach**: Claude writes commands to `game_command.txt`. Server watches the file (or Claude hits an HTTP endpoint). Server relays to browser.

**Cleaner approach**: Server exposes a simple HTTP POST endpoint (e.g., `POST localhost:8766/command`). Claude uses `curl` or Python to send commands. Server relays via WebSocket to browser.

#### 2. `js/live-bridge.js` changes (~40 lines)
- Listen for incoming WebSocket messages (currently only sends)
- Parse JSON commands
- Map to existing tracker functions:
  - `"play"` → `moveCard(card, 'opp', 'hand', 'opp', 'battlefield')`
  - `"tap"` → `tapCard(card, 'opp')`
  - `"draw"` → `drawCard('opp')`
  - `"create_token"` → `addToken('opp')` (pre-filled with token data)
  - `"next_phase"` → `nextPhase()`
  - etc.
- Call `render()` after each command

#### 3. `js/main.js` changes (~30 lines)
- New function: `handleHiddenReveal(type, cards)` — for scry, hideaway, cascade, tutor
  - Sends card options to Claude via WebSocket instead of showing user a prompt
  - Waits for Claude's response command before resolving
- Hook into existing scry/library-peek UI to route through this when it's Claude's library

#### 4. Claude-side integration
- Instead of saying "Playing [#7] — Forest", Claude sends: `{"action": "play", "uid": "#7", "to": "battlefield"}`
- A helper script or bash function to send commands: `python scripts/send_command.py '{"action": "play", "uid": "#7"}'`
- Or just `curl -X POST localhost:8766/command -d '{"action":"play","uid":"#7"}'`

### Tricky Parts
1. **Token creation** needs Scryfall lookup (async) — maybe pre-define common tokens
2. **State sync** — if Claude's command fails, need error feedback
3. **Hidden reveals** — need a request/response pattern, not just fire-and-forget
4. **Sequencing** — some actions need confirmation before proceeding (e.g., "response?" after casting)

### Implementation Order
1. Add HTTP POST endpoint to `live_server.py` for Claude commands
2. Add incoming message handler to `live-bridge.js`
3. Build command → function mapping in JS
4. Test with basic commands (tap, play, draw)
5. Add hidden library interaction (scry, hideaway, etc.)
6. Build `send_command.py` helper for Claude

### What Changes for the User
- User only manages THEIR side of the board
- Claude's plays appear automatically in the tracker
- Scry/hideaway/cascade prompts go to Claude silently
- User still corrects errors if something doesn't look right
- "Send to Claude" button may become unnecessary (live bridge handles it)
