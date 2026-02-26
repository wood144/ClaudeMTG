// ─── DICE ROLLER ──────────────────────────────────────────────────────────────
function rollDice(sides) {
  const result = Math.floor(Math.random() * sides) + 1;
  document.getElementById('dice-result').textContent = result;
}

// ─── LIFE / DAMAGE ────────────────────────────────────────────────────────────
function adjustLife(player, delta) {
  state[player].life = Math.max(0, state[player].life + delta);
  const label = player === 'me' ? 'Human' : 'Claude';
  const sign = delta > 0 ? '+' : '';
  logAction(`${label}: Life ${sign}${delta} → now ${state[player].life}`);
  renderLifeTotals();
}

function adjustCmdDmg(key, delta) {
  state.cmdDmg[key] = Math.max(0, state.cmdDmg[key] + delta);
  renderLifeTotals();
}

// ─── TURN ORDER ───────────────────────────────────────────────────────────────
function getActivePlayer() {
  const isOddTurn = state.turn % 2 === 1;
  return (state.goingFirst === 'me') ? (isOddTurn ? 'me' : 'opp') : (isOddTurn ? 'opp' : 'me');
}

function toggleGoingFirst() {
  state.goingFirst = state.goingFirst === 'me' ? 'opp' : 'me';
  renderPhase();
}

// ─── PHASE / TURN ─────────────────────────────────────────────────────────────
function nextPhase() {
  state.phaseIdx = (state.phaseIdx + 1) % PHASES.length;
  logAction(`Phase → ${PHASES[state.phaseIdx]}`);
  renderPhase();
}
function prevPhase() {
  state.phaseIdx = (state.phaseIdx - 1 + PHASES.length) % PHASES.length;
  logAction(`Phase ← ${PHASES[state.phaseIdx]} (stepped back)`);
  renderPhase();
}
function nextTurn() {
  state.turn++;
  state.phaseIdx = 0;
  // Only untap the new active player's permanents
  const active = getActivePlayer();
  state[active].battlefield.forEach(c => c.tapped = false);
  logAction(`--- Turn ${state.turn} begins — Active: ${active === 'me' ? 'Human' : 'Claude'} ---`);
  renderBattlefield(active);
  renderPhase();
}

// ─── CARD ACTIONS ─────────────────────────────────────────────────────────────
function tapCard(card, player) {
  card.tapped = !card.tapped;
  const label = player === 'me' ? 'Human' : 'Claude';
  logAction(`${label}: ${card.tapped ? 'Tapped' : 'Untapped'} ${card.name}`);
  renderBattlefield(player);
}

function detachAll(card, player) {
  if (card.attachedTo) card.attachedTo = null;
  for (const c of state[player].battlefield) {
    if (c.attachedTo === card.id) c.attachedTo = null;
  }
}

function moveCard(card, fromPlayer, fromZone, toPlayer, toZone) {
  const pLabel = fromPlayer === 'me' ? 'Human' : 'Claude';
  const tpLabel = toPlayer === 'me' ? 'Human' : 'Claude';
  const zoneFmt = z => (z === 'libCount' || z === 'libTop') ? 'Library' : z.charAt(0).toUpperCase() + z.slice(1);
  // Hide card name only when human draws from library to hand (hidden information)
  const isHiddenDraw = fromZone === 'library' && toZone === 'hand' && toPlayer === 'me';
  const cardName = isHiddenDraw ? '[hidden card]' : card.name;
  if (fromPlayer === toPlayer) {
    logAction(`${pLabel}: ${cardName} ${zoneFmt(fromZone)} → ${zoneFmt(toZone)}`);
  } else {
    logAction(`${cardName}: ${pLabel}'s ${zoneFmt(fromZone)} → ${tpLabel}'s ${zoneFmt(toZone)}`);
  }
  if (fromZone === 'battlefield') detachAll(card, fromPlayer);
  const fromArr = state[fromPlayer][fromZone];
  const idx = fromArr.findIndex(c => c.id === card.id);
  if (idx !== -1) fromArr.splice(idx, 1);

  if (toZone === 'libCount') {
    card.tapped = false;
    state[toPlayer].library.push(card); // bottom of library
  } else if (toZone === 'libTop') {
    card.tapped = false;
    state[toPlayer].library.unshift(card); // top of library
  } else {
    card.tapped = false;
    if (toZone === 'battlefield') {
      const pos = nextBattlefieldPos(toPlayer);
      card.x = pos.x; card.y = pos.y;
    }
    state[toPlayer][toZone].push(card);
  }
  render();
}

// ─── BATTLEFIELD POSITION ─────────────────────────────────────────────────────
function nextBattlefieldPos(player) {
  const CARD_W = 63, CARD_H = 88, GAP = 8, PAD = 10;
  const n = state[player].battlefield.length;
  const fieldEl = document.getElementById(player === 'me' ? 'my-field' : 'opp-field');
  const cols = fieldEl ? Math.max(1, Math.floor((fieldEl.clientWidth - PAD * 2) / (CARD_W + GAP))) : 8;
  return {
    x: PAD + (n % cols) * (CARD_W + GAP),
    y: PAD + Math.floor(n / cols) * (CARD_H + GAP)
  };
}

