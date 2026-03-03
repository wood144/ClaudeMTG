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
        "mvp_loser": "Danitha Capashen"
    }'
"""

import sys
import json
import math
from datetime import datetime
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment

TRACKER_PATH = 'assets/mtg_commander_tracker.xlsx'
DECKS_PATH = 'assets/decks.json'
Z = 1.645  # 90% CI for Wilson Score


# ── Deck name normalization ──────────────────────────────────────────

def load_canonical_deck_names():
    """Load canonical deck names from decks.json."""
    try:
        with open(DECKS_PATH) as f:
            decks = json.load(f)
        if isinstance(decks, list):
            return {d['name']: d['name'] for d in decks if 'name' in d}
        elif isinstance(decks, dict):
            return {k: k for k in decks}
    except (FileNotFoundError, json.JSONDecodeError):
        return {}
    return {}


def normalize_deck_name(name, canonical_names):
    """Match a deck name to its canonical form (case-insensitive).
    Falls back to original name if no match found."""
    lower_map = {k.lower(): v for k, v in canonical_names.items()}
    match = lower_map.get(name.lower())
    if match:
        if match != name:
            print(f"  Normalized deck name: '{name}' → '{match}'")
        return match
    # No match — warn and return as-is
    print(f"  WARNING: '{name}' not found in decks.json — using as-is")
    return name


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


def calc_winner_perf(sides):
    """Winner Perf = 7.0 + max(0, 1.10 + 0.06 * (17 - sides))"""
    return round(7.0 + max(0, 1.10 + 0.06 * (17 - sides)), 2)


def calc_loser_perf(sides):
    """Loser Perf = max(0, 2/30 * (sides - 10))"""
    return round(max(0, (2 / 30) * (sides - 10)), 2)


# ── Main update logic ───────────────────────────────────────────────

def update_tracker(game_data):
    wb = openpyxl.load_workbook(TRACKER_PATH)
    canonical = load_canonical_deck_names()

    # Normalize deck names in game_data
    game_data['winner_deck'] = normalize_deck_name(game_data['winner_deck'], canonical)
    game_data['loser_deck'] = normalize_deck_name(game_data['loser_deck'], canonical)

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
        game_data['won_by'],
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
            'winner_deck': normalize_deck_name(row[3], canonical) if row[3] else row[3],
            'loser_deck': normalize_deck_name(row[4], canonical) if row[4] else row[4],
            'winner_cmdr': row[6], 'loser_cmdr': row[7],
            'sides': row[9],
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
                s['perfs'].append(calc_winner_perf(sides))
            else:
                s['losses'] += 1
                s['perfs'].append(calc_loser_perf(sides))
            s['sides_list'].append(sides)

    for s in deck_stats.values():
        s['wilson'] = wilson_lower(s['wins'], s['games'])
        s['perf'] = round(sum(s['perfs']) / len(s['perfs']), 2)
        avg_s = sum(s['sides_list']) / len(s['sides_list'])
        s['avg_sides'] = int(avg_s) if avg_s == int(avg_s) else round(avg_s, 1)

    # Snapshot old ranks for trend arrows
    ws_rank = wb['Rankings']
    old_ranks = {}
    for row in ws_rank.iter_rows(min_row=2, max_row=ws_rank.max_row, values_only=True):
        if row[0] is not None and row[2] is not None:
            old_ranks[row[2]] = row[0]

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
            return '-'
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
        for c in range(1, 11):
            ws_rank.cell(row=r, column=c).value = None

    # Write sorted rankings
    bold = Font(bold=True)
    center = Alignment(horizontal='center')
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
    claude_w = sum(1 for g in all_games if g['won_by'] == 'Claude')
    human_w = sum(1 for g in all_games if g['won_by'] == 'Human')
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

    print(f"Instructions: Series Claude {claude_w}, Human {human_w}. {total} games.")

    # ── Save ────────────────────────────────────────────────────────
    wb.save(TRACKER_PATH)
    print(f"\nSaved to {TRACKER_PATH}")


# ── CLI entry point ─────────────────────────────────────────────────

if __name__ == '__main__':
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
    required = ['date', 'won_by', 'winner_deck', 'loser_deck',
                'win_condition', 'winner_cmdr', 'loser_cmdr']
    missing = [f for f in required if f not in data]
    if missing:
        print(f"Missing required fields: {missing}")
        sys.exit(1)

    update_tracker(data)
