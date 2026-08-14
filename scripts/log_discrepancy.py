#!/usr/bin/env python3
"""Track collection-scan errors found while physically building decks.

The ManaBox scan is not ground truth for individual copies. Every deck built
from a pick list is a free audit of ~100 cards, so logging what turns up gives a
measured error rate instead of a guess, and shows whether the misses cluster in
a particular set or rarity.

Two directions, and they are NOT equally visible:
  missing  (false positive) - db says owned, card isn't physically there.
                              Surfaces immediately during a build.
  extra    (false negative) - card is owned but absent from the db.
                              SILENT: it just never gets suggested. Only found
                              by accident, so the logged rate understates it.

Usage:
    # card in the db but not in the box -> log it and delete the row
    python scripts/log_discrepancy.py missing "Unexpected Windfall" --source "Everything Must Go build"

    # log without touching the db
    python scripts/log_discrepancy.py missing "Card Name" --no-delete

    # owned but not in the db (found while sorting)
    python scripts/log_discrepancy.py extra "Card Name" --set "Foundations" --rarity rare --qty 2

    # record that a build audited N cards, so the rate has a denominator
    python scripts/log_discrepancy.py audit "Everything Must Go" --count 81

--count is CARDS PHYSICALLY HUNTED FOR, not deck size: skip basic lands (never in
the db), and remember that cards already sleeved in the deck were not necessarily
db-backed. The denominator is fuzzy by nature, so treat the rate as an order of
magnitude, not a measurement, until a few thousand cards have been checked.

    python scripts/log_discrepancy.py report

Writes assets/collection_discrepancies.csv and assets/collection_audits.csv.
Always backs up collection.db to collection.db.bak before deleting anything.
"""

import argparse
import csv
import os
import shutil
import sqlite3
import sys
from collections import Counter
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB = os.path.join(ROOT, 'assets', 'collection.db')
DISC = os.path.join(ROOT, 'assets', 'collection_discrepancies.csv')
AUDIT = os.path.join(ROOT, 'assets', 'collection_audits.csv')

DISC_COLS = ['date', 'direction', 'name', 'set_name', 'collector_number',
             'rarity', 'quantity', 'source', 'note']
AUDIT_COLS = ['date', 'label', 'cards_checked', 'note']


def append(path, cols, row):
    new = not os.path.exists(path)
    with open(path, 'a', encoding='utf-8', newline='') as fh:
        w = csv.DictWriter(fh, fieldnames=cols)
        if new:
            w.writeheader()
        w.writerow(row)


def read(path):
    if not os.path.exists(path):
        return []
    with open(path, encoding='utf-8-sig', newline='') as fh:
        return list(csv.DictReader(fh))


def cmd_missing(args):
    con = sqlite3.connect(DB)
    rows = con.execute(
        'SELECT name,set_name,collector_number,rarity,quantity FROM cards WHERE name=?',
        (args.name,)).fetchall()
    if not rows:
        sys.exit(f'"{args.name}" is not in collection.db — nothing to log or delete.')
    if len(rows) > 1 and not args.all_printings:
        print(f'{len(rows)} printings found; pass --all-printings to remove every one:')
        for r in rows:
            print('   ', r)
        sys.exit(1)

    for name, st, cn, rar, qty in rows:
        append(DISC, DISC_COLS, {
            'date': args.date, 'direction': 'missing', 'name': name,
            'set_name': st or '', 'collector_number': cn or '', 'rarity': rar or '',
            'quantity': qty, 'source': args.source, 'note': args.note})
        print(f'logged missing: {name} ({st} #{cn}, {rar}, qty {qty})')

    if args.no_delete:
        print('--no-delete: collection.db untouched.')
        return
    shutil.copy2(DB, DB + '.bak')
    before = con.execute('SELECT COUNT(*), SUM(quantity) FROM cards').fetchone()
    con.execute('DELETE FROM cards WHERE name=?', (args.name,))
    con.commit()
    after = con.execute('SELECT COUNT(*), SUM(quantity) FROM cards').fetchone()
    print(f'collection.db: rows {before[0]} -> {after[0]}, qty {before[1]} -> {after[1]}'
          f'  (backup at {os.path.basename(DB)}.bak)')