function addToken(player) {
  openModal(`
    <h2>Add Token</h2>
    <input type="text" id="token-name" placeholder="Token name (e.g. Soldier, Dragon)" style="margin-bottom:8px;">
    <div class="modal-btns">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="confirmAddToken('${player}')">Add</button>
    </div>
  `);
  setTimeout(() => document.getElementById('token-name')?.focus(), 100);
}

let _tokenPicker = null;

async function confirmAddToken(player) {
  const nameEl = document.getElementById('token-name');
  const name = nameEl ? nameEl.value.trim() : '';
  if (!name) { showToast('Enter a token name.'); return; }
  closeModal();

  const results = await searchTokens(name);

  if (results.length === 0) {
    // Nothing on Scryfall — text-only card
    const card = makeCard(name, null);
    card.name = name.charAt(0).toUpperCase() + name.slice(1) + ' Token';
    card.uid = ++state[player].uidCounter;
    const pos = nextBattlefieldPos(player);
    card.x = pos.x; card.y = pos.y;
    state[player].battlefield.push(card);
    logAction(`${player === 'me' ? 'Human' : 'Claude'}: Created ${card.name}`);
    showToast(`Created ${card.name} (no art found)`, 'success');
    render();
  } else if (results.length === 1) {
    placeToken(player, results[0]);
  } else {
    showTokenPicker(player, name, results);
  }
}

function placeToken(player, cardData) {
  const card = makeCard(cardData.name, cardData);
  card.name = cardData.name + ' Token';
  card.uid = ++state[player].uidCounter;
  const pos = nextBattlefieldPos(player);
  card.x = pos.x; card.y = pos.y;
  state[player].battlefield.push(card);
  logAction(`${player === 'me' ? 'Human' : 'Claude'}: Created ${card.name}`);
  showToast(`Created ${card.name}`, 'success');
  render();
}

function showTokenPicker(player, name, tokens) {
  _tokenPicker = { player, tokens };
  let grid = '';
  tokens.forEach((t, i) => {
    const imgUri = getImageUri(t);
    const pt = (t.power !== undefined && t.toughness !== undefined) ? `${t.power}/${t.toughness}` : '';
    grid += `
      <div class="token-picker-item" onclick="selectToken(${i})">
        ${imgUri
          ? `<img src="${imgUri}" alt="${t.name}">`
          : `<div class="token-picker-noart">${t.name}</div>`}
        <div class="token-picker-label">${t.name}${pt ? ` · ${pt}` : ''}</div>
      </div>`;
  });
  openModal(`
    <h2>Choose Token</h2>
    <p style="color:var(--muted);font-size:12px;margin:0;">Multiple "${name}" tokens found — pick the right one.</p>
    <div class="token-picker-grid">${grid}</div>
    <div class="modal-btns">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
    </div>
  `);
}

function selectToken(idx) {
  if (!_tokenPicker) return;
  const { player, tokens } = _tokenPicker;
  _tokenPicker = null;
  closeModal();
  placeToken(player, tokens[idx]);
}

// ─── ZONE VIEWER ─────────────────────────────────────────────────────────────
function openZone(player, zone) {
  const cards = zone === 'library'
    ? state[player].library
    : zone === 'command'
    ? state[player].commandZone
    : state[player][zone];

  const zoneName = zone.charAt(0).toUpperCase() + zone.slice(1);
  const pName = player === 'me' ? 'Your' : "Claude's";

  let content = `<h2>${pName} ${zoneName}</h2>`;

  if (zone === 'library') {
    content += `
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px;">
        <span style="font-family:'Cinzel',serif;font-size:13px;">Cards remaining: <strong id="lib-count-display">${state[player].library.length}</strong></span>
        <button class="btn-secondary" onclick="drawCard('${player}')">Draw</button>
        <button class="btn-secondary" onclick="shuffleLibrary('${player}')">Shuffle</button>
        <button class="btn-secondary" onclick="openScryPrompt('${player}')">Scry</button>
        <button class="btn-secondary" onclick="openSurveilPrompt('${player}')">Surveil</button>
      </div>
      <div id="show-library-bar" style="margin-bottom:10px;">
        <button class="btn-secondary" onclick="showLibraryGrid('${player}')">Show Library</button>
        <span style="font-family:'Cinzel',serif;font-size:11px;color:var(--muted);margin-left:10px;">Library order is hidden information</span>
      </div>
      <div class="zone-viewer" id="zone-viewer-content" style="display:none;"></div>
      <div class="modal-btns"><button class="btn-secondary" onclick="closeModal()">Close</button></div>
    `;
  } else {
    content += `<div class="zone-viewer" id="zone-viewer-content">`;
    if (cards.length === 0) {
      content += `<span style="color:var(--muted);font-family:'Cinzel',serif;font-size:12px;">Empty</span>`;
    }
    content += `</div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        ${zone === 'graveyard' ? `<button class="btn-secondary" onclick="shuffleGYIntoLib('${player}')">Shuffle into Library</button>` : ''}
        <button class="btn-secondary" onclick="closeModal()">Close</button>
      </div>
    `;
  }

  openModal(content);

  if (cards && zone !== 'library') {
    const viewer = document.getElementById('zone-viewer-content');
    cards.forEach(card => {
      const thumb = document.createElement('div');
      thumb.className = 'zone-card-thumb';
      const fb = document.createElement('div');
      fb.className = 'card-name-fallback';
      fb.textContent = card.name;
      thumb.appendChild(fb);
      if (card.imageUri) {
        const img = document.createElement('img');
        img.src = card.imageUri;
        img.alt = card.name;
        img.onload = () => { fb.style.display = 'none'; };
        img.onerror = () => img.remove();
        thumb.appendChild(img);
      }
      thumb.title = card.name;
      thumb.addEventListener('mousemove', e => showPreview(e, card));
      thumb.addEventListener('mouseleave', hidePreview);

      // Right-click to move
      thumb.addEventListener('contextmenu', e => {
        e.preventDefault();
        if (zone === 'command') {
          const cmdZone = state[player].commandZone;
          const idx = cmdZone.findIndex(c => c.id === card.id);
          if (idx !== -1) {
            const [c] = cmdZone.splice(idx, 1);
            const pos = nextBattlefieldPos(player);
            c.x = pos.x; c.y = pos.y;
            state[player].battlefield.push(c);
            closeModal();
            render();
          }
        } else if (zone === 'library') {
          closeModal();
          showLibraryCtxMenu(e, card, player);
        } else {
          showCtxMenu(e, card, player);
          closeModal();
        }
      });

      viewer.appendChild(thumb);
    });
  }
}

