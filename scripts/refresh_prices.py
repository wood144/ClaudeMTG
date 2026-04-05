#!/usr/bin/env python3
"""
Monthly price refresh: downloads Scryfall bulk data, extracts the cheapest
USD printing per card, saves compact cache to assets/card_prices.json.

Usage:
    python scripts/refresh_prices.py
"""

import json
import urllib.request
import tempfile
import os
from datetime import datetime

PRICES_CACHE_PATH = 'assets/card_prices.json'
BULK_DATA_URL = 'https://api.scryfall.com/bulk-data/default-cards'
HEADERS = {
    'Accept': 'application/json',
    'User-Agent': 'MTGCommanderTracker/1.0',
}


def get_download_url():
    """Get the current bulk data download URL from Scryfall."""
    req = urllib.request.Request(BULK_DATA_URL, headers=HEADERS)
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
    return data['download_uri']


def download_and_extract_prices(url):
    """Download bulk data, extract min USD price per card name."""
    print(f"  Downloading bulk data...")
    req = urllib.request.Request(url, headers=HEADERS)

    # Download to temp file to avoid holding ~300MB in memory twice
    with tempfile.NamedTemporaryFile(mode='wb', suffix='.json', delete=False) as tmp:
        tmp_path = tmp.name
        with urllib.request.urlopen(req) as resp:
            total = 0
            while True:
                chunk = resp.read(1024 * 1024)  # 1MB chunks
                if not chunk:
                    break
                tmp.write(chunk)
                total += len(chunk)
                mb = total / (1024 * 1024)
                print(f"\r  Downloaded {mb:.0f} MB", end='', flush=True)
    print()

    print(f"  Parsing {total / (1024*1024):.0f} MB of card data...")
    with open(tmp_path, encoding='utf-8') as f:
        cards = json.load(f)

    os.unlink(tmp_path)

    # Extract cheapest USD price per card name
    prices = {}
    skipped = 0
    for card in cards:
        # Skip tokens, emblems, art cards, etc.
        layout = card.get('layout', '')
        if layout in ('token', 'art_series', 'double_faced_token'):
            continue

        name = card.get('name', '')
        if not name:
            continue

        usd_str = card.get('prices', {}).get('usd')
        if not usd_str:
            skipped += 1
            continue

        usd = float(usd_str)
        if name not in prices or usd < prices[name]:
            prices[name] = usd

    print(f"  Extracted prices for {len(prices)} unique cards ({skipped} printings had no USD price)")
    return prices


def main():
    print("Refreshing card prices from Scryfall bulk data...")
    url = get_download_url()
    prices = download_and_extract_prices(url)

    cache = {
        'timestamp': datetime.now().isoformat(),
        'source': 'scryfall-bulk-default-cards',
        'method': 'cheapest-printing',
        'card_count': len(prices),
        'prices': prices,
    }

    with open(PRICES_CACHE_PATH, 'w') as f:
        json.dump(cache, f)

    size_kb = os.path.getsize(PRICES_CACHE_PATH) / 1024
    print(f"  Saved {len(prices)} prices to {PRICES_CACHE_PATH} ({size_kb:.0f} KB)")
    print("Done.")


if __name__ == '__main__':
    main()
