#!/usr/bin/env python3
"""
Hidden library manager for Claude's deck.
Manages claude_library.json so Claude can peek/draw/scry
without the user seeing card order.

Usage (from mtg-commander/):
    python scripts/library.py shuffle <deck_name>
    python scripts/library.py draw [N]
    python scripts/library.py peek [N]
    python scripts/library.py scry <N> --keep 0,2 --bottom 1
    python scripts/library.py remove <card_name>
    python scripts/library.py add-top <card_name>
    python scripts/library.py add-bottom <card_name>
    python scripts/library.py shuffle-in <card_name>
    python scripts/library.py reshuffle
    python scripts/library.py count
    python scripts/library.py mill [N]
    python scripts/library.py search <query>
"""

import json
import os
import random
import re
import sys

BASE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
LIBRARY_FILE = os.path.join(BASE_DIR, 'claude_library.json')
DECKS_FILE = os.path.join(BASE_DIR, 'assets', 'decks.json')
LIVE_FILE = os.path.join(BASE_DIR, 'game_live.txt')


# ── File I/O ────────────────────────────────────────────────────────

def load_library():
    try:
        with open(LIBRARY_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return []


def save_library(lib):
    with open(LIBRARY_FILE, 'w', encoding='utf-8') as f:
        json.dump(lib, f, indent=2)


# ── Deck parsing ────────────────────────────────────────────────────

def load_decklist(deck_name):
    """Load decklist by name or alias from decks.json."""
    with open(DECKS_FILE, 'r', encoding='utf-8') as f:
        decks = json.load(f)
    low = deck_name.lower()
    for d in decks:
        names = [d['name'].lower()] + [a.lower() for a in d.get('aliases', [])]
        if low in names:
            return parse_decklist(d['list']), d['name']
    raise ValueError(f"Deck '{deck_name}' not found in decks.json")


def parse_decklist(list_str):
    """Parse '1 Card Name\\n3 Island' into flat list of card names."""
    cards = []
    for line in list_str.strip().split('\n'):
        line = line.strip()
        if not line:
            continue
        m = re.match(r'^(\d+)\s+(.+)$', line)
        if m:
            qty, name = int(m.group(1)), m.group(2).strip()
            name = re.sub(r'\s*\*CMDR\*\s*', '', name)  # strip commander tag
            cards.extend([name] * qty)
    return cards


# ── game_live.txt parsing ───────────────────────────────────────────

def _split_cld_zone(zone_data):
    """Split a Claude zone string (with #uid: prefixes) into card names."""
    if not zone_data or zone_data == '-':
        return []
    names = []
    # Split on comma-before-UID: ,#  (handles card names with commas)
    entries = re.split(r',(?=#\d+:)', zone_data)
    for entry in entries:
        entry = entry.strip()
        # Strip UID prefix
        entry = re.sub(r'^#\d+:', '', entry)
        # Extract attached cards from [+#uid:Name+#uid:Name2]
        att_match = re.search(r'\[\+(.+?)\]', entry)
        if att_match:
            att_str = att_match.group(1)
            for att in re.split(r'\+(?=#\d+:)', att_str):
                att_name = re.sub(r'^#\d+:', '', att).strip()
                att_name = re.sub(r'\[.*?\]', '', att_name).strip()
                if att_name:
                    names.append(att_name)
        # Clean main card name: strip [T], [counters], [+attachments]
        clean = re.sub(r'\[.*?\]', '', entry).strip()
        if clean:
            names.append(clean)
    return names


def get_cards_in_play():
    """Read game_live.txt, return all card names in Claude's non-library zones."""
    cards = []
    try:
        with open(LIVE_FILE, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        return cards

    for line in content.split('\n'):
        line = line.strip()

        # Claude's hand
        if line.startswith('[[CLD_H|'):
            cards.extend(_split_cld_zone(line[8:-2]))

        # Claude's battlefield
        elif line.startswith('[[CLD_BF|'):
            cards.extend(_split_cld_zone(line[9:-2]))

        # Claude's main line: CMD, GY, EX
        elif line.startswith('[[CLD|'):
            # Command zone
            cmd_m = re.search(r'CMD:(.+?)(?:\||\]\])', line)
            if cmd_m:
                cmd_data = cmd_m.group(1).strip()
                if cmd_data not in ('CAST', '-', ''):
                    cards.extend(_split_cld_zone(cmd_data))

            # Graveyard
            gy_m = re.search(r'GY:(.+?)(?:\||\]\])', line)
            if gy_m:
                cards.extend(_split_cld_zone(gy_m.group(1).strip()))

            # Exile
            ex_m = re.search(r'EX:(.+?)(?:\||\]\])', line)
            if ex_m:
                cards.extend(_split_cld_zone(ex_m.group(1).strip()))

    return cards


def _match_remove(library, card_name):
    """Remove one copy of card_name from library. Returns True if found."""
    low = card_name.lower()
    # Exact match
    for i, c in enumerate(library):
        if c.lower() == low:
            library.pop(i)
            return True
    # Front-face match for DFCs  ("Kellan" matches "Kellan // Birthright Boon")
    front = low.split(' // ')[0]
    for i, c in enumerate(library):
        if c.lower().split(' // ')[0] == front:
            library.pop(i)
            return True
    # Substring match (last resort)
    for i, c in enumerate(library):
        if low in c.lower() or c.lower() in low:
            library.pop(i)
            return True
    return False


# ── Commands ────────────────────────────────────────────────────────

def cmd_shuffle(deck_name):
    """Init library: load deck, exclude cards in play, shuffle."""
    decklist, canonical = load_decklist(deck_name)
    in_play = get_cards_in_play()

    library = list(decklist)
    unmatched = []
    for card in in_play:
        if not _match_remove(library, card):
            unmatched.append(card)

    random.shuffle(library)
    save_library(library)

    print(f"Deck: {canonical}")
    print(f"Library: {len(library)} cards  (deck {len(decklist)}, in play {len(in_play)})")
    if unmatched:
        print(f"  WARNING — not found in decklist: {unmatched}")


def cmd_draw(n=1):
    lib = load_library()
    if not lib:
        print("ERROR: Library empty or not initialized.")
        return
    n = min(n, len(lib))
    drawn = lib[:n]
    save_library(lib[n:])
    for i, card in enumerate(drawn):
        print(f"  {i+1}. {card}")
    print(f"({len(lib) - n} remaining)")


def cmd_peek(n=1):
    lib = load_library()
    if not lib:
        print("ERROR: Library empty or not initialized.")
        return
    n = min(n, len(lib))
    for i in range(n):
        print(f"  {i}. {lib[i]}")
    print(f"({len(lib)} total)")


def cmd_scry(n, keep_idx, bottom_idx):
    lib = load_library()
    if not lib:
        print("ERROR: Library empty or not initialized.")
        return
    n = min(n, len(lib))
    top = lib[:n]
    rest = lib[n:]

    keep = [top[i] for i in keep_idx if i < n]
    bottom = [top[i] for i in bottom_idx if i < n]

    if len(keep) + len(bottom) != n:
        print(f"ERROR: Must assign all {n} cards ({len(keep)} keep + {len(bottom)} bottom != {n}).")
        return

    save_library(keep + rest + bottom)
    print(f"Scry {n}: {len(keep)} top, {len(bottom)} bottom")
    if keep:
        print(f"  Top -> {', '.join(keep)}")


def cmd_remove(card_name):
    lib = load_library()
    for i, c in enumerate(lib):
        if c.lower() == card_name.lower():
            lib.pop(i)
            save_library(lib)
            print(f"Removed: {c}  ({len(lib)} remaining)")
            return
    # Partial
    for i, c in enumerate(lib):
        if card_name.lower() in c.lower():
            lib.pop(i)
            save_library(lib)
            print(f"Removed: {c}  ({len(lib)} remaining)")
            return
    print(f"ERROR: '{card_name}' not found in library.")


def cmd_add_top(card_name):
    lib = load_library()
    lib.insert(0, card_name)
    save_library(lib)
    print(f"Top <- {card_name}  ({len(lib)} total)")


def cmd_add_bottom(card_name):
    lib = load_library()
    lib.append(card_name)
    save_library(lib)
    print(f"Bottom <- {card_name}  ({len(lib)} total)")


def cmd_shuffle_in(card_name):
    lib = load_library()
    lib.insert(random.randint(0, len(lib)), card_name)
    save_library(lib)
    print(f"Shuffled in: {card_name}  ({len(lib)} total)")


def cmd_reshuffle():
    lib = load_library()
    random.shuffle(lib)
    save_library(lib)
    print(f"Reshuffled ({len(lib)} cards)")


def cmd_count():
    lib = load_library()
    print(len(lib))


def cmd_mill(n=1):
    lib = load_library()
    if not lib:
        print("ERROR: Library empty or not initialized.")
        return
    n = min(n, len(lib))
    milled = lib[:n]
    save_library(lib[n:])
    for i, card in enumerate(milled):
        print(f"  {i+1}. {card}")
    print(f"({len(lib) - n} remaining)")


def cmd_search(query):
    lib = load_library()
    matches = [c for c in lib if query.lower() in c.lower()]
    if matches:
        for card in sorted(set(matches)):
            cnt = matches.count(card)
            print(f"  {card}" + (f"  (x{cnt})" if cnt > 1 else ""))
        print(f"{len(matches)} match(es) in {len(lib)} cards")
    else:
        print(f"No matches for '{query}'")


# ── CLI dispatch ────────────────────────────────────────────────────

def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(0)

    cmd = sys.argv[1].lower().replace('-', '_')
    args = sys.argv[2:]

    dispatch = {
        'shuffle':    lambda: cmd_shuffle(' '.join(args)),
        'draw':       lambda: cmd_draw(int(args[0]) if args else 1),
        'peek':       lambda: cmd_peek(int(args[0]) if args else 1),
        'remove':     lambda: cmd_remove(' '.join(args)),
        'add_top':    lambda: cmd_add_top(' '.join(args)),
        'add_bottom': lambda: cmd_add_bottom(' '.join(args)),
        'shuffle_in': lambda: cmd_shuffle_in(' '.join(args)),
        'reshuffle':  lambda: cmd_reshuffle(),
        'count':      lambda: cmd_count(),
        'mill':       lambda: cmd_mill(int(args[0]) if args else 1),
        'search':     lambda: cmd_search(' '.join(args)),
    }

    if cmd == 'scry':
        if not args:
            print("Usage: library.py scry <N> --keep 0,2 --bottom 1")
            sys.exit(1)
        n = int(args[0])
        keep, bottom = [], []
        i = 1
        while i < len(args):
            if args[i] == '--keep' and i + 1 < len(args):
                keep = [int(x) for x in args[i+1].split(',') if x.strip()]
                i += 2
            elif args[i] == '--bottom' and i + 1 < len(args):
                bottom = [int(x) for x in args[i+1].split(',') if x.strip()]
                i += 2
            else:
                i += 1
        cmd_scry(n, keep, bottom)
    elif cmd in dispatch:
        dispatch[cmd]()
    else:
        print(f"Unknown command: {sys.argv[1]}")
        sys.exit(1)


if __name__ == '__main__':
    main()
