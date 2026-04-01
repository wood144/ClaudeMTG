#!/usr/bin/env python3
"""
Hidden library reader for Claude's deck.
Reads claude_library.json (synced from tracker via live_server.py).
The tracker is the sole source of truth — this script is read-only.

Usage (from mtg-commander/):
    python scripts/library.py peek [N]     — show top N cards (default 1)
    python scripts/library.py count        — card count
    python scripts/library.py search <q>   — find cards matching query (no order leak)
"""

import json
import os
import sys

BASE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
LIBRARY_FILE = os.path.join(BASE_DIR, 'claude_library.json')


def load_library():
    try:
        with open(LIBRARY_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return []


def cmd_peek(n=1):
    lib = load_library()
    if not lib:
        print("Library empty or not synced. Is the live server running?")
        return
    n = min(n, len(lib))
    for i in range(n):
        print(f"  {i}. {lib[i]}")
    print(f"({len(lib)} total)")


def cmd_count():
    lib = load_library()
    print(len(lib))


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


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(0)

    cmd = sys.argv[1].lower()
    args = sys.argv[2:]

    if cmd == 'peek':
        cmd_peek(int(args[0]) if args else 1)
    elif cmd == 'count':
        cmd_count()
    elif cmd == 'search':
        cmd_search(' '.join(args))
    else:
        print(f"Unknown command: {cmd}")
        print(__doc__)
        sys.exit(1)


if __name__ == '__main__':
    main()
