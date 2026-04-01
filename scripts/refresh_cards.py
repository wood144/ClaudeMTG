#!/usr/bin/env python3
"""
Refresh card_data.json with full Scryfall data including image URIs.
Scrapes slowly (~100ms between requests) to stay well under rate limits.
Run monthly or after adding new decks.

Usage (from mtg-commander/):
    python scripts/refresh_cards.py           # update all decks
    python scripts/refresh_cards.py --check   # just report what's missing
"""

import json
import os
import re
import sys
import time
import urllib.request
import urllib.parse
import urllib.error

BASE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
DECKS_FILE = os.path.join(BASE_DIR, 'assets', 'decks.json')
CACHE_FILE = os.path.join(BASE_DIR, 'assets', 'card_data.json')
DELAY = 0.12  # seconds between requests (~8/sec, well under Scryfall's 10/sec)


def load_cache():
    try:
        with open(CACHE_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return {}


def save_cache(cache):
    with open(CACHE_FILE, 'w', encoding='utf-8') as f:
        json.dump(cache, f, indent=2, ensure_ascii=False)


def get_all_card_names():
    """Extract unique card names from all decks."""
    with open(DECKS_FILE, 'r', encoding='utf-8') as f:
        decks = json.load(f)
    names = set()
    for d in decks:
        for line in d.get('list', '').strip().split('\n'):
            line = line.strip()
            if not line:
                continue
            m = re.match(r'^\d+\s+(.+?)(\s*\*CMDR\*)?$', line)
            if m:
                names.add(m.group(1).strip())
    return sorted(names)


def fetch_scryfall(name):
    """Fetch a card from Scryfall fuzzy search."""
    url = f"https://api.scryfall.com/cards/named?fuzzy={urllib.parse.quote(name)}"
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={
                'User-Agent': 'ClaudeMTG/1.0',
                'Accept': 'application/json',
            })
            with urllib.request.urlopen(req, timeout=10) as resp:
                return json.loads(resp.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(1)
                continue
            elif e.code == 404:
                return None
            else:
                time.sleep(0.5)
                continue
        except Exception:
            time.sleep(0.5)
            continue
    return None


def extract_card_data(scryfall):
    """Extract the fields we cache from a Scryfall response."""
    if not scryfall:
        return None

    # Image URIs — handle normal cards and DFCs
    image_uris = None
    card_faces_images = None
    if scryfall.get('image_uris'):
        image_uris = {
            'small': scryfall['image_uris'].get('small'),
            'normal': scryfall['image_uris'].get('normal'),
            'large': scryfall['image_uris'].get('large'),
        }
    if scryfall.get('card_faces'):
        card_faces_images = []
        for face in scryfall['card_faces']:
            face_data = {'name': face.get('name')}
            if face.get('image_uris'):
                face_data['image_uris'] = {
                    'small': face['image_uris'].get('small'),
                    'normal': face['image_uris'].get('normal'),
                    'large': face['image_uris'].get('large'),
                }
            card_faces_images.append(face_data)

    entry = {
        'name': scryfall.get('name', ''),
        'mana_cost': scryfall.get('mana_cost', ''),
        'cmc': scryfall.get('cmc', 0),
        'type': scryfall.get('type_line', ''),
        'oracle': scryfall.get('oracle_text', ''),
        'power': scryfall.get('power'),
        'toughness': scryfall.get('toughness'),
        'keywords': scryfall.get('keywords', []),
        'layout': scryfall.get('layout', 'normal'),
    }

    if image_uris:
        entry['image_uris'] = image_uris
    if card_faces_images:
        entry['card_faces'] = card_faces_images
        # For DFCs, oracle text may be on the faces
        if not entry['oracle'] and card_faces_images:
            face_texts = []
            for face in scryfall.get('card_faces', []):
                if face.get('oracle_text'):
                    face_texts.append(face['oracle_text'])
            entry['oracle'] = '\n---\n'.join(face_texts)

    return entry


def main():
    check_only = '--check' in sys.argv
    cache = load_cache()
    all_names = get_all_card_names()

    # Find cards missing image_uris or not in cache at all
    needs_update = []
    for name in all_names:
        entry = cache.get(name)
        if not entry or 'image_uris' not in entry:
            # Also check if it's a DFC without card_faces images
            if entry and entry.get('layout') in ('transform', 'modal_dfc') and 'card_faces' in entry:
                continue  # DFC with face data, might be fine
            needs_update.append(name)

    # Always refresh all cards to get latest art
    if not check_only:
        needs_update = all_names

    print(f"Decks: {len(all_names)} unique cards")
    print(f"Cached: {len(cache)} cards")
    print(f"Need update: {len(needs_update)} cards")

    if check_only:
        if needs_update:
            for n in needs_update[:20]:
                print(f"  - {n}")
            if len(needs_update) > 20:
                print(f"  ... and {len(needs_update) - 20} more")
        return

    if not needs_update:
        print("All cards up to date.")
        return

    est = len(needs_update) * DELAY
    print(f"Fetching {len(needs_update)} cards (~{est:.0f}s)...")

    updated = 0
    failed = []
    for i, name in enumerate(needs_update):
        scryfall = fetch_scryfall(name)
        if scryfall:
            entry = extract_card_data(scryfall)
            if entry:
                cache[name] = entry
                updated += 1
        else:
            failed.append(name)

        if (i + 1) % 25 == 0:
            print(f"  {i+1}/{len(needs_update)}...")
            save_cache(cache)  # checkpoint

        time.sleep(DELAY)

    save_cache(cache)
    print(f"\nDone: {updated} updated, {len(failed)} failed")
    if failed:
        print("Failed cards:")
        for n in failed:
            print(f"  - {n}")


if __name__ == '__main__':
    main()
