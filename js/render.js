const CARD_BACK = 'assets/Magic_card_back.webp';

// ─── RENDER ───────────────────────────────────────────────────────────────────
function render() {
  renderLifeTotals();
  renderBattlefield('me');
  renderBattlefield('opp');
  renderHand();
  renderOppHand();
  renderZoneCounts();
  renderPhase();
  renderDecks();
}

function renderLifeTotals() {
  for (const p of ['me','opp']) {
    const el = document.getElementById(`${p}-life`);
    if (el) {
      el.textContent = state[p].life;
      el.className = 'life-total' + (state[p].life <= 5 ? ' low' : '');
    }
  }
  for (const k of ['me-to-opp','opp-to-me']) {
    const el = document.getElementById(`cd-${k}`);
    if (el) {
      const val = state.cmdDmg[k];
      el.textContent = val;
      el.className = 'cdval' + (val >= 21 ? ' danger' : '');
    }
  }
}

// ─── CARD SLOT BUILDER ────────────────────────────────────────────────────────
function buildCardSlot(card, player) {
  const slot = document.createElement('div');
  slot.className = 'card-slot';
  slot.dataset.id = card.id;
  slot.dataset.player = player;

  const fallback = document.createElement('div');
  fallback.className = 'card-name-fallback';
  fallback.textContent = card.name;
  slot.appendChild(fallback);

  if (card.imageUri) {
    const img = document.createElement('img');
    img.src = card.imageUri;
    img.alt = card.name;
    img.onload = () => { fallback.style.display = 'none'; };
    img.onerror = () => { img.remove(); };
    slot.appendChild(img);
    if (img.complete && img.naturalWidth > 0) fallback.style.display = 'none';
  }

  // Migrate old numeric counters format to object
  if (typeof card.counters === 'number') {
    card.counters = card.counters > 0 ? { '+1/+1': card.counters } : {};
  }
  const activeCounters = Object.entries(card.counters || {}).filter(([, v]) => v > 0);
  if (activeCounters.length > 0) {
    const KEYWORD_COUNTERS = new Set(['Flying','First Strike','Double Strike','Deathtouch','Trample','Vigilance','Lifelink','Reach','Hexproof','Menace','Haste','Indestructible','Flash','Ward']);
    const container = document.createElement('div');
    container.className = 'counters-container';
    for (const [type, count] of activeCounters) {
      const badge = document.createElement('div');
      let cls = 'counters-badge';
      if (type === '+1/+1' || type === '+2/+2') cls += ' badge-pt-plus';
      else if (type === '-1/-1') cls += ' badge-pt-minus';
      else if (KEYWORD_COUNTERS.has(type)) cls += ' badge-keyword';
      badge.className = cls;
      if (type === '+1/+1') badge.textContent = `+${count}/+${count}`;
      else if (type === '-1/-1') badge.textContent = `-${count}/-${count}`;
      else badge.textContent = count > 1 ? `${count}× ${type}` : type;
      container.appendChild(badge);
    }
    slot.appendChild(container);
  }

  slot.addEventListener('contextmenu', e => { e.preventDefault(); showCtxMenu(e, card, player); });
  slot.addEventListener('mousemove', e => { if (!dragState.active) showPreview(e, card); });
  slot.addEventListener('mouseleave', hidePreview);

  return slot;
}

function renderBattlefield(player) {
  const playerId = player === 'me' ? 'my' : player;
  const field = document.getElementById(`${playerId}-field`);
  if (!field) return;
  const cards = state[player].battlefield;
  const emptyMsg = field.querySelector('.battlefield-empty');

  // Remove old card slots and stacks
  field.querySelectorAll('.card-slot, .card-stack').forEach(el => el.remove());

  if (cards.length === 0) {
    if (emptyMsg) emptyMsg.style.display = '';
    return;
  }
  if (emptyMsg) emptyMsg.style.display = 'none';

  // Build attachment index
  const attachedIds = new Set(cards.filter(c => c.attachedTo).map(c => c.id));
  const attachmentMap = Object.create(null); // hostId -> [card, ...]
  for (const card of cards) {
    if (card.attachedTo) {
      if (!attachmentMap[card.attachedTo]) attachmentMap[card.attachedTo] = [];
      attachmentMap[card.attachedTo].push(card);
    }
  }

  const PEEK = 26; // px of each attachment visible below the host card

  cards.forEach(card => {
    if (attachedIds.has(card.id)) return; // rendered inside host's stack

    const attachments = attachmentMap[card.id] || [];

    if (attachments.length === 0) {
      // Standalone card — original behavior
      const slot = buildCardSlot(card, player);
      if (card.tapped) slot.classList.add('tapped');
      slot.style.left = (card.x ?? 10) + 'px';
      slot.style.top  = (card.y ?? 10) + 'px';
      slot.addEventListener('mousedown', e => {
        if (e.button !== 0) return;
        dragState.pendingDrag = { card, player, zone: 'battlefield', el: slot, startX: e.clientX, startY: e.clientY };
      });
      field.appendChild(slot);
    } else {
      // Card stack: host on top, attachments peeking below
      const stack = document.createElement('div');
      stack.className = 'card-stack' + (card.tapped ? ' tapped' : '');
      stack.style.height = (88 + attachments.length * PEEK) + 'px';
      stack.style.left = (card.x ?? 10) + 'px';
      stack.style.top  = (card.y ?? 10) + 'px';

      // Attachments (lower z-index, peek from below host)
      attachments.forEach((att, i) => {
        const attSlot = buildCardSlot(att, player);
        attSlot.classList.add('attached-slot');
        attSlot.style.top = ((i + 1) * PEEK) + 'px';
        attSlot.style.zIndex = String(attachments.length - i);
        // Clicking attachment area taps the host card
        attSlot.addEventListener('mousedown', e => {
          if (e.button !== 0) return;
          dragState.pendingDrag = { card, player, zone: 'battlefield', el: attSlot, startX: e.clientX, startY: e.clientY };
        });
        stack.appendChild(attSlot);
      });

      // Host card on top
      const hostSlot = buildCardSlot(card, player);
      hostSlot.style.top = '0';
      hostSlot.style.zIndex = String(attachments.length + 1);
      hostSlot.addEventListener('mousedown', e => {
        if (e.button !== 0) return;
        dragState.pendingDrag = { card, player, zone: 'battlefield', el: hostSlot, startX: e.clientX, startY: e.clientY };
      });
      stack.appendChild(hostSlot);

      field.appendChild(stack);
    }
  });
}

