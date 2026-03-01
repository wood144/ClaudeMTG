/**
 * build-card-cache.js
 * Fetches card data from Scryfall for every unique non-basic card across all decks.
 * Output: assets/card_data.json
 * Run with: node scripts/build-card-cache.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const DECKS_PATH = path.join(__dirname, '../assets/decks.json');
const OUTPUT_PATH = path.join(__dirname, '../assets/card_data.json');
const RATE_LIMIT_MS = 110; // Scryfall asks for max ~10 req/sec

const BASIC_LANDS = new Set([
  'Plains', 'Island', 'Swamp', 'Mountain', 'Forest', 'Wastes',
  'Snow-Covered Plains', 'Snow-Covered Island', 'Snow-Covered Swamp',
  'Snow-Covered Mountain', 'Snow-Covered Forest', 'Snow-Covered Wastes'
]);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchCard(name) {
  return new Promise((resolve, reject) => {
    const url = `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`;
    https.get(url, { headers: { 'User-Agent': 'MTGOpponentTracker/1.0', 'Accept': 'application/json' } }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (data.object === 'error') return resolve(null);

          // Handle double-faced cards
          let oracle = data.oracle_text || '';
          let power = data.power || null;
          let toughness = data.toughness || null;
          let mana_cost = data.mana_cost || '';
          let type_line = data.type_line || '';

          if (!oracle && data.card_faces) {
            oracle = data.card_faces.map(f => `[${f.name}] ${f.oracle_text || ''}`).join(' // ');
            if (!mana_cost) mana_cost = data.card_faces.map(f => f.mana_cost || '').join(' // ');
            if (!power && data.card_faces[0]) {
              power = data.card_faces[0].power || null;
              toughness = data.card_faces[0].toughness || null;
            }
          }

          resolve({
            name: data.name,
            mana_cost,
            cmc: data.cmc || 0,
            type: type_line,
            oracle,
            power,
            toughness,
            keywords: data.keywords || []
          });
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', reject);
  });
}

// Parse a specific deck name from --deck flag, or null for all decks
function parseDeckFilter() {
  const idx = process.argv.indexOf('--deck');
  return idx !== -1 && process.argv[idx + 1] ? process.argv[idx + 1] : null;
}

// Look up a card in the cache, handling DFC names (e.g. "Ojer Axonil" matches "Ojer Axonil // Temple of Power")
function cacheHas(cache, name) {
  if (cache[name]) return true;
  return Object.keys(cache).some(k => k.startsWith(name + ' //'));
}

function collectCardNames(decks, deckFilter) {
  const unique = new Set();
  for (const deck of decks) {
    if (!deck.list) continue;
    if (deckFilter && deck.name !== deckFilter) continue;
    for (const line of deck.list.split('\n')) {
      const match = line.trim().match(/^\d+\s+(.+)$/);
      if (match) {
        const name = match[1].replace(/\s*\*CMDR\*\s*/i, '').trim();
        if (!BASIC_LANDS.has(name)) unique.add(name);
      }
    }
  }
  return [...unique];
}

async function main() {
  const checkOnly = process.argv.includes('--check');
  const deckFilter = parseDeckFilter();
  const data = JSON.parse(fs.readFileSync(DECKS_PATH, 'utf8'));
  const decks = Object.values(data);

  const names = collectCardNames(decks, deckFilter);
  const scope = deckFilter ? `deck "${deckFilter}"` : 'all decks';

  // Load existing cache
  let cache = {};
  if (fs.existsSync(OUTPUT_PATH)) {
    cache = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8'));
  }

  const missing = names.filter(n => !cacheHas(cache, n));

  // --check mode: just report missing cards and exit
  if (checkOnly) {
    if (missing.length === 0) {
      console.log(`All ${names.length} cards from ${scope} are cached.`);
    } else {
      console.log(`${missing.length} cards from ${scope} missing from cache:`);
      missing.forEach(n => console.log(`  - ${n}`));
      console.log(`\nRun without --check to fetch them: node scripts/build-card-cache.js${deckFilter ? ` --deck "${deckFilter}"` : ''}`);
    }
    process.exit(missing.length > 0 ? 1 : 0);
  }

  console.log(`Fetching ${names.length} unique cards from Scryfall (${scope})...`);
  const cached = names.length - missing.length;
  console.log(`${cached} already cached, fetching ${missing.length} new cards.`);

  let fetched = 0, failed = 0;
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    if (cacheHas(cache, name)) continue; // already have it (handles DFC front-face matches)

    await sleep(RATE_LIMIT_MS);
    const card = await fetchCard(name);
    if (card) {
      cache[card.name] = card; // use Scryfall's canonical name as key
      fetched++;
    } else {
      console.warn(`  NOT FOUND: ${name}`);
      failed++;
    }

    if ((i + 1) % 50 === 0) {
      process.stdout.write(`  ${i + 1}/${names.length} processed...\n`);
      // Save progress periodically
      fs.writeFileSync(OUTPUT_PATH, JSON.stringify(cache, null, 2));
    }
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(cache, null, 2));
  console.log(`\nDone! ${fetched} fetched, ${failed} not found, ${Object.keys(cache).length} total in cache.`);
  console.log(`Saved to ${OUTPUT_PATH}`);
}

main().catch(console.error);
