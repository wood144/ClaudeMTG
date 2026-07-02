import json, sqlite3, re, sys
from collections import Counter

decks = json.load(open('assets/decks.json'))
cd = json.load(open('assets/card_data.json'))
con = sqlite3.connect('assets/collection.db'); con.row_factory = sqlite3.Row
coll = [dict(r) for r in con.execute('SELECT * FROM cards')]

CI = {
 'Eldrazi': set(''), 'Boros equipment': set('RW'), 'quit hitting yourself': set('RG'),
 'Avatar Allies': set('WUR'), 'cats': set('RW'), 'Fun Guys': set('WBG'),
 'dinosaur eggs': set('RGW'), 'The Claw!': set('BR'),
 'Food and fellowship LotR upgraded': set('BG'), 'Dicebots': set(''),
 'squirrel food': set('G'), 'Dargons': set('WUBRG'), 'Da Bears': set('G'),
 'faeries': set('UB'), 'Every Shrine Ever': set('WUBRG'), 'Fblthp': set('U'),
 'mill/steal': set('UB'), 'I call him big booty': set('WBG'),
}
SKIP = {'Bello precon', 'Zinnia precon', 'meteor apes'}

def deck_cards(deck):
    out = []
    for l in deck['list'].strip().split('\n'):
        l = l.strip()
        if not l: continue
        m = re.match(r'(\d+)\s+(.*?)(\s*\*CMDR\*)?$', l)
        if m: out.append(m.group(2).strip())
    return out

def subtypes(names):
    c = Counter()
    for n in names:
        info = cd.get(n) or cd.get(n.split(' //')[0])
        if not info: continue
        t = info.get('type', '')
        parts = re.split(r'[—\-]', t)
        if len(parts) > 1:
            for w in parts[1].replace('//', ' ').split():
                c[w] += 1
    return c

TRIBES = {
 'Eldrazi': ['Eldrazi'], 'cats': ['Cat'], 'Da Bears': ['Bear'],
 'faeries': ['Faerie'], 'dinosaur eggs': ['Dinosaur'], 'squirrel food': ['Squirrel'],
 'Dargons': ['Dragon'], 'Fun Guys': ['Fungus', 'Saproling'],
 'Every Shrine Ever': ['Shrine'],
}

target = sys.argv[1] if len(sys.argv) > 1 else None

for deck in decks:
    name = deck['name']
    if name in SKIP or name not in CI: continue
    if target and target.lower() not in name.lower(): continue
    ci = CI[name]
    names = deck_cards(deck)
    subs = subtypes(names)
    tribes = TRIBES.get(name) or [t for t, _ in subs.most_common(5)]
    pool = []
    for c in coll:
        cci = set((c['color_identity'] or '').replace(',', ''))
        if not cci.issubset(ci): continue
        pool.append(c)
    print("\n" + "=" * 72)
    print(f"{name}  CI={''.join(sorted(ci)) or 'C'}  tribes={tribes}  pool={len(pool)}")
    # surface tribal matches
    tribe_set = set(tribes)
    matches = []
    for c in pool:
        t = c['type'] or ''
        orc = (c['oracle'] or '')
        score = 0
        for tr in tribe_set:
            if tr and (tr in t or tr in orc):
                score += 3
        matches.append((score, c))
    matches.sort(key=lambda x: -x[0])
    if target:
        for score, c in matches:
            if score <= 0: break
            print(f"  [{score}] {c['name']:34} {c['type'][:38]:38} cmc{c['cmc']}  ${c['price']}")
            print(f"        {(c['oracle'] or '').replace(chr(10),' ')[:150]}")