function showLibraryGrid(player) {
  const bar = document.getElementById('show-library-bar');
  if (bar) bar.style.display = 'none';
  const viewer = document.getElementById('zone-viewer-content');
  if (!viewer) return;
  viewer.style.display = '';
  state[player].library.forEach(card => {
    const thumb = document.createElement('div');
    thumb.className = 'zone-card-thumb';
    const fb = document.createElement('div');
    fb.className = 'card-name-fallback';
    fb.textContent = card.name;
    thumb.appendChild(fb);
    if (card.imageUri) {
      const img = document.createElement('img');
      img.src = card.imageUri;
      img.alt = card.name;
      img.onload = () => { fb.style.display = 'none'; };
      img.onerror = () => img.remove();
      thumb.appendChild(img);
    }
    thumb.title = card.name;
    thumb.addEventListener('mousemove', e => showPreview(e, card));
    thumb.addEventListener('mouseleave', hidePreview);
    thumb.addEventListener('contextmenu', e => {
      e.preventDefault();
      closeModal();
      showLibraryCtxMenu(e, card, player);
    });
    viewer.appendChild(thumb);
  });
}

function drawCard(player) {
  if (state[player].library.length === 0) { showToast('Library is empty!'); return; }
  const card = state[player].library.shift();
  state[player].hand.push(card);
  const label = player === 'me' ? 'Human' : 'Claude';
  logAction(player === 'me' ? `${label}: Drew a card` : `${label}: Drew ${card.name}`);
  const countEl = document.getElementById('lib-count-display');
  if (countEl) countEl.textContent = state[player].library.length;
  renderZoneCounts();
  if (player === 'me') renderHand(); else renderOppHand();
}

function shuffleLibrary(player) {
  state[player].library.sort(() => Math.random() - 0.5);
  showToast('Library shuffled!', 'success');
}

function openScryPrompt(player) {
  const max = state[player].library.length;
  if (max === 0) { showToast('Library is empty!'); return; }
  openModal(`
    <h2>Scry</h2>
    <p style="color:var(--muted);font-size:12px;margin-bottom:8px;">How many cards to scry?</p>
    <input type="number" id="scry-n" min="1" max="${max}" value="1" style="margin-bottom:8px;width:80px;">
    <div class="modal-btns">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="openLibraryManip('${player}', +document.getElementById('scry-n').value, 'scry')">Scry</button>
    </div>
  `);
  setTimeout(() => document.getElementById('scry-n')?.select(), 100);
}

function openSurveilPrompt(player) {
  const max = state[player].library.length;
  if (max === 0) { showToast('Library is empty!'); return; }
  openModal(`
    <h2>Surveil</h2>
    <p style="color:var(--muted);font-size:12px;margin-bottom:8px;">How many cards to surveil?</p>
    <input type="number" id="surveil-n" min="1" max="${max}" value="1" style="margin-bottom:8px;width:80px;">
    <div class="modal-btns">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="openLibraryManip('${player}', +document.getElementById('surveil-n').value, 'surveil')">Surveil</button>
    </div>
  `);
  setTimeout(() => document.getElementById('surveil-n')?.select(), 100);
}

let libManipState = { player: null, mode: null, cards: [] };

