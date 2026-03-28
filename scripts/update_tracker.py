#!/usr/bin/env python3
"""
Post-game tracker updater for MTG Commander.
Updates Game Log, Rankings, Head-to-Head, and Instructions sheets.

Usage (from mtg-commander/):
    python scripts/update_tracker.py '<JSON game data>'

Example:
    python scripts/update_tracker.py '{
        "date": "2026-03-01",
        "won_by": "Human",
        "winner_deck": "Avatar Allies",
        "loser_deck": "Kellan",
        "win_condition": "Combat Damage",
        "winner_cmdr": "Sokka, Tenacious Tactician",
        "loser_cmdr": "Kellan, the Fae-Blooded",
        "turns": 8,
        "sides": 15,
        "clutch_play": "Standstill locked the door. Appa flew over it.",
        "winner_life": 40,
        "loser_life": 0,
        "comeback": "N",
        "mvp_winner": "Appa, the Vigilant",
        "mvp_loser": "Danitha Capashen",
        "dominance": 2
    }'

Dominance scale (winner only):
    1 = Won because opponent stumbled (mana screw/flood, bad decisions)
    2 = Hard-fought, back and forth
    3 = Deck was humming, gameplan executed
"""

import sys
import json
import math
from datetime import datetime
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment

TRACKER_PATH = 'assets/mtg_commander_tracker.xlsx'
DECKS_PATH = 'assets/decks.json'
PRICES_CACHE_PATH = 'assets/card_prices.json'
Z = 1.645  # 90% CI for Wilson Score
PRICE_CACHE_MAX_AGE = 30  # days — run refresh_prices.py monthly


# ── Deck name normalization ──────────────────────────────────────────

def load_canonical_deck_names():
    """Load canonical deck names and alias lookup from decks.json."""
    try:
        with open(DECKS_PATH) as f:
            decks = json.load(f)
        if not isinstance(decks, list):
            decks = [{'name': k} for k in decks] if isinstance(decks, dict) else []

        canonical = {}
        alias_map = {}  # lowercase alias -> canonical name
        cmdr_map = {}   # lowercase commander name -> canonical deck name
        for d in decks:
            if 'name' not in d:
                continue
            cname = d['name']
            canonical[cname] = cname
            # Index the canonical name itself (lowercase)
            alias_map[cname.lower()] = cname
            # Index all aliases
            for alias in d.get('aliases', []):
                alias_map[alias.lower()] = cname
            # Index commander (first card in list) as lookup key
            decklist = d.get('list', '')
            if decklist:
                first_line = decklist.strip().split('\n')[0]
                # Strip leading "1 " quantity prefix
                cmdr_name = first_line.lstrip('0123456789 ')
                cmdr_map[cmdr_name.lower()] = cname
        return canonical, alias_map, cmdr_map
    except (FileNotFoundError, json.JSONDecodeError):
        return {}, {}, {}


def normalize_deck_name(name, canonical_names, alias_map=None, cmdr_map=None, cmdr_name=None):
    """Match a deck name to its canonical form.
    Checks: commander lookup -> exact match (case-insensitive) -> aliases.
    Falls back to original name if no match found."""
    if alias_map is None:
        alias_map = {}
    if cmdr_map is None:
        cmdr_map = {}

    # Primary: resolve via commander name (most reliable)
    if cmdr_name:
        match = cmdr_map.get(cmdr_name.lower().strip())
        if match:
            if match != name:
                print(f"  Resolved deck via commander: '{cmdr_name}' -> '{match}'")
            return match

    low = name.lower().strip()

    # Check alias map (includes canonical names and aliases)
    match = alias_map.get(low)
    if match:
        if match != name:
            print(f"  Normalized deck name: '{name}' -> '{match}'")
        return match

    # Fallback: case-insensitive canonical name match (legacy)
    lower_map = {k.lower(): v for k, v in canonical_names.items()}
    match = lower_map.get(low)
    if match:
        if match != name:
            print(f"  Normalized deck name: '{name}' -> '{match}'")
        return match

    # No match
    print(f"  WARNING: '{name}' not found in decks.json -- using as-is")
    return name


