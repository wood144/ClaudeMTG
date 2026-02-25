// ─── STATE ───────────────────────────────────────────────────────────────────
const state = {
  players: [
    { life: 40, hand: [], battlefield: [], graveyard: [], exile: [], library: [], commandZone: null, uidCounter: 0 },
    { life: 40, hand: [], battlefield: [], graveyard: [], exile: [], library: [], commandZone: null, uidCounter: 0 }
  ],
  cmdDmg: { 'me-to-opp': 0, 'opp-to-me': 0 },
  turn: 1,
  phaseIdx: 0,
  goingFirst: 'me',
  decks: JSON.parse(localStorage.getItem('mtg-decks') || '[]'),
  selectedDeck: null,
  activeCtxCard: null,
  actionLog: []
};

function logAction(msg) {
  const now = new Date();
  const time = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
  state.actionLog.push(`[${time}] ${msg}`);
}

// Backward-compat: state['me'] and state['opp'] still work everywhere
Object.defineProperty(state, 'me',  { get: () => state.players[0], enumerable: true });
Object.defineProperty(state, 'opp', { get: () => state.players[1], enumerable: true });

function getPlayer(id) {
  if (id === 0 || id === 'me')  return state.players[0];
  if (id === 1 || id === 'opp') return state.players[1];
}

const PHASES = ['UNTAP','UPKEEP','DRAW','MAIN 1','COMBAT','MAIN 2','END'];

// ─── DECK PERSISTENCE ────────────────────────────────────────────────────────
function saveDecks() {
  localStorage.setItem('mtg-decks', JSON.stringify(state.decks.map(d => ({ name: d.name, list: d.list }))));
}

// ─── CARD OBJECT ─────────────────────────────────────────────────────────────
function makeCard(name, cardData) {
  const uri = getImageUri(cardData);
  const isDFC = !!(cardData?.card_faces?.length >= 2 &&
                   (cardData.layout === 'transform' || cardData.layout === 'modal_dfc'));
  const dfcType   = isDFC ? cardData.layout : null;
  const cardFaces = isDFC ? cardData.card_faces.map(f => ({
    name: f.name,
    imageUri: f.image_uris?.normal || null
  })) : null;
  return {
    id: Math.random().toString(36).slice(2),
    uid: null,
    name: cardData?.name || name,
    data: cardData,
    tapped: false,
    counters: {},
    attachedTo: null,
    x: null,
    y: null,
    imageUri: uri || null,
    isDFC,
    dfcType,
    cardFaces,
    currentFace: 0
  };
}
