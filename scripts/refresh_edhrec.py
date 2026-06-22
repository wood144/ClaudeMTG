#!/usr/bin/env python3
"""
Monthly EDHrec rank refresh: fetches commander popularity rank (by deck count)
for each deck in decks.json and caches to assets/edhrec_ranks.json.

Usage:
    python scripts/refresh_edhrec.py
"""

import json
import re
import time
import urllib.request
from datetime import datetime

DECKS_PATH = 'assets/decks.json'
EDHREC_CACHE_PATH = 'assets/edhrec_ranks.json'
EDHREC_URL = 'https://json.edhrec.com/pages/commanders/{slug}.json'
HEADERS = {
    'Accept': 'application/json',
    'User-Agent': 'MTGCommanderTracker/1.0',
}
REQUEST_DELAY = 0.5  # be polite to EDHrec


def slugify(name):
    """Convert commander name to EDHrec URL slug.
    Strips MDFC back side, removes apostrophes, lowercases, hyphenates."""
    name = name.split('//')[0].strip()
    name = name.replace("'", '')  # apostrophe stripped, not replaced
    s = re.sub(r'[^a-zA-Z0-9]+', '-', name.lower()).strip('-')
    return s


def extract_commanders(decklist):
    """Extract commander name(s) from a decklist string.
    Uses *CMDR* markers if present, else first line."""
    lines = [l.strip() for l in decklist.split('\n') if l.strip()]
    cmdr_lines = [l for l in lines if '*CMDR*' in l]
    if not cmdr_lines:
        cmdr_lines = lines[:1]
    cmdrs = []
    for line in cmdr_lines:
        # Strip "1 " prefix and "*CMDR*" suffix
        name = re.sub(r'^\d+\s+', '', line)
        name = name.replace('*CMDR*', '').strip()
        cmdrs.append(name)
    return cmdrs


def fetch_rank(slug):
    """Fetch commander rank + num_decks from EDHrec. Returns (rank, num_decks) or (None, None)."""
    url = EDHREC_URL.format(slug=slug)
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode('utf-8'))
        card = data['container']['json_dict']['card']
        return card.get('rank'), card.get('num_decks')
    except Exception as e:
        return None, None


def commander_slug(cmdrs):
    """Build EDHrec slug from one or more commander names.
    For partners, combines in order: slug1-slug2.
    For single commanders, just slugify."""
    if len(cmdrs) == 1:
        return slugify(cmdrs[0])
    # Partner / background / multi-cmdr — try combined slug in decklist order
    return '-'.join(slugify(c) for c in cmdrs)


def main():
    print('Refreshing EDHrec commander ranks...')
    with open(DECKS_PATH) as f:
        decks = json.load(f)

    ranks = {}
    failures = []
    for deck in decks:
        name = deck['name']
        cmdrs = extract_commanders(deck.get('list', ''))
        if not cmdrs:
            print(f'  {name}: no commander found, skipping')
            failures.append(name)
            continue

        slug = commander_slug(cmdrs)
        rank, num_decks = fetch_rank(slug)

        # Partner fallback: if combined slug 404s, try first commander alone
        if rank is None and len(cmdrs) > 1:
            slug_solo = slugify(cmdrs[0])
            rank, num_decks = fetch_rank(slug_solo)
            if rank is not None:
                slug = slug_solo

        if rank is not None:
            ranks[name] = {'rank': rank, 'num_decks': num_decks, 'slug': slug}
            print(f'  {name:40} -> rank {rank}, {num_decks} decks ({slug})')
        else:
            print(f'  {name:40} -> FAILED ({slug})')
            failures.append(name)

        time.sleep(REQUEST_DELAY)

    cache = {
        'timestamp': datetime.now().isoformat(),
        'source': 'edhrec-json-commanders',
        'deck_count': len(ranks),
        'ranks': ranks,
    }

    with open(EDHREC_CACHE_PATH, 'w') as f:
        json.dump(cache, f, indent=2)

    print(f'\nSaved {len(ranks)} ranks to {EDHREC_CACHE_PATH}')
    if failures:
        print(f'Failures ({len(failures)}): {", ".join(failures)}')
    print('Done.')


if __name__ == '__main__':
    main()