# ── Deck value (from cached Scryfall bulk prices) ────────────────────

def get_deck_values():
    """Return {deck_name: total_usd_value} using cached cheapest-printing prices.
    Cache is built by scripts/refresh_prices.py (run monthly)."""
    try:
        with open(PRICES_CACHE_PATH) as f:
            cache = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        print("  No price cache found. Run: python scripts/refresh_prices.py")
        return {}

    prices = cache.get('prices', {})
    ts = cache.get('timestamp', 'unknown')

    # Warn if stale
    try:
        age_days = (datetime.now() - datetime.fromisoformat(ts)).days
        if age_days > PRICE_CACHE_MAX_AGE:
            print(f"  WARNING: Price cache is {age_days} days old. Run: python scripts/refresh_prices.py")
        else:
            print(f"  Using cached prices ({len(prices)} cards, {age_days}d old, cheapest printing)")
    except (ValueError, TypeError):
        print(f"  Using cached prices ({len(prices)} cards, age unknown)")

    with open(DECKS_PATH) as f:
        decks = json.load(f)

    deck_values = {}
    for d in decks:
        total = 0.0
        for line in d.get('list', '').strip().split('\n'):
            if line.strip():
                parts = line.strip().split(' ', 1)
                qty = int(parts[0]) if parts[0].isdigit() else 1
                name = parts[1] if len(parts) > 1 else parts[0]
                total += qty * prices.get(name, 0.0)
        deck_values[d['name']] = round(total, 2)

    return deck_values


# ── Scoring formulas (from Instructions sheet) ──────────────────────

def wilson_lower(wins, games):
    """Wilson Score lower bound, z=1.645 (90% CI)."""
    if games == 0:
        return 0.0
    p = wins / games
    n = games
    denom = 1 + Z**2 / n
    center = p + Z**2 / (2 * n)
    spread = Z * math.sqrt(p * (1 - p) / n + Z**2 / (4 * n**2))
    return round((center - spread) / denom, 4)


def calc_winner_perf(sides, dominance=2):
    """Winner Perf = 7.0 + speed_bonus + (dominance - 2) * 0.75
    dominance: 1=opponent stumbled, 2=hard-fought, 3=deck humming"""
    speed_bonus = max(0, 1.10 + 0.06 * (17 - sides))
    feels_bonus = (dominance - 2) * 0.75
    return round(7.0 + speed_bonus + feels_bonus, 2)


def calc_loser_perf(sides):
    """Loser Perf = min(1.5, max(0, 2/30 * (sides - 10)))"""
    return round(min(1.5, max(0, (2 / 30) * (sides - 10))), 2)


# ── Main update logic ───────────────────────────────────────────────