function openLibraryManip(player, n, mode) {
  const lib = state[player].library;
  n = Math.min(Math.max(1, n), lib.length);
  const cards = lib.slice(0, n);
  libManipState = { player, mode, cards };

  const sendLabel = mode === 'scry' ? 'Bottom' : 'Graveyard';
  const title = mode === 'scry' ? `Scry ${n}` : `Surveil ${n}`;

  openModal(`
    <h2>${title}</h2>
    <p style="color:var(--muted);font-size:12px;margin-bottom:10px;">
      Left = top of library. <strong>Drag cards to reorder.</strong> Toggle each card — KEEP stays on top, ${sendLabel.toUpperCase()} goes to ${mode === 'scry' ? 'bottom of library' : 'graveyard'}.
    </p>
    <div id="libmanip-cards" style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;min-height:120px;"></div>
    <div class="modal-btns">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="confirmLibraryManip()">Confirm</button>
    </div>
  `);

  const container = document.getElementById('libmanip-cards');
  let dragSrc = null;

  cards.forEach(card => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;cursor:grab;';
    wrap.dataset.cardId = card.id;
    wrap.dataset.action = 'keep';
    wrap.draggable = true;

    const thumb = document.createElement('div');
    thumb.className = 'zone-card-thumb';
    const fb = document.createElement('div');
    fb.className = 'card-name-fallback';
    fb.textContent = card.name;
    thumb.appendChild(fb);
    if (card.imageUri) {
      const img = document.createElement('img');
      img.src = card.imageUri;
      img.alt = card.name;
      img.onload = () => { fb.style.display = 'none'; };
      img.onerror = () => img.remove();
      thumb.appendChild(img);
      if (img.complete && img.naturalWidth > 0) fb.style.display = 'none';
    }
    thumb.addEventListener('mousemove', e => showPreview(e, card));
    thumb.addEventListener('mouseleave', hidePreview);

    const btn = document.createElement('button');
    btn.className = 'btn-primary';
    btn.style.cssText = 'font-size:10px;padding:3px 8px;width:100%;';
    btn.textContent = 'KEEP';
    btn.addEventListener('click', () => {
      if (wrap.dataset.action === 'keep') {
        wrap.dataset.action = 'send';
        btn.textContent = sendLabel.toUpperCase();
        btn.className = 'btn-secondary';
        btn.style.cssText = 'font-size:10px;padding:3px 8px;width:100%;color:var(--red,#e05);border-color:var(--red,#e05);';
      } else {
        wrap.dataset.action = 'keep';
        btn.textContent = 'KEEP';
        btn.className = 'btn-primary';
        btn.style.cssText = 'font-size:10px;padding:3px 8px;width:100%;';
      }
    });

    wrap.addEventListener('dragstart', e => {
      dragSrc = wrap;
      e.dataTransfer.effectAllowed = 'move';
      setTimeout(() => { wrap.style.opacity = '0.4'; }, 0);
    });
    wrap.addEventListener('dragend', () => {
      wrap.style.opacity = '';
      dragSrc = null;
    });
    wrap.addEventListener('dragover', e => {
      e.preventDefault();
      if (!dragSrc || dragSrc === wrap) return;
      const rect = wrap.getBoundingClientRect();
      if (e.clientX < rect.left + rect.width / 2) {
        container.insertBefore(dragSrc, wrap);
      } else {
        container.insertBefore(dragSrc, wrap.nextSibling);
      }
    });

    wrap.appendChild(thumb);
    wrap.appendChild(btn);
    container.appendChild(wrap);
  });
}

function confirmLibraryManip() {
  const { player, mode, cards } = libManipState;
  const container = document.getElementById('libmanip-cards');
  const keep = [], send = [];
  container.querySelectorAll('[data-card-id]').forEach(wrap => {
    const card = cards.find(c => c.id === wrap.dataset.cardId);
    if (!card) return;
    (wrap.dataset.action === 'keep' ? keep : send).push(card);
  });

  // Remove the top N cards from library, then put kept back on top, send the rest
  state[player].library.splice(0, cards.length);
  state[player].library.unshift(...keep);
  if (mode === 'scry') {
    state[player].library.push(...send);
  } else {
    state[player].graveyard.push(...send);
  }

  const dest = mode === 'scry' ? 'bottom of library' : 'graveyard';
  const label = player === 'me' ? 'Human' : 'Claude';
  logAction(`${label}: ${mode === 'scry' ? 'Scried' : 'Surveiled'} ${cards.length} — kept ${keep.length} on top, sent ${send.length} to ${dest}`);
  showToast(`${mode === 'scry' ? 'Scry' : 'Surveil'}: kept ${keep.length}, sent ${send.length} to ${dest}`, 'success');
  closeModal();
  render();
}

function shuffleGYIntoLib(player) {
  state[player].library.push(...state[player].graveyard);
  state[player].graveyard = [];
  state[player].library.sort(() => Math.random() - 0.5);
  closeModal();
  render();
}

// ─── DECK MANAGEMENT ─────────────────────────────────────────────────────────
function deleteDeck(i) {
  if (!confirm(`Delete "${state.decks[i].name}"?`)) return;
  state.decks.splice(i, 1);
  if (state.selectedDeck >= state.decks.length) state.selectedDeck = null;
  saveDecks();
  renderDecks();
}

