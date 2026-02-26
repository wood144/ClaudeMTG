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

async function main() {
  const data = JSON.parse(fs.readFileSync(DECKS_PATH, 'utf8'));
  const decks = Object.values(data);

  // Collect unique card names
  const unique = new Set();
  for (const deck of decks) {
    if (!deck.list) continue;
    for (const line of deck.list.split('\n')) {
      const match = line.trim().match(/^\d+\s+(.+)$/);
      if (match) {
        const name = match[1].replace(/\s*\*CMDR\*\s*/i, '').trim();
        if (!BASIC_LANDS.has(name)) unique.add(name);
      }
    }
  }

  const names = [...unique];
  console.log(`Fetching ${names.length} unique cards from Scryfall...`);

  // Load existing cache to allow resuming interrupted runs
  let cache = {};
  if (fs.existsSync(OUTPUT_PATH)) {
    cache = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8'));
    const cached = names.filter(n => cache[n]).length;
    console.log(`${cached} already cached, fetching ${names.length - cached} new cards.`);
  }

  let fetched = 0, failed = 0;
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    if (cache[name]) continue; // already have it

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
