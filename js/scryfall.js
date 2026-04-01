// ─── CARD DATA ────────────────────────────────────────────────────────────────
const cardCache = {};
let localCardData = null;  // loaded from assets/card_data.json

async function loadLocalCardData() {
  if (localCardData) return;
  try {
    const r = await fetch('assets/card_data.json');
    if (r.ok) localCardData = await r.json();
  } catch {
    localCardData = {};
  }
}

function localToScryfall(entry) {
  // Convert our card_data.json format into the shape the tracker expects
  // (matching Scryfall API response structure)
  if (!entry) return null;
  const obj = {
    name: entry.name,
    mana_cost: entry.mana_cost,
    cmc: entry.cmc,
    type_line: entry.type,
    oracle_text: entry.oracle,
    power: entry.power,
    toughness: entry.toughness,
    keywords: entry.keywords || [],
    layout: entry.layout || 'normal',
  };
  if (entry.image_uris) {
    obj.image_uris = entry.image_uris;
  }
  if (entry.card_faces) {
    obj.card_faces = entry.card_faces;
    // Mark as DFC layout if faces exist
    if (!obj.layout || obj.layout === 'normal') {
      obj.layout = 'transform';
    }
  }
  return obj;
}

async function fetchCard(name, _retries = 2) {
  if (cardCache[name]) return cardCache[name];
  if (cardCache[name.toLowerCase()]) return cardCache[name.toLowerCase()];

  // Try local cache first
  await loadLocalCardData();
  if (localCardData) {
    const local = localCardData[name] || localCardData[name.toLowerCase()];
    if (local && local.image_uris) {
      const converted = localToScryfall(local);
      cardCache[name] = converted;
      cardCache[name.toLowerCase()] = converted;
      return converted;
    }
  }

  // Fall back to Scryfall API
  try {
    const r = await fetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`, {
      headers: { 'Accept': 'application/json' }
    });
    if (r.status === 429 && _retries > 0) {
      await new Promise(ok => setTimeout(ok, 500));
      return fetchCard(name, _retries - 1);
    }
    if (!r.ok) return null;
    const d = await r.json();
    cardCache[name] = d;
    cardCache[name.toLowerCase()] = d;
    return d;
  } catch {
    if (_retries > 0) {
      await new Promise(ok => setTimeout(ok, 500));
      return fetchCard(name, _retries - 1);
    }
    return null;
  }
}

async function searchTokens(name) {
  try {
    const q = encodeURIComponent(`name:${name} type:token`);
    const r = await fetch(`https://api.scryfall.com/cards/search?q=${q}&unique=art&order=released&dir=desc`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!r.ok) return [];
    const d = await r.json();
    return d.data || [];
  } catch { return []; }
}

function getImageUri(cardData) {
  if (!cardData) return null;
  if (cardData.image_uris) return cardData.image_uris.normal;
  if (cardData.card_faces && cardData.card_faces[0].image_uris)
    return cardData.card_faces[0].image_uris.normal;
  return null;
}
