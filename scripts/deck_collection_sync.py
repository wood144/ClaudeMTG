#!/usr/bin/env python3
"""Move cards between a decklist and collection.db when a deck is built or torn down.

collection.db holds loose cards; decks.json holds sleeved ones. When a deck is
disassembled its cards become loose, and when a deck is built they stop being
loose — this keeps the two in step so "do I own this" stays trustworthy.

    # Bello came apart, Everything Must Go got sleeved, in one pass
    python scripts/deck_collection_sync.py --disassemble "Bello precon" \
                                           --build "Everything Must Go"

    python scripts/deck_collection_sync.py --disassemble "cats" --dry-run

--disassemble  adds the deck's non-basic cards TO the collection
--build        removes the deck's non-basic cards FROM the collection

Basic lands are never tracked in collection.db and are skipped. Rows are stored
per printing, so adding a card that already has a row (different set) creates a
second row rather than merging — aggregate with SUM(quantity) GROUP BY name.
An identical name+set+foil increments the existing row instead.

New rows are enriched from Scryfall. If a set code is passed with --set, that
printing is preferred (precons: the whole deck is usually one set); otherwise
Scryfall's default printing is used. collection.db is copied to .bak first.

Removal takes from the largest-quantity row first and deletes rows that hit
zero. If the collection holds fewer copies than the deck needs, nothing is
removed for that card and it is reported as a PROBLEM — that means the card was
never scanned, not that the deck is wrong.
"""

import argparse
import json
import os
import re
import shutil
import sqlite3
import sys
import time
import urllib.request
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB = os.path.join(ROOT, 'assets', 'collection.db')
DECKS = os.path.join(ROOT, 'assets', 'decks.json')
BASICS = {'Swamp', 'Mountain', 'Forest', 'Island', 'Plains', 'Wastes'}
HEADERS = {'User-Agent': 'MTGTracker/1.0', 'Accept': 'application/json'}


def decklist(name):
    decks = json.load(open(DECKS, encoding='utf-8'))
    match = [d for d in decks if d['name'] == name]
    if not match:
        sys.exit(f'no deck named "{name}" in decks.json')
    out = []
    for line in match[0]['list'].split('\n'):
        line = line.strip()
        if not line:
            continue
        qty, card = line.split(' ', 1)
        card = re.sub(r'\s*\*CMDR\*$', '', card).strip()
        if card not in BASICS:
            out.append((int(qty), card))
    return out


def scryfall(names, prefer_set=None):
    """name -> card object, preferring a given set code when it has that printing."""
    info, pending = {}, []

    def post(identifiers):
        body = json.dumps({'identifiers': identifiers}).encode()
        req = urllib.request.Request('https://api.scryfall.com/cards/collection',
                                     data=body, headers={**HEADERS,
                                                         'Content-Type': 'application/json'})
        return json.load(urllib.request.urlopen(req, timeout=30))

    if prefer_set:
        for i in range(0, len(names), 70):
            res = post([{'name': n, 'set': prefer_set} for n in names[i:i + 70]])
            for c in res.get('data', []):
                info[c['name']] = c
            pending += [m['name'] for m in res.get('not_found', [])]
            time.sleep(0.2)
    else:
        pending = list(names)

    for i in range(0, len(pending), 70):
        res = post([{'name': n} for n in pending[i:i + 70]])
        for c in res.get('data', []):
            info[c['name']] = c
        for m in res.get('not_found', []):
            print('  SCRYFALL MISS:', m)
        time.sleep(0.2)
    return info


def lookup(info, name):
    if name in info:
        return info[name]
    for k in info:                       # double-faced cards
        if k.split(' // ')[0] == name.split(' // ')[0]:
            return info[k]
    return None


