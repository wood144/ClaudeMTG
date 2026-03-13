// ─── TOAST NOTIFICATIONS ─────────────────────────────────────────────────────
function showToast(msg, type = 'error') {
  const old = document.querySelector('.toast'); if (old) old.remove();
  const el = document.createElement('div');
  el.className = 'toast' + (type === 'success' ? ' success' : '');
  el.textContent = msg; document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ─── DRAG & DROP STATE ──────────────────────────────────────────────────────
let dragState = {
  active: false,
  card: null,
  sourcePlayer: null,
  sourceZone: null,
  ghostEl: null,
  startX: 0,
  startY: 0,
  pendingDrag: null
};

// ─── DRAG & DROP ─────────────────────────────────────────────────────────────
function startDrag(e, card, player, zone, sourceEl) {
  dragState.active = true;
  dragState.card = card;
  dragState.sourcePlayer = player;
  dragState.sourceZone = zone;
  dragState.hoveringField = false;
  dragState.sourceEl = sourceEl;

  sourceEl.classList.add('dragging');

  // Create ghost
  const ghost = document.createElement('div');
  ghost.className = 'drag-ghost';
  if (card.imageUri) {
    const img = document.createElement('img');
    img.src = card.imageUri;
    img.draggable = false;
    ghost.appendChild(img);
  } else {
    const fb = document.createElement('div');
    fb.className = 'card-name-fallback';
    fb.textContent = card.name;
    ghost.appendChild(fb);
  }
  ghost.style.left = (e.clientX - 31) + 'px';
  ghost.style.top = (e.clientY - 44) + 'px';
  document.body.appendChild(ghost);
  dragState.ghostEl = ghost;

  hidePreview();
}

// Use mouseenter/mouseleave on both battlefields for reliable hover detection
(function setupDropTarget() {
  for (const id of ['my-field', 'opp-field']) {
    const field = document.getElementById(id);
    field.addEventListener('mouseenter', () => { if (dragState.active) field.classList.add('drag-over'); });
    field.addEventListener('mouseleave', () => { if (dragState.active) field.classList.remove('drag-over'); });
  }
})();

document.addEventListener('mousemove', e => {
  if (dragState.pendingDrag && !dragState.active) {
    const p = dragState.pendingDrag;
    if (Math.abs(e.clientX - p.startX) > 5 || Math.abs(e.clientY - p.startY) > 5) {
      startDrag(e, p.card, p.player, p.zone, p.el);
      dragState.pendingDrag = null;
    }
  }
  if (!dragState.active) return;
  if (dragState.ghostEl) {
    dragState.ghostEl.style.left = (e.clientX - 31) + 'px';
    dragState.ghostEl.style.top = (e.clientY - 44) + 'px';
  }
});

document.addEventListener('mouseup', e => {
  const pending = dragState.pendingDrag;
  dragState.pendingDrag = null;

  if (!dragState.active) {
    // Clean click (no drag started) — tap battlefield cards here instead of relying on 'click' event
    if (pending && pending.zone === 'battlefield' && e.button === 0 && !e.ctrlKey) {
      tapCard(pending.card, pending.player);
    }
    return;
  }

  const myField = document.getElementById('my-field');
  const oppField = document.getElementById('opp-field');

  const over = f => { const r = f.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; };
  const targetPlayer = over(myField) ? 'me' : over(oppField) ? 'opp' : null;

  let mdfc_drag_card = null;
  let mdfc_drag_player = null;

  if (targetPlayer) {
    const { card, sourcePlayer, sourceZone } = dragState;
    const targetField = targetPlayer === 'me' ? myField : oppField;
    const fr = targetField.getBoundingClientRect();
    const dropX = Math.max(0, e.clientX - fr.left - 31); // center card under cursor
    const dropY = Math.max(0, e.clientY - fr.top  - 44);

    if (sourceZone === 'battlefield' && targetPlayer === sourcePlayer) {
      // Reposition card within the same field — no zone change
      card.x = dropX;
      card.y = dropY;
    } else {
      const idx = state[sourcePlayer][sourceZone].findIndex(c => c.id === card.id);
      if (idx !== -1) {
        state[sourcePlayer][sourceZone].splice(idx, 1);
        card.tapped = false;
        card.x = dropX;
        card.y = dropY;
        state[targetPlayer].battlefield.push(card);
        showToast(`Played ${card.name}`, 'success');
        if (card.isDFC && card.dfcType === 'modal_dfc') {
          mdfc_drag_card   = card;
          mdfc_drag_player = targetPlayer;
        }
      }
    }
  }

  // Cleanup
  if (dragState.ghostEl) dragState.ghostEl.remove();
  if (dragState.sourceEl) dragState.sourceEl.classList.remove('dragging');
  myField.classList.remove('drag-over');
  oppField.classList.remove('drag-over');

  dragState = { active: false, card: null, sourcePlayer: null, sourceZone: null, ghostEl: null, sourceEl: null, hoveringField: false, pendingDrag: null };
  setTimeout(() => {
    console.log('pre-render battlefield:', state.me.battlefield.length);
    render();
    if (mdfc_drag_card) {
      showDFCFacePicker(mdfc_drag_card, () => renderBattlefield(mdfc_drag_player));
    }
  }, 50);
});

// ─── CONTEXT MENU ─────────────────────────────────────────────────────────────
function positionCtxMenu(e) {
  const menu = document.getElementById('ctx-menu');
  const menuH = menu.offsetHeight;
  const menuW = menu.offsetWidth || 160;
  const left = Math.min(e.clientX, window.innerWidth - menuW - 4);
  const spaceBelow = window.innerHeight - e.clientY - 4;
  const top = menuH <= spaceBelow ? e.clientY : Math.max(4, e.clientY - menuH);
  menu.style.left = left + 'px';
  menu.style.top = top + 'px';
}

function showCtxMenu(e, card, player) {
  state.activeCtxCard = { card, player };
  state.activeCtxEvent = { clientX: e.clientX, clientY: e.clientY };
  const menu = document.getElementById('ctx-menu');
  const isField = state[player].battlefield.includes(card);
  const isCommander = !!card.isCommander;

  menu.innerHTML = `
    <div class="ctx-item" style="font-family:'Cinzel',serif;font-size:10px;color:var(--muted);padding:4px 10px;">${card.name}</div>
    <div class="ctx-sep"></div>
    ${isField ? `<div class="ctx-item" onclick="tapFromCtx()">Tap / Untap</div>` : ''}
    ${isField ? `<div class="ctx-item" onclick="showAddCounterMenu(event)">+ Add Counter ▶</div>` : ''}
    ${isField && card.counters && typeof card.counters === 'object' && Object.keys(card.counters).length > 0 ? `<div class="ctx-item" onclick="showRemoveCounterMenu(event)">− Remove Counter ▶</div>` : ''}
    ${isField && !card.attachedTo ? `<div class="ctx-item" onclick="attachFromCtx()">⚙ Attach to...</div>` : ''}
    ${isField && card.attachedTo ? `<div class="ctx-item" onclick="detachFromCtx()">⚙ Detach</div>` : ''}
    ${card.isDFC && card.dfcType === 'transform' ? `<div class="ctx-item" onclick="transformFromCtx()">⟳ Transform</div>` : ''}
    ${isField ? `<div class="ctx-item" onclick="moveCtx('${player}','battlefield','${player}','graveyard')">→ Graveyard</div>` : ''}
    ${isField ? `<div class="ctx-item" onclick="moveCtx('${player}','battlefield','${player}','exile')">→ Exile</div>` : ''}
    ${isField ? `<div class="ctx-item" onclick="moveCtx('${player}','battlefield','${player}','hand')">→ Hand</div>` : ''}
    ${isField ? `<div class="ctx-item" onclick="moveCtx('${player}','battlefield','${player}','libTop')">→ Top of Library</div>` : ''}
    ${isField ? `<div class="ctx-item" onclick="moveCtx('${player}','battlefield','${player}','libCount')">→ Bottom of Library</div>` : ''}
    ${isCommander ? `<div class="ctx-item" onclick="sendToCommandZone()">→ Command Zone</div>` : ''}
    <div class="ctx-sep"></div>
    <div class="ctx-item danger" onclick="removeCtx()">Remove from Game</div>
  `;

  menu.style.display = 'block';
  positionCtxMenu(e);

  setTimeout(() => {
    document.addEventListener('click', closeCtxMenu, { once: true });
  }, 10);
}

// Context menu for hand cards (both players)
function showHandCtxMenu(e, card, player) {
  state.activeCtxCard = { card, player };
  const menu = document.getElementById('ctx-menu');
  const isCommander = !!card.isCommander;
  const label = player === 'me' ? card.name : `#${card.uid}`;

  menu.innerHTML = `
    <div class="ctx-item" style="font-family:'Cinzel',serif;font-size:10px;color:var(--muted);padding:4px 10px;">${label}</div>
    <div class="ctx-sep"></div>
    <div class="ctx-item" onclick="playHandCardToBattlefield('${player}')">→ Play to Battlefield</div>
    <div class="ctx-item" onclick="moveHandCard('${player}','graveyard')">→ Graveyard</div>
    <div class="ctx-item" onclick="moveHandCard('${player}','exile')">→ Exile</div>
    <div class="ctx-item" onclick="moveHandCard('${player}','libTop')">→ Top of Library</div>
    <div class="ctx-item" onclick="moveHandCard('${player}','libCount')">→ Bottom of Library</div>
    ${isCommander ? `<div class="ctx-item" onclick="sendToCommandZone()">→ Command Zone</div>` : ''}
    <div class="ctx-sep"></div>
    <div class="ctx-item danger" onclick="removeHandCard('${player}')">Remove from Game</div>
  `;

  menu.style.display = 'block';
  positionCtxMenu(e);

  setTimeout(() => {
    document.addEventListener('click', closeCtxMenu, { once: true });
  }, 10);
}

function playHandCardToBattlefield(player) {
  const { card } = state.activeCtxCard;
  closeCtxMenu();
  if (card.isDFC && card.dfcType === 'modal_dfc') {
    showDFCFacePicker(card, () => {
      const idx = state[player].hand.findIndex(c => c.id === card.id);
      if (idx !== -1) {
        const c = state[player].hand.splice(idx, 1)[0];
        c.tapped = false;
        const pos = nextBattlefieldPos(player);
        c.x = pos.x; c.y = pos.y;
        state[player].battlefield.push(c);
      }
      render();
    });
    return;
  }
  const idx = state[player].hand.findIndex(c => c.id === card.id);
  if (idx !== -1) {
    const c = state[player].hand.splice(idx, 1)[0];
    c.tapped = false;
    const pos = nextBattlefieldPos(player);
    c.x = pos.x; c.y = pos.y;
    state[player].battlefield.push(c);
  }
  render();
}

function moveHandCard(player, toZone) {
  const { card } = state.activeCtxCard;
  const idx = state[player].hand.findIndex(c => c.id === card.id);
  if (idx !== -1) {
    state[player].hand.splice(idx, 1);
    if (toZone === 'libCount') {
      card.tapped = false;
      state[player].library.push(card); // bottom of library
    } else if (toZone === 'libTop') {
      card.tapped = false;
      state[player].library.unshift(card); // top of library
    } else {
      card.tapped = false;
      state[player][toZone].push(card);
    }
  }
  render();
  closeCtxMenu();
}

function removeHandCard(player) {
  const { card } = state.activeCtxCard;
  const idx = state[player].hand.findIndex(c => c.id === card.id);
  if (idx !== -1) state[player].hand.splice(idx, 1);
  render();
  closeCtxMenu();
}

function closeCtxMenu() {
  document.getElementById('ctx-menu').style.display = 'none';
}

function tapFromCtx() {
  const { card, player } = state.activeCtxCard;
  tapCard(card, player);
  closeCtxMenu();
}

// ─── COUNTER TYPES ─────────────────────────────────────────────────────────────
const COUNTER_TYPES = {
  'P/T': ['+1/+1', '-1/-1'],
  'Keyword': ['Flying', 'First Strike', 'Double Strike', 'Deathtouch', 'Trample', 'Vigilance', 'Lifelink', 'Reach', 'Hexproof', 'Menace', 'Haste', 'Indestructible', 'Flash', 'Ward'],
  'Special': ['Charge', 'Chorus', 'Component', 'Energy', 'Experience', 'Finality', 'Flood', 'Fungus', 'Gold', 'Hour', 'Knowledge', 'Lore', 'Loyalty', 'Luck', 'Poison', 'Rad', 'Ribbon', 'Shield', 'Spore', 'Storage', 'Stun', 'Time'],
  'Status': ['Blight', 'Burden']
};

function showAddCounterMenu(e) {
  e.stopPropagation();
  const menu = document.getElementById('ctx-menu');
  let html = `<div class="ctx-item" onclick="reopenMainCtxMenu(event)" style="color:var(--muted)">← Back</div><div class="ctx-sep"></div>`;
  for (const [cat, types] of Object.entries(COUNTER_TYPES)) {
    html += `<div class="ctx-label">${cat}</div>`;
    for (const t of types) {
      html += `<div class="ctx-item" onclick="addCounter('${t}')">${t}</div>`;
    }
    html += '<div class="ctx-sep"></div>';
  }
  menu.innerHTML = html;
  positionCtxMenu(state.activeCtxEvent);
  setTimeout(() => document.addEventListener('click', closeCtxMenu, { once: true }), 10);
}

function showRemoveCounterMenu(e) {
  e.stopPropagation();
  const { card } = state.activeCtxCard;
  const menu = document.getElementById('ctx-menu');
  const active = Object.entries(card.counters || {}).filter(([, v]) => v > 0);
  let html = `<div class="ctx-item" onclick="reopenMainCtxMenu(event)" style="color:var(--muted)">← Back</div><div class="ctx-sep"></div>`;
  if (active.length === 0) {
    html += `<div class="ctx-item" style="color:var(--muted);pointer-events:none">No counters on this card</div>`;
  } else {
    for (const [t, count] of active) {
      html += `<div class="ctx-item" onclick="removeCounter('${t}')">Remove ${t} (${count})</div>`;
    }
    html += `<div class="ctx-sep"></div><div class="ctx-item danger" onclick="removeAllCounters()">Remove All Counters</div>`;
  }
  menu.innerHTML = html;
  positionCtxMenu(state.activeCtxEvent);
  setTimeout(() => document.addEventListener('click', closeCtxMenu, { once: true }), 10);
}

function reopenMainCtxMenu(e) {
  e.stopPropagation();
  const { card, player } = state.activeCtxCard;
  showCtxMenu(state.activeCtxEvent, card, player);
}

function addCounter(type) {
  const { card, player } = state.activeCtxCard;
  if (!card.counters || typeof card.counters !== 'object') card.counters = {};
  // +1/+1 and -1/-1 cancel each other one-for-one (MTG rule 704.5q)
  if (type === '+1/+1' && (card.counters['-1/-1'] || 0) > 0) {
    card.counters['-1/-1']--;
    if (card.counters['-1/-1'] === 0) delete card.counters['-1/-1'];
  } else if (type === '-1/-1' && (card.counters['+1/+1'] || 0) > 0) {
    card.counters['+1/+1']--;
    if (card.counters['+1/+1'] === 0) delete card.counters['+1/+1'];
  } else {
    card.counters[type] = (card.counters[type] || 0) + 1;
  }
  renderBattlefield(player);
  closeCtxMenu();
}

function removeCounter(type) {
  const { card, player } = state.activeCtxCard;
  if (!card.counters || !card.counters[type]) { closeCtxMenu(); return; }
  card.counters[type]--;
  if (card.counters[type] === 0) delete card.counters[type];
  renderBattlefield(player);
  closeCtxMenu();
}

function removeAllCounters() {
  const { card, player } = state.activeCtxCard;
  card.counters = {};
  renderBattlefield(player);
  closeCtxMenu();
}

function attachFromCtx() {
  const { card, player } = state.activeCtxCard;
  openAttachPicker(card, player);
}

function detachFromCtx() {
  const { card } = state.activeCtxCard;
  card.attachedTo = null;
  render();
  closeCtxMenu();
}

function openAttachPicker(card, player) {
  closeCtxMenu();
  const targets = state[player].battlefield.filter(c =>
    c.id !== card.id && !c.attachedTo
  );
  if (targets.length === 0) {
    showToast('No valid targets to attach to.');
    return;
  }
  openModal(`
    <h2>Attach to...</h2>
    <div id="attach-target-list" style="overflow-y:auto;max-height:300px;display:flex;flex-direction:column;gap:4px;padding:4px 0;"></div>
    <div class="modal-btns">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
    </div>
  `);
  const list = document.getElementById('attach-target-list');
  targets.forEach(t => {
    const item = document.createElement('div');
    item.className = 'deck-item';
    const nameSpan = document.createElement('span');
    nameSpan.className = 'deck-item-name';
    nameSpan.textContent = t.name;
    item.appendChild(nameSpan);
    item.addEventListener('click', () => {
      card.attachedTo = t.id;
      closeModal();
      render();
      showToast(`${card.name} → ${t.name}`, 'success');
    });
    list.appendChild(item);
  });
}

function moveCtx(fp, fz, tp, tz) {
  const { card } = state.activeCtxCard;
  moveCard(card, fp, fz, tp, tz);
  closeCtxMenu();
  if (fz === 'library') {
    const viewer = document.getElementById('zone-viewer-content');
    if (viewer && viewer.style.display !== 'none') {
      const searchInput = document.getElementById('library-search-input');
      if (searchInput) searchInput.value = '';
      showLibraryGrid(fp);
    }
  }
}

function sendToCommandZone() {
  const { card, player } = state.activeCtxCard;
  const zones = ['battlefield','hand','graveyard','exile','library'];
  for (const z of zones) {
    const arr = state[player][z];
    const idx = arr.findIndex(c => c.id === card.id);
    if (idx !== -1) {
      if (z === 'battlefield') detachAll(card, player);
      arr.splice(idx, 1);
      break;
    }
  }
  card.tapped = false;
  state[player].commandZone.push(card);
  logAction(`${player === 'me' ? 'Human' : 'Claude'}: ${card.name} returned to Command Zone`);
  render();
  closeCtxMenu();
}

function showGraveyardCtxMenu(e, card, player) {
  state.activeCtxCard = { card, player };
  const isCommander = !!card.isCommander;
  const menu = document.getElementById('ctx-menu');
  menu.innerHTML = `
    <div class="ctx-item" style="font-family:'Cinzel',serif;font-size:10px;color:var(--muted);padding:4px 10px;">${card.name}</div>
    <div class="ctx-sep"></div>
    <div class="ctx-item" onclick="moveCtx('${player}','graveyard','${player}','battlefield')">→ Battlefield</div>
    <div class="ctx-item" onclick="moveCtx('${player}','graveyard','${player}','hand')">→ Hand</div>
    <div class="ctx-item" onclick="moveCtx('${player}','graveyard','${player}','exile')">→ Exile</div>
    <div class="ctx-item" onclick="moveCtx('${player}','graveyard','${player}','libTop')">→ Top of Library</div>
    <div class="ctx-item" onclick="moveCtx('${player}','graveyard','${player}','libCount')">→ Bottom of Library</div>
    ${isCommander ? `<div class="ctx-item" onclick="sendToCommandZone()">→ Command Zone</div>` : ''}
    <div class="ctx-sep"></div>
    <div class="ctx-item danger" onclick="removeCtx()">Remove from Game</div>
  `;
  menu.style.display = 'block';
  positionCtxMenu(e);
  setTimeout(() => document.addEventListener('click', closeCtxMenu, { once: true }), 10);
}

function showExileCtxMenu(e, card, player) {
  state.activeCtxCard = { card, player };
  const isCommander = !!card.isCommander;
  const menu = document.getElementById('ctx-menu');
  menu.innerHTML = `
    <div class="ctx-item" style="font-family:'Cinzel',serif;font-size:10px;color:var(--muted);padding:4px 10px;">${card.name}</div>
    <div class="ctx-sep"></div>
    <div class="ctx-item" onclick="moveCtx('${player}','exile','${player}','battlefield')">→ Battlefield</div>
    <div class="ctx-item" onclick="moveCtx('${player}','exile','${player}','hand')">→ Hand</div>
    <div class="ctx-item" onclick="moveCtx('${player}','exile','${player}','graveyard')">→ Graveyard</div>
    <div class="ctx-item" onclick="moveCtx('${player}','exile','${player}','libTop')">→ Top of Library</div>
    <div class="ctx-item" onclick="moveCtx('${player}','exile','${player}','libCount')">→ Bottom of Library</div>
    ${isCommander ? `<div class="ctx-item" onclick="sendToCommandZone()">→ Command Zone</div>` : ''}
    <div class="ctx-sep"></div>
    <div class="ctx-item danger" onclick="removeCtx()">Remove from Game</div>
  `;
  menu.style.display = 'block';
  positionCtxMenu(e);
  setTimeout(() => document.addEventListener('click', closeCtxMenu, { once: true }), 10);
}

function showLibraryCtxMenu(e, card, player) {
  state.activeCtxCard = { card, player };
  const menu = document.getElementById('ctx-menu');
  menu.innerHTML = `
    <div class="ctx-item" style="font-family:'Cinzel',serif;font-size:10px;color:var(--muted);padding:4px 10px;">${card.name}</div>
    <div class="ctx-sep"></div>
    <div class="ctx-item" onclick="moveCtx('${player}','library','${player}','libTop')">→ Top of Library</div>
    <div class="ctx-item" onclick="moveCtx('${player}','library','${player}','libCount')">→ Bottom of Library</div>
    <div class="ctx-sep"></div>
    <div class="ctx-item" onclick="moveCtx('${player}','library','${player}','hand')">→ Hand</div>
    <div class="ctx-item" onclick="moveCtx('${player}','library','${player}','battlefield')">→ Battlefield</div>
    <div class="ctx-item" onclick="moveCtx('${player}','library','${player}','graveyard')">→ Graveyard</div>
    <div class="ctx-item" onclick="moveCtx('${player}','library','${player}','exile')">→ Exile</div>
    <div class="ctx-sep"></div>
    <div class="ctx-item danger" onclick="removeCtx()">Remove from Game</div>
  `;
  menu.style.display = 'block';
  positionCtxMenu(e);
  setTimeout(() => document.addEventListener('click', closeCtxMenu, { once: true }), 10);
}

function removeCtx() {
  const { card, player } = state.activeCtxCard;
  const zones = ['battlefield','hand','graveyard','exile','library'];
  for (const z of zones) {
    const idx = state[player][z].findIndex(c => c.id === card.id);
    if (idx !== -1) {
      if (z === 'battlefield') detachAll(card, player);
      state[player][z].splice(idx, 1);
      break;
    }
  }
  render();
  closeCtxMenu();
}


// ─── CARD PREVIEW ─────────────────────────────────────────────────────────────
function showPreview(e, card) {
  if (!card.imageUri) return;
  const prev = document.getElementById('card-preview');
  const img = document.getElementById('card-preview-img');
  img.src = card.imageUri;
  prev.style.display = 'block';
  const x = e.clientX + 16;
  const y = e.clientY - 60;
  prev.style.left = Math.min(x, window.innerWidth - 220) + 'px';
  prev.style.top = Math.max(10, Math.min(y, window.innerHeight - 290)) + 'px';
}
function hidePreview() {
  document.getElementById('card-preview').style.display = 'none';
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
function openModal(html) {
  const container = document.getElementById('modal-container');
  container.innerHTML = `
    <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
      <div class="modal">${html}</div>
    </div>
  `;
}
function closeModal() {
  document.getElementById('modal-container').innerHTML = '';
  hidePreview();
}

// ─── DUAL-FACED CARD HELPERS ──────────────────────────────────────────────────
let _dfcPickerCard = null;
let _dfcPickerCallback = null;

function showDFCFacePicker(card, callback) {
  const [f0, f1] = card.cardFaces;
  _dfcPickerCard = card;
  _dfcPickerCallback = callback;
  openModal(`
    <h2>Choose Face</h2>
    <p style="color:var(--muted);font-size:12px;margin-bottom:10px;">Which face enters the battlefield?</p>
    <div class="token-picker-grid" style="justify-content:center;">
      <div class="token-picker-item" onclick="selectDFCFace(0)">
        ${f0.imageUri ? `<img src="${f0.imageUri}" alt="${f0.name}">` : `<div class="token-picker-noart">${f0.name}</div>`}
        <div class="token-picker-label">${f0.name}</div>
      </div>
      <div class="token-picker-item" onclick="selectDFCFace(1)">
        ${f1.imageUri ? `<img src="${f1.imageUri}" alt="${f1.name}">` : `<div class="token-picker-noart">${f1.name}</div>`}
        <div class="token-picker-label">${f1.name}</div>
      </div>
    </div>
    <div class="modal-btns">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
    </div>
  `);
}

function selectDFCFace(faceIdx) {
  const card = _dfcPickerCard;
  const cb   = _dfcPickerCallback;
  _dfcPickerCard = null;
  _dfcPickerCallback = null;
  if (!card) return;
  card.currentFace = faceIdx;
  card.imageUri = card.cardFaces[faceIdx].imageUri;
  closeModal();
  if (cb) cb();
}

function transformFromCtx() {
  const { card, player } = state.activeCtxCard;
  if (!card.isDFC || !card.cardFaces) return;
  card.currentFace = card.currentFace === 0 ? 1 : 0;
  card.imageUri = card.cardFaces[card.currentFace].imageUri;
  // Re-render whichever zone this card is in
  if (state[player].battlefield.some(c => c.id === card.id)) {
    renderBattlefield(player);
  } else {
    render();
  }
  closeCtxMenu();
}