function openImportMoxfield() {
  openModal(`
    <h2>Import from URL</h2>
    <div style="background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:10px;margin-bottom:10px;font-size:12px;line-height:1.7;">
      <div style="font-family:'Cinzel',serif;font-size:10px;letter-spacing:0.1em;color:var(--accent);margin-bottom:6px;">SUPPORTED SITES</div>
      <div>✅ <strong>Moxfield</strong> — URL import works automatically</div>
      <div style="margin-top:4px;">✅ <strong>Archidekt</strong> — URL import works automatically</div>
      <div style="margin-top:4px;">📋 <strong>Manabox</strong> — Use "Share as Text" in the app, then use Paste Decklist instead</div>
    </div>
    <input type="text" id="mox-url" placeholder="https://www.moxfield.com/decks/..." style="margin-bottom:8px;">
    <input type="text" id="mox-name" placeholder="Deck name (optional — auto-detected from Moxfield)" style="margin-bottom:8px;">
    <div id="mox-status" style="font-size:12px;color:var(--muted);min-height:18px;margin-bottom:6px;font-family:'Cinzel',serif;letter-spacing:0.05em;"></div>
    <div class="modal-btns">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" id="mox-import-btn" onclick="confirmMoxfieldUrl()">Import from URL</button>
    </div>
  `);
  setTimeout(() => document.getElementById('mox-url')?.focus(), 100);
}