def update_tracker(game_data):
    wb = openpyxl.load_workbook(TRACKER_PATH)
    canonical, alias_map, cmdr_map = load_canonical_deck_names()

    # Normalize deck names — primarily via commander, fallback to deck name
    game_data['winner_deck'] = normalize_deck_name(
        game_data.get('winner_deck', ''), canonical, alias_map, cmdr_map,
        cmdr_name=game_data.get('winner_cmdr'))
    game_data['loser_deck'] = normalize_deck_name(
        game_data.get('loser_deck', ''), canonical, alias_map, cmdr_map,
        cmdr_name=game_data.get('loser_cmdr'))

    # ── 1. GAME LOG ─────────────────────────────────────────────────
    ws_log = wb['Game Log']
    last_id = ws_log.cell(row=ws_log.max_row, column=1).value
    next_id = (last_id or 0) + 1
    new_row = ws_log.max_row + 1

    date_val = game_data['date']
    if isinstance(date_val, str):
        date_val = datetime.strptime(date_val, '%Y-%m-%d')

    log_values = [
        next_id,
        date_val,
        game_data['won_by'].strip().title(),
        game_data['winner_deck'],
        game_data['loser_deck'],
        game_data['win_condition'],
        game_data['winner_cmdr'],
        game_data['loser_cmdr'],
        game_data.get('turns'),
        game_data.get('sides'),
        game_data.get('clutch_play'),
        game_data.get('winner_life'),
        game_data.get('loser_life'),
        game_data.get('comeback', 'N'),
        game_data.get('mvp_winner'),
        game_data.get('mvp_loser'),
        game_data.get('dominance', 2),
    ]

    for col_idx, val in enumerate(log_values, start=1):
        ws_log.cell(row=new_row, column=col_idx, value=val)
    ws_log.cell(row=new_row, column=2).number_format = 'YYYY-MM-DD'

    print(f"Game Log: added game #{next_id} (row {new_row})")

    # ── 2. REBUILD RANKINGS from Game Log ───────────────────────────
    # Collect every game
    all_games = []
    for row in ws_log.iter_rows(min_row=2, max_row=ws_log.max_row, values_only=True):
        if row[0] is None:
            continue
        all_games.append({
            'id': row[0], 'won_by': row[2],
            'winner_deck': normalize_deck_name(row[3], canonical, alias_map, cmdr_map, cmdr_name=row[6]) if row[3] else row[3],
            'loser_deck': normalize_deck_name(row[4], canonical, alias_map, cmdr_map, cmdr_name=row[7]) if row[4] else row[4],
            'winner_cmdr': row[6], 'loser_cmdr': row[7],
            'sides': row[9],
            'dominance': row[16] if len(row) > 16 and row[16] is not None else 2,
        })

    # Aggregate per-deck stats
    deck_stats = {}
    for g in all_games:
        for deck, cmdr, is_winner in [
            (g['winner_deck'], g['winner_cmdr'], True),
            (g['loser_deck'], g['loser_cmdr'], False),
        ]:
            if deck not in deck_stats:
                deck_stats[deck] = {
                    'cmdr': cmdr, 'wins': 0, 'losses': 0,
                    'games': 0, 'perfs': [], 'sides_list': [],
                }
            s = deck_stats[deck]
            s['games'] += 1
            sides = g['sides'] if g['sides'] is not None else 16  # fallback
            if is_winner:
                s['wins'] += 1
                s['perfs'].append(calc_winner_perf(sides, g.get('dominance', 2)))
            else:
                s['losses'] += 1
                s['perfs'].append(calc_loser_perf(sides))
            s['sides_list'].append(sides)

    for s in deck_stats.values():
        s['wilson'] = wilson_lower(s['wins'], s['games'])
        s['perf'] = round(sum(s['perfs']) / len(s['perfs']), 2)
        avg_s = sum(s['sides_list']) / len(s['sides_list'])
        s['avg_sides'] = int(avg_s) if avg_s == int(avg_s) else round(avg_s, 1)

    # Snapshot old ranks and trends for preservation
    ws_rank = wb['Rankings']
    old_ranks = {}
    old_trends = {}
    for row in ws_rank.iter_rows(min_row=2, max_row=ws_rank.max_row, values_only=True):
        if row[0] is not None and row[2] is not None:
            old_ranks[row[2]] = row[0]
            old_trends[row[2]] = row[1] if len(row) > 1 else '-'

    # Sort: Wilson desc → Perf desc
    sorted_decks = sorted(
        deck_stats.items(),
        key=lambda x: (x[1]['wilson'], x[1]['perf']),
        reverse=True,
    )
    new_ranks = {deck: i + 1 for i, (deck, _) in enumerate(sorted_decks)}

    # Trend: only decks in the latest game get arrows
    latest = all_games[-1]
    latest_decks = {latest['winner_deck'], latest['loser_deck']}

    def trend_arrow(deck):
        if deck not in latest_decks:
            # Preserve existing trend for decks that didn't play
            return old_trends.get(deck, '-')
        old = old_ranks.get(deck)
        if old is None:
            return 'NEW'
        new = new_ranks[deck]
        if new < old:
            return 'UP'
        elif new > old:
            return 'DN'
        return '-'

    # Clear old data rows (keep header)
    for r in range(2, ws_rank.max_row + 1):
        for c in range(1, 12):
            ws_rank.cell(row=r, column=c).value = None

    # Fetch deck values
    try:
        deck_values = get_deck_values()
    except Exception as e:
        print(f"  Deck values unavailable: {e}")
        deck_values = {}

    # Write sorted rankings
    bold = Font(bold=True)
    center = Alignment(horizontal='center')
    ws_rank.cell(1, 11, value='Value').font = bold
    for i, (deck, s) in enumerate(sorted_decks):
        r = i + 2
        t = trend_arrow(deck)
        ws_rank.cell(r, 1, value=i + 1).font = bold
        ws_rank.cell(r, 1).alignment = center
        ws_rank.cell(r, 2, value=t).alignment = center
        if t in ('UP', 'DN', 'NEW'):
            ws_rank.cell(r, 2).font = bold
        ws_rank.cell(r, 3, value=deck)
        ws_rank.cell(r, 4, value=s['cmdr'])
        ws_rank.cell(r, 5, value=s['wins'])
        ws_rank.cell(r, 6, value=s['losses'])
        ws_rank.cell(r, 7, value=s['games'])
        ws_rank.cell(r, 8, value=s['wilson'])
        ws_rank.cell(r, 9, value=s['perf'])
        ws_rank.cell(r, 10, value=s['avg_sides'])
        val = deck_values.get(deck, 0.0)
        ws_rank.cell(r, 11, value=val).number_format = '$#,##0.00'

    print(f"Rankings: {len(sorted_decks)} decks ranked")

    # ── 3. HEAD-TO-HEAD ─────────────────────────────────────────────
    ws_h2h = wb['Head-to-Head']

    # Build matchup dict: (deckA, deckB) → [A's wins vs B, A's losses vs B]
    matchups = {}
    for g in all_games:
        w, l = g['winner_deck'], g['loser_deck']
        matchups.setdefault((w, l), [0, 0])
        matchups.setdefault((l, w), [0, 0])
        matchups[(w, l)][0] += 1
        matchups[(l, w)][1] += 1

    all_deck_names = sorted(deck_stats.keys())

    # Clear sheet
    for r in range(1, ws_h2h.max_row + 2):
        for c in range(1, ws_h2h.max_column + 2):
            ws_h2h.cell(r, c).value = None

    # Write headers
    hdr_fill = PatternFill(start_color='E8E8E8', end_color='E8E8E8', fill_type='solid')
    ws_h2h.cell(1, 1, value='Deck').font = bold
    ws_h2h.cell(1, 1).fill = hdr_fill
    ws_h2h.column_dimensions['A'].width = 22

    for j, dk in enumerate(all_deck_names):
        col = j + 2
        ws_h2h.cell(1, col, value=dk).font = bold
        ws_h2h.cell(1, col).fill = hdr_fill
        ws_h2h.cell(j + 2, 1, value=dk).font = bold

    # Fill cells
    for i, dk_row in enumerate(all_deck_names):
        for j, dk_col in enumerate(all_deck_names):
            cell = ws_h2h.cell(i + 2, j + 2)
            cell.alignment = center
            if dk_row == dk_col:
                cell.value = '-'
            else:
                key = (dk_row, dk_col)
                rec = matchups.get(key)
                if rec and (rec[0] > 0 or rec[1] > 0):
                    cell.value = f'{rec[0]}-{rec[1]}'
                else:
                    cell.value = None

    print(f"Head-to-Head: {len(all_deck_names)}x{len(all_deck_names)} matrix")

    # ── 4. INSTRUCTIONS — update series tally ───────────────────────
    ws_inst = wb['Instructions']
    claude_w = sum(1 for g in all_games if g['won_by'].strip().lower() == 'claude')
    human_w = sum(1 for g in all_games if g['won_by'].strip().lower() == 'human')
    total = len(all_games)
    debuted = len(deck_stats)

    # Update row 14 (debuted count) and row 15 (series)
    # Preserve undebuted list manually — just update counts
    old_r14 = ws_inst.cell(14, 1).value or ''
    # Try to preserve undebuted names from existing text
    undebuted_part = ''
    if 'Undebuted:' in old_r14:
        undebuted_part = old_r14[old_r14.index('Undebuted:'):]
    else:
        undebuted_part = f'Undebuted: (check decks.json).'

    ws_inst.cell(14, 1, value=f'Total decks: 20. Debuted: {debuted}. {undebuted_part}')
    ws_inst.cell(15, 1, value=f'Series: Claude {claude_w}, Human {human_w}. Games: {total}.')
    ws_inst.cell(17, 1, value='Trend arrows: Only updated for decks that played. Non-playing decks preserve their existing trend.')

    print(f"Instructions: Series Claude {claude_w}, Human {human_w}. {total} games.")

    # ── Save ────────────────────────────────────────────────────────
    wb.save(TRACKER_PATH)
    print(f"\nSaved to {TRACKER_PATH}")


