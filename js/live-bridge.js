// ─── LIVE BRIDGE ─────────────────────────────────────────────────────────────
// Sends board state to a local WebSocket server on every game action.
// Degrades gracefully if the server isn't running.
// Load AFTER main.js (needs generateBoardState).

(function () {
  const WS_URL = 'ws://localhost:8765';
  const DEBOUNCE_MS = 300;
  const RECONNECT_MS = 5000;

  let ws = null;
  let sendTimer = null;
  let statusEl = null;

  // ── Status indicator ────────────────────────────────────────────────
  function initStatusDot() {
    statusEl = document.getElementById('live-status');
    updateStatus(false);
  }

  function updateStatus(connected) {
    if (!statusEl) return;
    statusEl.style.background = connected ? '#4caf50' : '#666';
    statusEl.title = connected ? 'Live bridge: connected' : 'Live bridge: disconnected';
  }

  // ── WebSocket connection ────────────────────────────────────────────
  function connect() {
    try {
      ws = new WebSocket(WS_URL);
    } catch (e) {
      scheduleReconnect();
      return;
    }

    ws.onopen = function () {
      updateStatus(true);
      // Send current state immediately on connect
      doSend();
    };

    ws.onmessage = function (event) {
      handleDecksPush(event.data);
    };

    ws.onclose = function () {
      updateStatus(false);
      ws = null;
      scheduleReconnect();
    };

    ws.onerror = function () {
      // onclose will fire after this — reconnect handled there
    };
  }

  function scheduleReconnect() {
    setTimeout(connect, RECONNECT_MS);
  }

  // ── Debounced send ──────────────────────────────────────────────────
  function scheduleLiveSend() {
    clearTimeout(sendTimer);
    sendTimer = setTimeout(doSend, DEBOUNCE_MS);
  }

  function doSend() {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    if (typeof generateBoardState !== 'function') return;
    try {
      ws.send(generateBoardState());
    } catch (e) {
      // Silent fail — don't break the tracker
    }
  }

  // ── Deck push (disk → browser) ──────────────────────────────────────
  // On connect the server sends assets/decks.json ([[DECKS_PUSH|...]]).
  // The disk copy wins for every deck it knows (Claude edits that file
  // directly — retired flags, list swaps). Browser-only decks are new
  // imports made while offline: keep them and echo the merged set back
  // so the file picks them up. This is what stops a stale localStorage
  // copy from clobbering decks.json.
  function handleDecksPush(data) {
    if (typeof data !== 'string') return;
    const m = data.match(/^\[\[DECKS_PUSH\|([\s\S]+)\]\]$/);
    if (!m) return;
    let diskDecks;
    try {
      diskDecks = JSON.parse(m[1]);
    } catch (e) { return; }
    if (!Array.isArray(diskDecks) || diskDecks.length === 0) return;
    const diskNames = new Set(diskDecks.map(d => d.name));
    const browserOnly = state.decks.filter(d => !diskNames.has(d.name));
    state.decks = diskDecks.concat(browserOnly);
    localStorage.setItem('mtg-decks', JSON.stringify(state.decks.map(d => ({ ...d }))));
    if (typeof renderDecks === 'function') renderDecks();
    if (browserOnly.length > 0) window.liveBridgeSendDecks();
  }

  // ── Deck sync ───────────────────────────────────────────────────────
  // Mirrors state.decks to assets/decks.json on disk via the bridge server.
  // Called from saveDecks(); returns true if the payload was sent.
  window.liveBridgeSendDecks = function () {
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    try {
      const decks = state.decks.map(d => ({ ...d }));  // keep "retired" etc.
      ws.send('[[DECKS|' + JSON.stringify(decks) + ']]');
      return true;
    } catch (e) {
      return false;
    }
  };

  // ── Hook render functions ───────────────────────────────────────────
  // Every meaningful state change ends with a render call.
  // Wrap them all; debounce collapses bursts into one send.
  const hooks = [
    'render',
    'renderLifeTotals',
    'renderBattlefield',
    'renderHand',
    'renderOppHand',
    'renderZoneCounts',
    'renderPhase',
    'showToast',  // catches shuffle (shuffleLibrary toasts but never renders) and other
                  // render-less mutations; debounce makes redundant/error toasts harmless
  ];

  hooks.forEach(function (name) {
    if (typeof window[name] !== 'function') return;
    const original = window[name];
    window[name] = function () {
      const result = original.apply(this, arguments);
      scheduleLiveSend();
      return result;
    };
  });

  // ── Init ────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initStatusDot();
      connect();
    });
  } else {
    initStatusDot();
    connect();
  }
})();
