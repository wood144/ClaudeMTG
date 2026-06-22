#!/usr/bin/env python3
"""Import a collection-export CSV into a searchable SQLite DB (assets/collection.db).

Handles ManaBox exports now and Dragon Shield exports later (header sniffer maps
both to one internal record). Enriches every row with gameplay attributes
(colors, color_identity, type, cmc, P/T, keywords, oracle) pulled once from
Scryfall's `oracle_cards` bulk file, matched by card name.

Usage:
    python scripts/import_collection.py assets/rare_mythic.csv
    python scripts/import_collection.py assets/rare_mythic.csv --no-enrich
    python scripts/import_collection.py a.csv b.csv          # merge several exports
    python scripts/import_collection.py assets/rare_mythic.csv --refresh-scryfall

Each run rebuilds the table from the listed CSVs (idempotent). The Scryfall bulk
file is cached in the system temp dir and reused unless --refresh-scryfall is set.

Query examples (sqlite3 assets/collection.db):
    SELECT name,set_code,price FROM cards
      WHERE color_identity='G' AND type LIKE '%Creature%' AND price<1
      ORDER BY price DESC;
    SELECT name, SUM(quantity) q FROM cards GROUP BY name ORDER BY q DESC LIMIT 20;
"""
import argparse
import csv
import json
import os
import sqlite3
import sys
import tempfile
import urllib.request

WUBRG = "WUBRG"
SCRYFALL_BULK_INDEX = "https://api.scryfall.com/bulk-data"
# Scryfall asks for a descriptive User-Agent and an Accept header.
HEADERS = {
    "User-Agent": "MTG-opponent-collection-importer/1.0",
    "Accept": "application/json;q=0.9,*/*;q=0.8",
}

ASSETS = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets")
DB_PATH = os.path.join(ASSETS, "collection.db")


# ---- CSV format sniffing -------------------------------------------------

# Map each known export format's header field -> our internal key.
MANABOX_MAP = {
    "Name": "name", "Set code": "set_code", "Set name": "set_name",
    "Collector number": "collector_number", "Foil": "foil", "Rarity": "rarity",
    "Quantity": "quantity", "ManaBox ID": "manabox_id", "Scryfall ID": "scryfall_id",
    "Purchase price": "price", "Condition": "condition", "Language": "language",
    "Added": "added",
}
DRAGONSHIELD_MAP = {
    "Card Name": "name", "Set Code": "set_code", "Set Name": "set_name",
    "Card Number": "collector_number", "Printing": "foil", "Quantity": "quantity",
    "Condition": "condition", "Language": "language", "Price Bought": "price",
    "Date Bought": "added",
}


def sniff(fieldnames):
    """Return the field map for the detected export format."""
    fset = set(fieldnames or [])
    if "ManaBox ID" in fset:
        return MANABOX_MAP
    if "Card Name" in fset and "Folder Name" in fset:
        return DRAGONSHIELD_MAP
    raise SystemExit(f"Unrecognized CSV header: {fieldnames}")


def read_csv(path):
    rows = []
    with open(path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fmap = sniff(reader.fieldnames)
        for raw in reader:
            rec = {}
            for src, dst in fmap.items():
                rec[dst] = (raw.get(src) or "").strip()
            # Normalize foil flag: ManaBox uses "foil"/"normal"; DS "Foil"/"Normal".
            rec["foil"] = "true" if rec.get("foil", "").lower().startswith("foil") else "false"
            rec["quantity"] = int(rec.get("quantity") or 1)
            try:
                rec["price"] = float(rec.get("price") or 0) or None
            except ValueError:
                rec["price"] = None
            rows.append(rec)
    return rows


# ---- Scryfall enrichment -------------------------------------------------

def fetch_scryfall_oracle(refresh=False):
    """Download (and cache) the oracle_cards bulk file; return name->attrs map."""
    cache = os.path.join(tempfile.gettempdir(), "scryfall_oracle_cards.json")
    if refresh or not os.path.exists(cache):
        print("Fetching Scryfall bulk-data index...", file=sys.stderr)
        req = urllib.request.Request(SCRYFALL_BULK_INDEX, headers=HEADERS)
        with urllib.request.urlopen(req) as r:
            index = json.load(r)
        entry = next(e for e in index["data"] if e["type"] == "oracle_cards")
        url = entry["download_uri"]
        print(f"Downloading {url} (~{entry.get('size',0)//1_000_000} MB)...", file=sys.stderr)
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req) as r, open(cache, "wb") as out:
            while chunk := r.read(1 << 20):
                out.write(chunk)
    else:
        print(f"Using cached Scryfall bulk file: {cache}", file=sys.stderr)

    with open(cache, encoding="utf-8") as f:
        cards = json.load(f)

    attrs = {}
    for c in cards:
        attrs[c["name"]] = {
            "colors": "".join(x for x in WUBRG if x in (c.get("colors") or [])),
            "color_identity": "".join(x for x in WUBRG if x in (c.get("color_identity") or [])),
            "type": c.get("type_line", ""),
            "cmc": c.get("cmc"),
            "power": c.get("power"),
            "toughness": c.get("toughness"),
            "keywords": ",".join(c.get("keywords") or []),
            "oracle": c.get("oracle_text", ""),
        }
    return attrs