# ── CLI entry point ─────────────────────────────────────────────────

if __name__ == '__main__':
    if len(sys.argv) >= 2 and sys.argv[1] == '--refresh-values':
        # Rebuild rankings (with fresh deck values) without adding a game
        wb = openpyxl.load_workbook(TRACKER_PATH)
        canonical, alias_map, cmdr_map = load_canonical_deck_names()
        ws_log = wb['Game Log']
        all_games = []
        for row in ws_log.iter_rows(min_row=2, max_row=ws_log.max_row, values_only=True):
            if row[0] is None:
                continue
            all_games.append({
                'id': row[0], 'won_by': row[2],
                'winner_deck': normalize_deck_name(row[3], canonical, alias_map, cmdr_map, cmdr_name=row[6]) if row[3] else row[3],
                'loser_deck': normalize_deck_name(row[4], canonical, alias_map, cmdr_map, cmdr_name=row[7]) if row[4] else row[4],
                'winner_cmdr': row[6], 'loser_cmdr': row[7],
                'sides': row[9],
                'dominance': row[16] if len(row) > 16 and row[16] is not None else 2,
            })
        # Rebuild deck_stats and rankings (reuse logic from update_tracker)
        deck_stats = {}
        for g in all_games:
            for deck, cmdr, is_winner in [
                (g['winner_deck'], g['winner_cmdr'], True),
                (g['loser_deck'], g['loser_cmdr'], False),
            ]:
                if deck not in deck_stats:
                    deck_stats[deck] = {'cmdr': cmdr, 'wins': 0, 'losses': 0, 'games': 0, 'perfs': [], 'sides_list': []}
                s = deck_stats[deck]
                s['games'] += 1
                sides = g['sides'] if g['sides'] is not None else 16
                if is_winner:
                    s['wins'] += 1
                    s['perfs'].append(calc_winner_perf(sides, g.get('dominance', 2)))
                else:
                    s['losses'] += 1
                    s['perfs'].append(calc_loser_perf(sides))
                s['sides_list'].append(sides)
        for s in deck_stats.values():
            s['wilson'] = wilson_lower(s['wins'], s['games'])
            s['perf'] = round(sum(s['perfs']) / len(s['perfs']), 2)
            avg_s = sum(s['sides_list']) / len(s['sides_list'])
            s['avg_sides'] = int(avg_s) if avg_s == int(avg_s) else round(avg_s, 1)
        sorted_decks = sorted(deck_stats.items(), key=lambda x: (x[1]['wilson'], x[1]['perf']), reverse=True)
        ws_rank = wb['Rankings']
        try:
            deck_values = get_deck_values()
        except Exception as e:
            print(f"  Deck values unavailable: {e}")
            deck_values = {}
        bold = Font(bold=True)
        ws_rank.cell(1, 11, value='Value').font = bold
        for i, (deck, s) in enumerate(sorted_decks):
            r = i + 2
            val = deck_values.get(deck, 0.0)
            ws_rank.cell(r, 11, value=val).number_format = '$#,##0.00'
        wb.save(TRACKER_PATH)
        print(f"Refreshed deck values for {len(sorted_decks)} decks.")
        sys.exit(0)

    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    raw = sys.argv[1]
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"Invalid JSON: {e}")
        sys.exit(1)

    # Validate required fields
    required = ['date', 'won_by', 'win_condition', 'winner_cmdr', 'loser_cmdr']
    missing = [f for f in required if f not in data]
    if missing:
        print(f"Missing required fields: {missing}")
        sys.exit(1)

    update_tracker(data)