def add_to_collection(con, cards, prefer_set, dry):
    info = scryfall([n for _, n in cards], prefer_set)
    missing = [n for _, n in cards if not lookup(info, n)]
    if missing:
        sys.exit(f'ABORT: no Scryfall data for {missing}')
    new = inc = 0
    for qty, name in cards:
        c = lookup(info, name)
        faces = c.get('card_faces') or [{}]
        colors = c.get('colors')
        if colors is None:
            colors = faces[0].get('colors', [])
        row = con.execute('SELECT rowid FROM cards WHERE name=? AND set_code=? AND foil=?',
                          (c['name'], c['set'], 'false')).fetchone()
        if row:
            inc += 1
            if not dry:
                con.execute('UPDATE cards SET quantity=quantity+? WHERE rowid=?', (qty, row[0]))
        else:
            new += 1
            if not dry:
                con.execute(
                    '''INSERT INTO cards (name,set_code,set_name,collector_number,foil,
                       rarity,quantity,manabox_id,scryfall_id,price,condition,language,
                       added,colors,color_identity,type,cmc,power,toughness,keywords,oracle)
                       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)''',
                    (c['name'], c['set'], c['set_name'], c['collector_number'], 'false',
                     c.get('rarity', ''), qty, None, c.get('id'),
                     float((c.get('prices') or {}).get('usd') or 0) or None,
                     'near_mint', 'en', date.today().isoformat(),
                     ''.join(colors), ''.join(c.get('color_identity', [])),
                     c.get('type_line', ''), c.get('cmc', 0),
                     c.get('power') or faces[0].get('power'),
                     c.get('toughness') or faces[0].get('toughness'),
                     ','.join(c.get('keywords', [])),
                     c.get('oracle_text') or ' // '.join(
                         f.get('oracle_text', '') for f in faces)))
    print(f'  added: {new} new rows, {inc} existing rows incremented')


def remove_from_collection(con, cards, dry):
    deleted = decremented = 0
    problems = []
    for qty, name in cards:
        rows = con.execute(
            'SELECT rowid, quantity FROM cards WHERE name=? ORDER BY quantity DESC',
            (name,)).fetchall()
        if not rows:
            problems.append(f'{name}: not in collection.db (never scanned?)')
            continue
        left = qty
        for rowid, have in rows:
            if left <= 0:
                break
            take = min(have, left)
            if take == have:
                deleted += 1
                if not dry:
                    con.execute('DELETE FROM cards WHERE rowid=?', (rowid,))
            else:
                decremented += 1
                if not dry:
                    con.execute('UPDATE cards SET quantity=quantity-? WHERE rowid=?',
                                (take, rowid))
            left -= take
        if left:
            problems.append(f'{name}: needed {qty}, only {qty - left} in collection')
    print(f'  removed: {deleted} rows deleted, {decremented} rows decremented')
    for p in problems:
        print('  PROBLEM:', p)
    return problems


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--disassemble', metavar='DECK', help='deck taken apart: cards go INTO collection')
    ap.add_argument('--build', metavar='DECK', help='deck sleeved up: cards come OUT of collection')
    ap.add_argument('--set', metavar='CODE', help='preferred set code for added cards (e.g. blc)')
    ap.add_argument('--dry-run', action='store_true')
    args = ap.parse_args()
    if not args.disassemble and not args.build:
        ap.error('give --disassemble and/or --build')

    con = sqlite3.connect(DB)
    before = con.execute('SELECT COUNT(*), SUM(quantity) FROM cards').fetchone()
    if not args.dry_run:
        shutil.copy2(DB, DB + '.bak')

    delta = 0
    if args.disassemble:
        cards = decklist(args.disassemble)
        print(f'{args.disassemble} -> collection ({sum(q for q, _ in cards)} non-basic cards)')
        add_to_collection(con, cards, args.set, args.dry_run)
        delta += sum(q for q, _ in cards)
    if args.build:
        cards = decklist(args.build)
        print(f'collection -> {args.build} ({sum(q for q, _ in cards)} non-basic cards)')
        remove_from_collection(con, cards, args.dry_run)
        delta -= sum(q for q, _ in cards)

    if args.dry_run:
        con.rollback()
        print('DRY RUN: no changes written')
        return
    con.commit()
    after = con.execute('SELECT COUNT(*), SUM(quantity) FROM cards').fetchone()
    print(f'collection.db: rows {before[0]} -> {after[0]}   qty {before[1]} -> {after[1]} '
          f'(expected {delta:+d})')
    if after[1] - before[1] != delta:
        print('  WARNING: quantity delta does not match — check the PROBLEM lines above')


if __name__ == '__main__':
    main()
