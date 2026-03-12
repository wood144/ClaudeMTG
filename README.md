# ClaudeMTG — AI Opponent Commander Tracker

A browser-based Magic: The Gathering Commander game tracker where **Claude Code acts as your AI opponent**. Drag cards between zones, track life totals and counters, and send board state snapshots to Claude for strategic play decisions.

---

## How It Works

1. Open `index.html` in your browser (no server needed — runs entirely local)
2. Import your deck via Moxfield/Archidekt URL or paste a decklist
3. Load decks for both players and deal opening hands
4. Play the game — drag cards between zones, tap/untap, add counters
5. When it's Claude's turn, click **Send to Claude** and paste the board state into your Claude Code session
6. Claude responds with its full turn — you track the actions in the app

---

## Setup

### Prerequisites
- [Claude Code](https://claude.ai/code) (Claude's CLI — this is how you run the AI opponent)
- A modern browser (Chrome, Firefox, Edge)
- Python 3 (for card data lookups — comes pre-installed on most systems)

### First-Time Setup

**1. Clone the repo**
```bash
git clone https://github.com/[your-username]/ClaudeMTG.git
cd ClaudeMTG
```

**2. Card data cache**

`assets/card_data.json` ships with the repo — it's a compact oracle lookup file built from the decks already in the project. No setup needed for included decks.

If you add new decks with cards not already in the cache, Claude will fall back to the Scryfall API for those lookups. To add a batch of new cards to the local cache, run:

```bash
python -c "
import urllib.request, json

# Add card names you want to pre-cache
NEW_CARDS = ['Card Name 1', 'Card Name 2']

with open('assets/card_data.json') as f:
    lookup = json.load(f)

for name in NEW_CARDS:
    if name in lookup:
        continue
    url = f'https://api.scryfall.com/cards/named?exact={urllib.parse.quote(name)}'
    try:
        c = json.loads(urllib.request.urlopen(url).read())
        lookup[name] = {
            'name': c.get('name'), 'mana_cost': c.get('mana_cost',''),
            'cmc': c.get('cmc',0), 'type': c.get('type_line',''),
            'oracle': c.get('oracle_text',''), 'power': c.get('power'),
            'toughness': c.get('toughness'), 'keywords': c.get('keywords',[]),
        }
        print(f'Added: {name}')
    except Exception as e:
        print(f'Failed: {name} — {e}')

with open('assets/card_data.json','w') as f:
    json.dump(lookup, f)
print('Done.')
"
```

Commit the updated `card_data.json` and it'll be available to all collaborators.

**3. Start Claude Code in the project folder**
```bash
cd ClaudeMTG
claude
```

**4. Paste the opponent prompt**

At the start of each game, paste the contents of `claude_opponent_prompt.txt` into your Claude Code session as your first message, followed by the board state from the tracker.

---

## Key Files

| File | Purpose |
|------|---------|
| `index.html` | The tracker app — open this in your browser |
| `claude_opponent_prompt.txt` | Paste this at game start to initialize Claude as your opponent |
| `CLAUDE.md` | Project rules loaded automatically by Claude Code — governs AI behavior |
| `assets/card_data.json` | Local card oracle cache (built by you, gitignored) |
| `assets/mechanical_checklist.md` | Compact MTG rulings cheat sheet — Claude reads this at game start |
| `game_current.md` | Per-game session notes Claude maintains — overwritten each game |
| `assets/decks.json` | Your saved decklists (optional — can also paste decklists in the UI) |

---

## Saving Your Decks

Decks are stored in browser `localStorage` by default. To persist them across devices or commits:

1. Click **Export Decks** in the tracker → saves `decks.json`
2. Move it to `assets/decks.json` in the repo
3. Commit it — the tracker auto-loads it on first run

---

## How Claude Plays (for contributors/forks)

Claude Code plays the opponent role through these key mechanisms:

- **Board state format:** The tracker generates a compressed TOON-format snapshot (`[[CLD_BF|...]]`, `[[OPP|...]]`, etc.) that Claude parses each turn
- **Card lookup:** Claude uses `assets/card_data.json` via Bash/Python for instant oracle lookups — no Scryfall API calls mid-game
- **Game session file:** At game start, Claude batch-looks up all hand cards and writes `game_current.md` — subsequent turns read this file instead of doing fresh lookups, cutting turn time significantly
- **Rules reference:** `assets/mechanical_checklist.md` is read once per game — compact cheat sheet of recurring rules edge cases

Behavior is governed by `CLAUDE.md` (auto-loaded by Claude Code) and `claude_opponent_prompt.txt` (pasted at game start).

---

## Tips

- **Don't resend the board state every turn** — only resend when something significant changes (new cards drawn, major zone changes). Claude maintains context between sends.
- **"No responses until COMBAT"** — tell Claude this to batch its Main 1 plays into one message, speeding up turns.
- **The Human is the rules engine** — Claude will describe intended actions; you adjudicate complex interactions. The app supports rollback (just drag cards back).
- **Primers** — For complex decks, a short hand-written strategy note (win conditions, key interactions) pasted before the first board state helps Claude play optimally.

---

## Contributing

PRs welcome. Key areas for improvement:
- Additional deck imports (beyond Moxfield/Archidekt)
- Multiplayer support (3-4 players)
- Per-deck primer files in `assets/primers/`

Please test any tracker changes in the browser before submitting — the app is pure HTML/JS/CSS with no build step.
