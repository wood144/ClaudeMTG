// ─── CARD DATA ────────────────────────────────────────────────────────────────
const cardCache = {};

async function fetchCard(name) {
  if (cardCache[name]) return cardCache[name];
  if (cardCache[name.toLowerCase()]) return cardCache[name.toLowerCase()];
  try {
    const r = await fetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`);
    if (!r.ok) return null;
    const d = await r.json();
    cardCache[name] = d;
    cardCache[name.toLowerCase()] = d;
    return d;
  } catch { return null; }
}

function getImageUri(cardData) {
  if (!cardData) return null;
  if (cardData.image_uris) return cardData.image_uris.normal;
  if (cardData.card_faces && cardData.card_faces[0].image_uris)
    return cardData.card_faces[0].image_uris.normal;
  return null;
}