def cmd_extra(args):
    append(DISC, DISC_COLS, {
        'date': args.date, 'direction': 'extra', 'name': args.name,
        'set_name': args.set or '', 'collector_number': args.collector or '',
        'rarity': args.rarity or '', 'quantity': args.qty,
        'source': args.source, 'note': args.note})
    print(f'logged extra (owned, not in db): {args.name}')
    print('NOTE: add it for real with  python scripts/import_collection.py <csv> --add')


def cmd_audit(args):
    append(AUDIT, AUDIT_COLS, {'date': args.date, 'label': args.label,
                               'cards_checked': args.count, 'note': args.note})
    print(f'logged audit: {args.label} ({args.count} cards checked)')


def cmd_report(_args):
    disc, audits = read(DISC), read(AUDIT)
    checked = sum(int(a['cards_checked'] or 0) for a in audits)
    missing = [d for d in disc if d['direction'] == 'missing']
    extra = [d for d in disc if d['direction'] == 'extra']

    con = sqlite3.connect(DB)
    rows, qty = con.execute('SELECT COUNT(*), SUM(quantity) FROM cards').fetchone()
    print(f'collection.db: {rows} printings / {qty} cards')
    print(f'audited so far: {checked} cards across {len(audits)} build(s)')
    print(f'discrepancies:  {len(missing)} missing (db says owned, not there)'
          f' / {len(extra)} extra (owned, not in db)')
    if checked:
        rate = len(missing) / checked
        print(f'measured false-positive rate: {rate:.3%} '
              f'({rate * qty:.0f} projected across the full collection)')
        print('  (false negatives are silent, so the true error rate is higher)')
        if checked < 500:
            print(f'  SMALL SAMPLE: {checked} cards checked. One find swings this rate'
                  f' by {1 / checked:.2%} - treat it as a placeholder, not a measurement.')
    else:
        print('no audits logged yet, so there is no denominator for a rate')

    for label, key in [('by set', 'set_name'), ('by rarity', 'rarity')]:
        c = Counter(d[key] for d in disc if d[key])
        if c:
            print(f'\n{label}:')
            for k, n in c.most_common():
                print(f'  {n:3}  {k}')
    if disc:
        print('\nlog:')
        for d in disc:
            print(f"  {d['date']}  {d['direction']:7} {d['name']}"
                  f"  [{d['set_name']} {d['rarity']}]  {d['source']}")


def main():
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest='cmd', required=True)

    def common(p):
        p.add_argument('--date', default=date.today().isoformat())
        p.add_argument('--source', default='', help='which build/session found it')
        p.add_argument('--note', default='')

    m = sub.add_parser('missing', help='db says owned but the card is not there')
    m.add_argument('name')
    m.add_argument('--no-delete', action='store_true', help='log only, keep the db row')
    m.add_argument('--all-printings', action='store_true')
    common(m)
    m.set_defaults(func=cmd_missing)

    e = sub.add_parser('extra', help='card is owned but missing from the db')
    e.add_argument('name')
    e.add_argument('--set', default='')
    e.add_argument('--collector', default='')
    e.add_argument('--rarity', default='')
    e.add_argument('--qty', type=int, default=1)
    common(e)
    e.set_defaults(func=cmd_extra)

    a = sub.add_parser('audit', help='record that a build checked N cards')
    a.add_argument('label')
    a.add_argument('--count', type=int, required=True)
    a.add_argument('--date', default=date.today().isoformat())
    a.add_argument('--note', default='')
    a.set_defaults(func=cmd_audit)

    r = sub.add_parser('report', help='rates and clustering')
    r.set_defaults(func=cmd_report)

    args = ap.parse_args()
    args.func(args)


if __name__ == '__main__':
    main()
