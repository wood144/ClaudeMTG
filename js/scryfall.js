// ─── CARD DATA ────────────────────────────────────────────────────────────────
const cardCache = {};

async function fetchCard(name, _retries = 2) {
  if (cardCache[name]) return cardCache[name];
  if (cardCache[name.toLowerCase()]) return cardCache[name.toLowerCase()];
  try {
    const r = await fetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`);
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
    const r = await fetch(`https://api.scryfall.com/cards/search?q=${q}&unique=art&order=released&dir=desc`);
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