// ─── RENDER HAND (visible strip) ─────────────────────────────────────────────
function renderHand() {
  const zone = document.getElementById('my-hand-zone');
  const emptyMsg = document.getElementById('hand-empty-msg');

  // Remove old hand cards
  zone.querySelectorAll('.hand-card').forEach(el => el.remove());

  const hand = state.me.hand;
  if (hand.length === 0) {
    if (emptyMsg) emptyMsg.style.display = '';
    return;
  }
  if (emptyMsg) emptyMsg.style.display = 'none';

  hand.forEach(card => {
    const el = document.createElement('div');
    el.className = 'hand-card';
    el.dataset.cardId = card.id;

    const fallback = document.createElement('div');
    fallback.className = 'card-name-fallback';
    fallback.textContent = card.name;
    el.appendChild(fallback);

    if (card.imageUri) {
      const img = document.createElement('img');
      img.src = card.imageUri;
      img.alt = card.name;
      img.draggable = false;
      img.onload = () => { fallback.style.display = 'none'; };
      img.onerror = () => img.remove();
      el.appendChild(img);
      // Fix: if image is already cached, onload won't fire — hide fallback immediately
      if (img.complete && img.naturalWidth > 0) fallback.style.display = 'none';
    }

    // Drag start
    el.addEventListener('mousedown', e => {
      if (e.button !== 0) return; // left click only
      e.preventDefault();
      startDrag(e, card, 'me', 'hand', el);
    });

    // Right-click context menu for hand cards
    el.addEventListener('contextmenu', e => {
      e.preventDefault();
      showHandCtxMenu(e, card);
    });

    // Preview on hover
    el.addEventListener('mousemove', e => { if (!dragState.active) showPreview(e, card); });
    el.addEventListener('mouseleave', hidePreview);

    zone.appendChild(el);
  });
}

function renderOppHand() {
  const zone = document.getElementById('opp-hand-zone');
  const emptyMsg = document.getElementById('opp-hand-empty-msg');
  zone.querySelectorAll('.opp-hand-card').forEach(el => el.remove());

  const hand = state.opp.hand;
  if (hand.length === 0) {
    if (emptyMsg) emptyMsg.style.display = '';
    return;
  }
  if (emptyMsg) emptyMsg.style.display = 'none';

  hand.forEach((card, idx) => {
    const el = document.createElement('div');
    el.className = 'opp-hand-card';
    el.dataset.cardId = card.id;

    const img = document.createElement('img');
    img.src = CARD_BACK;
    img.alt = 'Hidden card';
    img.draggable = false;
    el.appendChild(img);

    // Stable card UID badge — follows the card through all zones
    const badge = document.createElement('div');
    badge.className = 'counters-badge opp-hand-badge';
    badge.textContent = card.uid ?? idx + 1;
    el.appendChild(badge);

    el.addEventListener('contextmenu', e => {
      e.preventDefault();
      showOppHandCtxMenu(e, card);
    });

    el.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      e.preventDefault();
      startDrag(e, card, 'opp', 'hand', el);
    });

    zone.appendChild(el);
  });
}

function renderZoneCounts() {
  for (const p of ['me','opp']) {
    const setT = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setT(`${p}-gy-count`, state[p].graveyard.length);
    setT(`${p}-exile-count`, state[p].exile.length);
    setT(`${p}-lib-count`, state[p].library.length);
    setT(`${p}-cmd-name`, state[p].commandZone ? state[p].commandZone.name : '—');
  }
  // Opp hand count stays in header
  const oppHandEl = document.getElementById('opp-hand-count');
  if (oppHandEl) oppHandEl.textContent = state.opp.hand.length;
}

function renderPhase() {
  document.getElementById('phase-label').textContent = PHASES[state.phaseIdx];
  document.getElementById('turn-num').textContent = state.turn;
  const gfEl = document.getElementById('going-first-label');
  if (gfEl) gfEl.textContent = state.goingFirst === 'me' ? 'YOU' : 'CLAUDE';
}

function renderDecks() {
  const list = document.getElementById('deck-list');
  list.innerHTML = '';
  state.decks.forEach((deck, i) => {
    const item = document.createElement('div');
    item.className = 'deck-item' + (state.selectedDeck === i ? ' active' : '');
    item.innerHTML = `
      <span class="deck-item-name" title="${deck.name}">${deck.name}</span>
      <button class="deck-item-del" onclick="deleteDeck(${i})" title="Delete">✕</button>
    `;
    item.addEventListener('click', e => {
      if (!e.target.classList.contains('deck-item-del')) {
        state.selectedDeck = i;
        renderDecks();
      }
    });
    list.appendChild(item);
  });
}
