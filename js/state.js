// ─── STATE ───────────────────────────────────────────────────────────────────
const state = {
  players: [
    { life: 40, poison: 0, radiation: 0, experience: 0, speed: 0, hand: [], battlefield: [], graveyard: [], exile: [], library: [], commandZone: [], uidCounter: 0 },
    { life: 40, poison: 0, radiation: 0, experience: 0, speed: 0, hand: [], battlefield: [], graveyard: [], exile: [], library: [], commandZone: [], uidCounter: 0 }
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

// ─── GAME STATE PERSISTENCE ─────────────────────────────────────────────────
const GAME_STATE_KEY = 'mtg-game-state';

function saveGameState() {
  try {
    const snap = {
      players: state.players.map(p => ({
        life: p.life, poison: p.poison, radiation: p.radiation,
        experience: p.experience, speed: p.speed, uidCounter: p.uidCounter,
        hand: p.hand, battlefield: p.battlefield, graveyard: p.graveyard,
        exile: p.exile, library: p.library, commandZone: p.commandZone
      })),
      cmdDmg: state.cmdDmg,
      turn: state.turn,
      phaseIdx: state.phaseIdx,
      goingFirst: state.goingFirst,
      actionLog: state.actionLog
    };
    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(snap));
  } catch (e) {
    // localStorage full or unavailable — silent fail
  }
}

function loadGameState() {
  try {
    const raw = localStorage.getItem(GAME_STATE_KEY);
    if (!raw) return false;
    const snap = JSON.parse(raw);
    if (!snap.players || snap.players.length !== 2) return false;

    for (let i = 0; i < 2; i++) {
      const src = snap.players[i];
      const dst = state.players[i];
      dst.life = src.life; dst.poison = src.poison || 0;
      dst.radiation = src.radiation || 0; dst.experience = src.experience || 0;
      dst.speed = src.speed || 0; dst.uidCounter = src.uidCounter || 0;
      dst.hand = src.hand || []; dst.battlefield = src.battlefield || [];
      dst.graveyard = src.graveyard || []; dst.exile = src.exile || [];
      dst.library = src.library || []; dst.commandZone = src.commandZone || [];
    }
    state.cmdDmg = snap.cmdDmg || { 'me-to-opp': 0, 'opp-to-me': 0 };
    state.turn = snap.turn || 1;
    state.phaseIdx = snap.phaseIdx || 0;
    state.goingFirst = snap.goingFirst || 'me';
    state.actionLog = snap.actionLog || [];

    // Rebuild cardCache from loaded card data
    const allCards = state.players.flatMap(p =>
      [p.hand, p.battlefield, p.graveyard, p.exile, p.library, p.commandZone].flat()
    );
    for (const c of allCards) {
      if (c.data && c.name) {
        cardCache[c.name] = c.data;
        cardCache[c.name.toLowerCase()] = c.data;
      }
    }
    return true;
  } catch (e) {
    return false;
  }
}

function clearGameState() {
  localStorage.removeItem(GAME_STATE_KEY);
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