EMPTY_ATTRS = {"colors": None, "color_identity": None, "type": None, "cmc": None,
               "power": None, "toughness": None, "keywords": None, "oracle": None}


# ---- DB build ------------------------------------------------------------

COLUMNS = [
    "name", "set_code", "set_name", "collector_number", "foil", "rarity",
    "quantity", "manabox_id", "scryfall_id", "price", "condition", "language",
    "added", "colors", "color_identity", "type", "cmc", "power", "toughness",
    "keywords", "oracle",
]


def build_db(rows, attrs):
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()
    cur.execute(f"""CREATE TABLE cards (
        name TEXT, set_code TEXT, set_name TEXT, collector_number TEXT,
        foil TEXT, rarity TEXT, quantity INTEGER, manabox_id TEXT,
        scryfall_id TEXT, price REAL, condition TEXT, language TEXT, added TEXT,
        colors TEXT, color_identity TEXT, type TEXT, cmc REAL,
        power TEXT, toughness TEXT, keywords TEXT, oracle TEXT
    )""")

    unmatched = set()
    payload = []
    for r in rows:
        a = attrs.get(r["name"]) if attrs else None
        if attrs and a is None:
            unmatched.add(r["name"])
            a = EMPTY_ATTRS
        elif a is None:
            a = EMPTY_ATTRS
        rec = {**r, **a}
        payload.append([rec.get(col) for col in COLUMNS])

    cur.executemany(
        f"INSERT INTO cards ({','.join(COLUMNS)}) VALUES ({','.join('?' * len(COLUMNS))})",
        payload,
    )
    for col in ("name", "set_code", "rarity", "colors", "color_identity", "price"):
        cur.execute(f"CREATE INDEX idx_{col} ON cards({col})")
    con.commit()

    total_rows = cur.execute("SELECT COUNT(*) FROM cards").fetchone()[0]
    total_qty = cur.execute("SELECT SUM(quantity) FROM cards").fetchone()[0]
    distinct = cur.execute("SELECT COUNT(DISTINCT name) FROM cards").fetchone()[0]
    con.close()
    return total_rows, total_qty, distinct, unmatched


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("csv", nargs="+", help="collection export CSV(s)")
    ap.add_argument("--no-enrich", action="store_true", help="skip Scryfall enrichment")
    ap.add_argument("--refresh-scryfall", action="store_true", help="re-download bulk file")
    args = ap.parse_args()

    rows = []
    for path in args.csv:
        rows.extend(read_csv(path))
    print(f"Read {len(rows)} rows from {len(args.csv)} file(s).", file=sys.stderr)

    attrs = None if args.no_enrich else fetch_scryfall_oracle(args.refresh_scryfall)

    total_rows, total_qty, distinct, unmatched = build_db(rows, attrs)
    print(f"\nWrote {DB_PATH}")
    print(f"  rows (printings): {total_rows}")
    print(f"  total quantity:   {total_qty}")
    print(f"  distinct names:   {distinct}")
    if attrs is not None:
        print(f"  enriched:         {total_rows - len(unmatched_rows(rows, unmatched))}/{total_rows} rows matched Scryfall")
        if unmatched:
            print(f"  UNMATCHED names ({len(unmatched)}): " +
                  ", ".join(sorted(unmatched)[:15]) + (" ..." if len(unmatched) > 15 else ""))


def unmatched_rows(rows, unmatched):
    return [r for r in rows if r["name"] in unmatched]


if __name__ == "__main__":
    main()