async function confirmMoxfieldUrl() {
  const urlInput = document.getElementById('mox-url').value.trim();
  const nameInput = document.getElementById('mox-name').value.trim();
  const status = document.getElementById('mox-status');
  const btn = document.getElementById('mox-import-btn');

  if (!urlInput) { status.textContent = 'Please enter a URL.'; status.style.color = 'var(--red)'; return; }

  // Extract deck ID from Moxfield URL
  const moxMatch = urlInput.match(/moxfield\.com\/decks\/([^/?#]+)/);
  if (!moxMatch) {
    // Try Archidekt
    const archiMatch = urlInput.match(/archidekt\.com\/decks\/(\d+)/);
    if (archiMatch) {
      const deckId = archiMatch[1];
      status.textContent = 'Fetching deck from Archidekt...';
      status.style.color = 'var(--muted)';
      btn.disabled = true; btn.style.opacity = '0.6';
      try {
        const apiUrl = `https://archidekt.com/api/decks/${deckId}/`;
        const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(apiUrl)}`;
        const resp = await fetch(proxyUrl);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        const lines = [];
        for (const card of (data.cards || [])) {
          if ((card.categories || []).includes('Maybeboard')) continue;
          const qty = card.quantity || 1;
          const name = card.card?.oracleCard?.name || card.card?.name;
          if (name) lines.push(`${qty} ${name}`);
        }
        if (lines.length === 0) throw new Error('No cards found.');
        const deckName = nameInput || data.name || ('Deck ' + (state.decks.length + 1));
        state.decks.push({ name: deckName, list: lines.join('\n') });
        state.selectedDeck = state.decks.length - 1;
        saveDecks(); closeModal(); renderDecks();
      } catch (err) {
        status.textContent = `Archidekt import failed: ${err.message}. Try "Paste Decklist" instead.`;
        status.style.color = 'var(--red)';
        btn.disabled = false; btn.style.opacity = '1';
      }
      return;
    }

    status.textContent = 'Not a recognized URL. Use "Paste Decklist" for other sites.';
    status.style.color = 'var(--red)';
    return;
  }

  const deckId = moxMatch[1];
  status.textContent = 'Fetching deck from Moxfield...';
  status.style.color = 'var(--muted)';
  btn.disabled = true;
  btn.style.opacity = '0.6';

  try {
    const apiUrl = `https://api2.moxfield.com/v2/decks/all/${deckId}`;
    const proxies = [
      `https://corsproxy.io/?url=${encodeURIComponent(apiUrl)}`,
      `https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}`,
      `https://proxy.cors.sh/${apiUrl}`
    ];
    let data = null;
    for (const proxyUrl of proxies) {
      try {
        const r = await fetch(proxyUrl, { headers: { 'x-requested-with': 'XMLHttpRequest' } });
        if (!r.ok) continue;
        const raw = await r.json();
        const parsed = raw.contents ? JSON.parse(raw.contents) : raw;
        if (parsed && (parsed.mainboard || parsed.boards || parsed.name)) { data = parsed; break; }
      } catch(e) { continue; }
    }
    if (!data) throw new Error('All proxies failed — try Paste Decklist instead');

    const deckName = nameInput || data.name || ('Deck ' + (state.decks.length + 1));
    const lines = [];

    const boards = data.boards || {};
    const cmdCards = boards.commanders?.cards || data.commanders || {};
    const mainCards = boards.mainboard?.cards || data.mainboard || {};

    for (const [cardName, info] of Object.entries(cmdCards)) {
      const name = info.card?.name || cardName;
      lines.push(`1 ${name} *CMDR*`);
    }
    for (const [cardName, info] of Object.entries(mainCards)) {
      const name = info.card?.name || cardName;
      const qty = info.quantity || 1;
      lines.push(`${qty} ${name}`);
    }

    if (lines.length === 0) throw new Error('No cards found in deck response.');

    state.decks.push({ name: deckName, list: lines.join('\n') });
    state.selectedDeck = state.decks.length - 1;
    saveDecks();
    closeModal();
    renderDecks();

  } catch (err) {
    status.textContent = `Import failed: ${err.message}. Try "Paste Decklist" instead.`;
    status.style.color = 'var(--red)';
    btn.disabled = false;
    btn.style.opacity = '1';
  }
}

function openPasteDecklist() {
  openModal(`
    <h2>Paste Decklist</h2>
    <p style="color:var(--muted);font-size:12px;margin-bottom:4px;">Supports MTGA export format (with Commander/Deck headers), Moxfield text, or simple "1 Card Name" format.</p>
    <input type="text" id="paste-name" placeholder="Deck name" style="margin-bottom:8px;">
    <textarea id="paste-list" placeholder="Commander&#10;1 Fblthp, the Lost&#10;&#10;Deck&#10;1 Sol Ring&#10;1 Command Tower&#10;31 Island&#10;..."></textarea>
    <div id="paste-status" style="font-size:12px;min-height:18px;font-family:'Cinzel',serif;"></div>
    <div class="modal-btns">
      <button class="btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="confirmPaste()">Save Deck</button>
    </div>
  `);
}

function confirmPaste() {
  const name = document.getElementById('paste-name').value.trim() || 'Deck ' + (state.decks.length + 1);
  const list = document.getElementById('paste-list').value.trim();
  const statusEl = document.getElementById('paste-status');

  if (!list) {
    if (statusEl) { statusEl.textContent = 'Decklist is empty — paste your card list above.'; statusEl.style.color = 'var(--red)'; }
    showToast('Decklist is empty. Paste your card list first.');
    return;
  }

  const normalized = normalizeMTGAFormat(list);
  state.decks.push({ name, list: normalized });
  state.selectedDeck = state.decks.length - 1;
  saveDecks();
  closeModal();
  renderDecks();
  showToast(`Saved "${name}"`, 'success');
}

/**
 * Normalize MTGA export format into internal format.
 * MTGA uses section headers like "Commander", "Deck", "Sideboard", "Companion"
 * We convert commander section cards to have *CMDR* tag and strip headers.
 */
function normalizeMTGAFormat(text) {
  const lines = text.split('\n');
  const output = [];
  let currentSection = 'deck';
  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed) {
      // Blank line after commander block = deck section begins (Moxfield format has no "// Deck" header)
      if (currentSection === 'commander' || currentSection === 'companion') currentSection = 'deck';
      continue;
    }
    const lower = trimmed.toLowerCase();
    if (['commander','companion','deck','sideboard','maybeboard'].includes(lower)) {
      currentSection = lower;
      continue;
    }
    if (trimmed.startsWith('//') || trimmed.startsWith('#')) {
      // Moxfield exports use "// COMMANDER", "// Deck", etc. — treat as section headers
      const commentContent = trimmed.replace(/^[/#]+\s*/, '').trim().toLowerCase();
      if (['commander','companion','deck','sideboard','maybeboard'].includes(commentContent)) {
        currentSection = commentContent;
      }
      continue;
    }
    if (/\*CMDR\*/i.test(trimmed)) { output.push(trimmed); continue; }
    if (currentSection === 'commander' || currentSection === 'companion') {
      output.push(trimmed + ' *CMDR*');
    } else if (currentSection === 'maybeboard' || currentSection === 'sideboard') {
      continue;
    } else {
      output.push(trimmed);
    }
  }
  return output.join('\n');
}

function parseDecklist(text) {
  const lines = text.split('\n');
  const cards = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) continue;
    // Skip bare section headers that might have slipped through
    if (['commander','deck','sideboard','maybeboard','companion'].includes(trimmed.toLowerCase())) continue;
    const match = trimmed.match(/^(\d+)[x ]?\s+(.+)$/);
    if (match) {
      const count = parseInt(match[1]);
      const name = match[2].replace(/\s*\*CMDR\*\s*/gi, '').trim();
      for (let i = 0; i < count; i++) cards.push(name);
    } else {
      cards.push(trimmed.replace(/\s*\*CMDR\*\s*/gi, '').trim());
    }
  }
  return cards;
}

async function loadDeckForPlayer(player) {
  if (state.selectedDeck === null) { alert('Select a deck first.'); return; }
  const deck = state.decks[state.selectedDeck];
  let cardNames = parseDecklist(deck.list);
  if (cardNames.length === 0) { alert('No cards found in deck.'); return; }

  openModal(`<h2>Loading "${deck.name}"...</h2><p style="color:var(--muted);">Fetching card data from Scryfall...</p><div id="load-progress" style="font-family:'Cinzel',serif;font-size:11px;color:var(--accent);margin-top:8px;">Starting...</div>`);
  const setP = t => { const el = document.getElementById('load-progress'); if (el) el.textContent = t; };

  // Reset player state
  state[player].hand = [];
  state[player].battlefield = [];
  state[player].graveyard = [];
  state[player].exile = [];
  state[player].library = [];
  state[player].commandZone = [];
  state[player].uidCounter = 0;

  // Find ALL commanders from raw list
  const rawLines = deck.list.split('\n');
  const cmdNames = [];
  for (const line of rawLines) {
    if (/\*CMDR\*/i.test(line)) {
      const m = line.trim().match(/^(\d+)\s+(.+?)\s*\*CMDR\*/i);
      if (m) cmdNames.push(m[2].trim());
    }
  }
  if (cmdNames.length === 0) cmdNames.push(cardNames[0]);

  // Fetch all unique card names in parallel
  const unique = [...new Set(cardNames)];
  const BATCH = 10;
  for (let i = 0; i < unique.length; i += BATCH) {
    const batch = unique.slice(i, i + BATCH);
    setP(`Fetching cards ${i+1}–${Math.min(i+BATCH, unique.length)} of ${unique.length}...`);
    await Promise.all(batch.map(n => fetchCard(n)));
    if (i + BATCH < unique.length) await sleep(80);
  }

  setP('Building hand...');

  // Set all commanders
  for (const cmdName of cmdNames) {
    const cmdData = await fetchCard(cmdName);
    const cmdCard = makeCard(cmdName, cmdData);
    cmdCard.uid = ++state[player].uidCounter;
    cmdCard.isCommander = true;
    state[player].commandZone.push(cmdCard);
  }

  // Remaining non-commander cards (exclude all commanders)
  const cmdNameSet = new Set(cmdNames);
  const nonCmd = cardNames.filter(n => !cmdNameSet.has(n));

  // Deal 7-card opening hand
  const shuffled = [...nonCmd].sort(() => Math.random() - 0.5);
  const handCards = shuffled.slice(0, 7);
  for (const n of handCards) {
    const d = await fetchCard(n);
    const c = makeCard(n, d);
    c.uid = ++state[player].uidCounter;
    state[player].hand.push(c);
  }

  // Store remaining cards as ordered library (Scryfall data already cached — no network calls)
  setP('Building library...');
  for (const n of shuffled.slice(handCards.length)) {
    const d = await fetchCard(n);
    const c = makeCard(n, d);
    c.uid = ++state[player].uidCounter;
    state[player].library.push(c);
  }

  closeModal();
  render();
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── BOARD STATE FOR CLAUDE ───────────────────────────────────────────────────
function openBoardState() {
  const state_text = generateBoardState();
  openModal(`
    <h2>Send to Claude</h2>
    <p style="color:var(--muted);font-size:12px;margin-bottom:6px;">Copy this and paste into your Claude chat.</p>
    <pre id="board-output" style="font-size:11px;line-height:1.5;white-space:pre-wrap;max-height:50vh;overflow-y:auto;background:var(--bg);padding:10px;border-radius:6px;border:1px solid var(--border);font-family:monospace;">${state_text}</pre>
    <div class="modal-btns">
      <button class="btn-primary" onclick="copyBoardState()">📋 Copy</button>
      <button class="btn-secondary" onclick="downloadBoardState()">⬇ Download TXT</button>
      <button class="btn-secondary" onclick="closeModal()">Close</button>
    </div>
  `);
}

// ─── TOON (Token-Oriented Object Notation) LOG TRANSFORMER ───────────────────
function logToTOON(entry) {
  const Z = s => ({ Battlefield:'BF', Graveyard:'GY', Library:'LIB', Hand:'H', Exile:'EX' }[s] || s.slice(0,2).toUpperCase());
  const P = s => s === 'Human' ? 'H' : 'C';
  let m;
  if ((m = entry.match(/Turn (\d+) begins.*Active: (Human|Claude)/)))
    return `TURN:${m[1]}:${P(m[2])}`;
  if ((m = entry.match(/Phase [→←] (.+?)(?:\s+\(stepped back\))?$/)))
    return `PH:${m[1].replace('MAIN ', 'M')}`;
  if ((m = entry.match(/(Human|Claude): Life ([+\-]\d+) → now (\d+)/)))
    return `${P(m[1])}>LIFE:${m[2]}=${m[3]}`;
  if ((m = entry.match(/(Human|Claude): Drew a card/)))
    return `${P(m[1])}>DRAW`;
  if ((m = entry.match(/(Human|Claude): Drew (.+)/)))
    return `${P(m[1])}>DRAW:${m[2]}`;
  if ((m = entry.match(/(Human|Claude): (Tapped|Untapped) (.+)/)))
    return `${P(m[1])}>${m[2] === 'Tapped' ? 'TAP' : 'UNTAP'}:${m[3]}`;
  if ((m = entry.match(/(Human|Claude): Created (.+)/)))
    return `${P(m[1])}>TOKEN:${m[2]}`;
  if ((m = entry.match(/(Human|Claude): (Scried|Surveiled) (\d+).+kept (\d+).+sent (\d+)/)))
    return `${P(m[1])}>${m[2] === 'Scried' ? 'SCRY' : 'SURV'}:${m[3]}(k:${m[4]},s:${m[5]})`;
  if ((m = entry.match(/(Human|Claude): (.+?) (Battlefield|Graveyard|Library|Hand|Exile) → (Battlefield|Graveyard|Library|Hand|Exile)/)))
    return `${P(m[1])}>MV:${m[2]}[${Z(m[3])}→${Z(m[4])}]`;
  if ((m = entry.match(/(.+): (Human|Claude)'s (Battlefield|Graveyard|Library|Hand|Exile) → (Human|Claude)'s (Battlefield|Graveyard|Library|Hand|Exile)/)))
    return `MV:${m[1]}[${P(m[2])}.${Z(m[3])}→${P(m[4])}.${Z(m[5])}]`;
  return entry; // fallback — return as-is
}

// ─── BOARD STATE FOR CLAUDE (TOON FORMAT) ─────────────────────────────────────
function generateBoardState() {
  const p = state.me;  // human — shown as OPP to Claude
  const o = state.opp; // Claude
  const phaseCode = PHASES[state.phaseIdx].replace('MAIN ', 'M');
  const act = getActivePlayer() === 'me' ? 'HUMAN' : 'CLAUDE';

  const buildAttMap = cards => {
    const m = Object.create(null);
    for (const c of cards) {
      if (c.attachedTo) {
        if (!m[c.attachedTo]) m[c.attachedTo] = [];
        m[c.attachedTo].push(c);
      }
    }
    return m;
  };

  const fmtCounters = c => {
    const obj = (typeof c.counters === 'object' && c.counters) ? c.counters : {};
    const entries = Object.entries(obj).filter(([, v]) => v > 0);
    if (!entries.length) return '';
    return entries.map(([t, n]) =>
      t === '+1/+1' ? `[+${n}/+${n}]` : t === '-1/-1' ? `[-${n}/-${n}]` : `[${n}x${t}]`
    ).join('');
  };

  // Opponent battlefield — no UIDs, hand is hidden
  const fmtOppBF = cards => {
    if (cards.length === 0) return '-';
    const attMap = buildAttMap(cards);
    const attachedIds = new Set(cards.filter(c => c.attachedTo).map(c => c.id));
    return cards.filter(c => !attachedIds.has(c.id)).map(c => {
      let s = c.name;
      if (c.tapped) s += '[T]';
      s += fmtCounters(c);
      if (attMap[c.id]) s += `[+${attMap[c.id].map(a => a.name).join('+')}]`;
      return s;
    }).join(',');
  };

  // Claude's battlefield — with UIDs
  const fmtCldBF = cards => {
    if (cards.length === 0) return '-';
    const attMap = buildAttMap(cards);
    const attachedIds = new Set(cards.filter(c => c.attachedTo).map(c => c.id));
    return cards.filter(c => !attachedIds.has(c.id)).map(c => {
      let s = `#${c.uid}:${c.name}`;
      if (c.tapped) s += '[T]';
      s += fmtCounters(c);
      if (attMap[c.id]) s += `[+${attMap[c.id].map(a => `#${a.uid}:${a.name}`).join('+')}]`;
      return s;
    }).join(',');
  };

  const fmtZone = (cards, uid) =>
    cards.length === 0 ? '-' : cards.map(c => uid ? `#${c.uid}:${c.name}` : c.name).join(',');

  const fmtCmd = (cards, uid) =>
    cards.length === 0 ? 'CAST' : cards.map(c => uid ? `#${c.uid}:${c.name}` : c.name).join('+');

  const logLines = state.actionLog.length > 0
    ? state.actionLog.map(logToTOON)
    : ['-'];

  return [
    `[[T${state.turn}|${phaseCode}|${act}]]`,
    `[[OPP|L:${p.life}|H:${p.hand.length}|LIB:${p.library.length}|CMD:${fmtCmd(p.commandZone, false)}|CDMG:${state.cmdDmg['opp-to-me']}|GY:${fmtZone(p.graveyard, false)}|EX:${fmtZone(p.exile, false)}]]`,
    `[[OPP_BF|${fmtOppBF(p.battlefield)}]]`,
    `[[CLD|L:${o.life}|LIB:${o.library.length}|CMD:${fmtCmd(o.commandZone, true)}|CDMG:${state.cmdDmg['me-to-opp']}|GY:${fmtZone(o.graveyard, true)}|EX:${fmtZone(o.exile, true)}]]`,
    `[[CLD_H|${fmtZone(o.hand, true)}]]`,
    `[[CLD_BF|${fmtCldBF(o.battlefield)}]]`,
    `[[POOL:0]]`,
    `[[LOG]]`,
    ...logLines,
  ].join('\n');
}

function downloadBoardState() {
  const text = generateBoardState();
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `board-turn-${state.turn}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  state.actionLog = [];
}

function copyBoardState() {
  const text = generateBoardState();
  navigator.clipboard.writeText(text).then(() => {
    state.actionLog = [];
    const btn = document.querySelector('#modal-container .btn-primary');
    if (btn) { btn.textContent = '✓ Copied!'; setTimeout(() => btn.textContent = '📋 Copy', 2000); }
  });
}

// ─── KEYBOARD SHORTCUTS ───────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeModal(); closeCtxMenu(); }
  if (e.key === 'n' && !e.ctrlKey && !e.metaKey && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') nextPhase();
});

// ─── DECK FILE PERSISTENCE ────────────────────────────────────────────────────
async function seedDecksFromFile() {
  if (state.decks.length > 0) return; // localStorage already has decks
  try {
    const res = await fetch('./assets/decks.json');
    if (!res.ok) return;
    const decks = await res.json();
    if (!Array.isArray(decks) || decks.length === 0) return;
    state.decks = decks;
    saveDecks();
    renderDecks();
    showToast(`Loaded ${decks.length} decks from repo.`, 'success');
  } catch (e) {
    // No decks.json yet — fresh install, that's fine
  }
}

function exportDecks() {
  if (state.decks.length === 0) { showToast('No decks to export.'); return; }
  const data = JSON.stringify(state.decks.map(d => ({ name: d.name, list: d.list })), null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'decks.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Saved! Place decks.json in your assets/ folder and commit it.', 'success');
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
render();
seedDecksFromFile();
