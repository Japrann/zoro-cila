/* =========================================================================
   app.js — Finding Cila & Zoro memory match game
   Vanilla JS, no frameworks. Organized into small, focused sections so
   swapping photos / text / sounds later stays easy.
   ========================================================================= */

/* -------------------------------------------------------------------------
   1. CONTENT CONFIG — edit here to reskin the game
   ------------------------------------------------------------------------- */

// Replace these paths (and add/remove entries) to use different photos.
// Exactly 8 entries are expected — each becomes a matching pair (16 cards).
const PHOTOS = [
  { src: 'assets/photos/cila1.jpg', name: 'Cila' },
  { src: 'assets/photos/cila2.jpg', name: 'Cila' },
  { src: 'assets/photos/cila3.jpg', name: 'Cila' },
  { src: 'assets/photos/cila4.jpg', name: 'Cila' },
  { src: 'assets/photos/zoro1.jpg', name: 'Zoro' },
  { src: 'assets/photos/zoro2.jpg', name: 'Zoro' },
  { src: 'assets/photos/zoro3.jpg', name: 'Zoro' },
  { src: 'assets/photos/zoro4.jpg', name: 'Zoro' },
];

// Random idle dialogues — shown when the player pauses for a while.
const IDLE_DIALOGUES = [
  'Cila: Aku di sini... 😼',
  'Zoro: Salah kartu tuh.',
  'Cila: Fokus dong.',
  'Zoro: Meow.',
  'Masih nyari ya? 🤭',
  'Cila: Coba lagi deh~',
  'Zoro: Hampir ketemu tuh.',
];

const IDLE_DELAY_MIN = 12000;
const IDLE_DELAY_MAX = 15000;

/* -------------------------------------------------------------------------
   2. STATE
   ------------------------------------------------------------------------- */

const state = {
  deck: [],           // shuffled card data
  flipped: [],         // currently face-up, unmatched card elements
  matchedCount: 0,
  moves: 0,
  timerId: null,
  seconds: 0,
  locked: false,       // true while resolving a pair
  idleTimer: null,
  imagesReady: false,
};

/* -------------------------------------------------------------------------
   3. DOM REFERENCES
   ------------------------------------------------------------------------- */

const $ = (sel) => document.querySelector(sel);

const welcomeScreen = $('#welcomeScreen');
const gameScreen = $('#gameScreen');
const winScreen = $('#winScreen');
const startBtn = $('#startBtn');
const howToPlayBtn = $('#howToPlayBtn');
const howToModal = $('#howToModal');
const board = $('#board');
const matchCountEl = $('#matchCount');
const moveCountEl = $('#moveCount');
const timeCountEl = $('#timeCount');
const soundToggle = $('#soundToggle');
const restartBtn = $('#restartBtn');
const speechBubble = $('#speechBubble');
const progressTrail = $('#progressTrail');
const srAnnounce = $('#srAnnounce');

const collageEl = $('#collage');
const winMovesEl = $('#winMoves');
const winTimeEl = $('#winTime');
const winRatingEl = $('#winRating');
const playAgainBtn = $('#playAgainBtn');
const saveResultBtn = $('#saveResultBtn');

/* -------------------------------------------------------------------------
   4. UTILITIES
   ------------------------------------------------------------------------- */

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function vibrate(pattern) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

function announce(msg) {
  srAnnounce.textContent = msg;
}

/* -------------------------------------------------------------------------
   5. PRELOADING
   ------------------------------------------------------------------------- */

function preloadImages(list) {
  return Promise.all(
    list.map(
      (p) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = resolve;
          img.onerror = resolve; // don't block the game on a missing photo
          img.src = p.src;
        })
    )
  );
}

/* -------------------------------------------------------------------------
   6. BACKGROUND DECORATION (ambient paw prints + glow particles)
   ------------------------------------------------------------------------- */

function seedAmbientDecoration() {
  const pawTrail = $('#pawTrail');
  const glowParticles = $('#glowParticles');
  const PAW_COUNT = 7;
  const GLOW_COUNT = 10;

  for (let i = 0; i < PAW_COUNT; i++) {
    const span = document.createElement('span');
    span.style.left = `${Math.random() * 100}%`;
    span.style.bottom = `${-10 - Math.random() * 20}%`;
    span.style.animationDelay = `${Math.random() * 12}s`;
    span.style.animationDuration = `${10 + Math.random() * 8}s`;
    pawTrail.appendChild(span);
  }

  for (let i = 0; i < GLOW_COUNT; i++) {
    const span = document.createElement('span');
    span.style.left = `${Math.random() * 100}%`;
    span.style.top = `${20 + Math.random() * 70}%`;
    span.style.animationDelay = `${Math.random() * 7}s`;
    span.style.animationDuration = `${5 + Math.random() * 4}s`;
    glowParticles.appendChild(span);
  }
}

/* -------------------------------------------------------------------------
   7. PROGRESS TRAIL (signature paw-print progress element)
   ------------------------------------------------------------------------- */

function buildProgressTrail() {
  progressTrail.innerHTML = '';
  for (let i = 0; i < PHOTOS.length; i++) {
    const span = document.createElement('span');
    span.className = 'paw';
    span.textContent = '🐾';
    progressTrail.appendChild(span);
  }
}

function updateProgressTrail(foundCount) {
  const paws = progressTrail.querySelectorAll('.paw');
  paws.forEach((p, i) => {
    p.classList.toggle('found', i < foundCount);
  });
}

/* -------------------------------------------------------------------------
   8. BOARD BUILDING
   ------------------------------------------------------------------------- */

function buildDeck() {
  const pairs = PHOTOS.flatMap((photo, idx) => [
    { pairId: idx, ...photo },
    { pairId: idx, ...photo },
  ]);
  return shuffle(pairs);
}

function createCardElement(card, index) {
  const cardEl = document.createElement('div');
  cardEl.className = 'card';
  cardEl.dataset.pairId = card.pairId;
  cardEl.dataset.index = index;
  cardEl.setAttribute('role', 'gridcell');
  cardEl.setAttribute('tabindex', '0');
  cardEl.setAttribute('aria-label', 'Kartu tertutup');

  cardEl.innerHTML = `
    <div class="card__inner">
      <div class="card__face card__face--back">
        <span class="paw-icon">🐾</span>
      </div>
      <div class="card__face card__face--front">
        <img alt="${card.name}" loading="lazy" src="${card.src}">
      </div>
    </div>
  `;

  const img = cardEl.querySelector('img');
  img.addEventListener('load', () => img.classList.add('loaded'));
  if (img.complete) img.classList.add('loaded');

  cardEl.addEventListener('click', () => onCardTap(cardEl));
  cardEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onCardTap(cardEl);
    }
  });

  return cardEl;
}

function renderBoard() {
  board.innerHTML = '';
  state.deck.forEach((card, i) => {
    board.appendChild(createCardElement(card, i));
  });
}

/* -------------------------------------------------------------------------
   9. GAMEPLAY LOGIC
   ------------------------------------------------------------------------- */

function onCardTap(cardEl) {
  if (state.locked) return;
  if (cardEl.classList.contains('flipped') || cardEl.classList.contains('matched')) return;

  resetIdleTimer();
  flipCard(cardEl);
  GameSounds.flip();

  state.flipped.push(cardEl);

  if (state.flipped.length === 2) {
    state.moves++;
    moveCountEl.textContent = state.moves;
    state.locked = true;
    checkMatch();
  }
}

function flipCard(cardEl) {
  cardEl.classList.add('flipped');
  cardEl.setAttribute('aria-label', 'Kartu terbuka');
}

function unflipCard(cardEl) {
  cardEl.classList.remove('flipped');
  cardEl.setAttribute('aria-label', 'Kartu tertutup');
}

function checkMatch() {
  const [a, b] = state.flipped;
  const isMatch = a.dataset.pairId === b.dataset.pairId;

  if (isMatch) {
    setTimeout(() => resolveMatch(a, b), 260);
  } else {
    setTimeout(() => resolveWrong(a, b), 700);
  }
}

function resolveMatch(a, b) {
  a.classList.add('matched');
  b.classList.add('matched');
  a.setAttribute('aria-label', `Cocok: ${a.querySelector('img').alt}`);
  b.setAttribute('aria-label', `Cocok: ${b.querySelector('img').alt}`);

  spawnSparkles(a);
  spawnSparkles(b);
  spawnMeowPopup(b);

  GameSounds.match();
  vibrate(30);
  announce('Cocok!');

  state.matchedCount++;
  matchCountEl.textContent = state.matchedCount;
  updateProgressTrail(state.matchedCount);

  state.flipped = [];
  state.locked = false;

  if (state.matchedCount === PHOTOS.length) {
    setTimeout(finishGame, 650);
  }
}

function resolveWrong(a, b) {
  a.classList.add('wrong');
  b.classList.add('wrong');
  GameSounds.wrong();
  announce('Belum cocok, coba lagi.');

  setTimeout(() => {
    a.classList.remove('wrong');
    b.classList.remove('wrong');
    unflipCard(a);
    unflipCard(b);
    state.flipped = [];
    state.locked = false;
  }, 260);
}

function spawnSparkles(cardEl) {
  const count = 5;
  for (let i = 0; i < count; i++) {
    const s = document.createElement('span');
    s.className = 'sparkle';
    s.textContent = '✨';
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const dist = 26 + Math.random() * 18;
    s.style.setProperty('--sx', `${Math.cos(angle) * dist}px`);
    s.style.setProperty('--sy', `${Math.sin(angle) * dist}px`);
    s.style.left = '50%';
    s.style.top = '50%';
    s.style.animationDelay = `${Math.random() * 0.1}s`;
    cardEl.appendChild(s);
    s.addEventListener('animationend', () => s.remove());
  }
}

function spawnMeowPopup(cardEl) {
  const popup = document.createElement('div');
  popup.className = 'meow-popup';
  popup.textContent = 'Meow! 🐾';
  cardEl.appendChild(popup);
  popup.addEventListener('animationend', () => popup.remove());
}

/* -------------------------------------------------------------------------
   10. TIMER
   ------------------------------------------------------------------------- */

function startTimer() {
  stopTimer();
  state.seconds = 0;
  timeCountEl.textContent = formatTime(0);
  state.timerId = setInterval(() => {
    state.seconds++;
    timeCountEl.textContent = formatTime(state.seconds);
  }, 1000);
}

function stopTimer() {
  if (state.timerId) clearInterval(state.timerId);
  state.timerId = null;
}

/* -------------------------------------------------------------------------
   11. IDLE DIALOGUE
   ------------------------------------------------------------------------- */

function resetIdleTimer() {
  clearTimeout(state.idleTimer);
  hideSpeechBubble();
  const delay = IDLE_DELAY_MIN + Math.random() * (IDLE_DELAY_MAX - IDLE_DELAY_MIN);
  state.idleTimer = setTimeout(showRandomDialogue, delay);
}

function showRandomDialogue() {
  if (gameScreen.hidden) return;
  const line = IDLE_DIALOGUES[Math.floor(Math.random() * IDLE_DIALOGUES.length)];
  speechBubble.textContent = line;
  speechBubble.classList.add('show');
  setTimeout(() => {
    hideSpeechBubble();
    state.idleTimer = setTimeout(showRandomDialogue, IDLE_DELAY_MIN + Math.random() * (IDLE_DELAY_MAX - IDLE_DELAY_MIN));
  }, 4000);
}

function hideSpeechBubble() {
  speechBubble.classList.remove('show');
}

/* -------------------------------------------------------------------------
   12. SCREEN TRANSITIONS
   ------------------------------------------------------------------------- */

function showScreen(el) {
  [welcomeScreen, gameScreen, winScreen].forEach((s) => {
    s.hidden = s !== el;
  });
}

async function startGame() {
  GameSounds.pop();

  if (!state.imagesReady) {
    startBtn.disabled = true;
    startBtn.textContent = 'Menyiapkan foto...';
    await preloadImages(PHOTOS);
    state.imagesReady = true;
    startBtn.disabled = false;
    startBtn.innerHTML = 'Start Finding <span aria-hidden="true">🐈</span>';
  }

  welcomeScreen.classList.add('no-select');
  document.body.classList.add('no-select');

  resetGameState();
  showScreen(gameScreen);
  startTimer();
  resetIdleTimer();
}

function resetGameState() {
  state.deck = buildDeck();
  state.flipped = [];
  state.matchedCount = 0;
  state.moves = 0;
  state.locked = false;

  matchCountEl.textContent = '0';
  moveCountEl.textContent = '0';
  timeCountEl.textContent = '00:00';

  buildProgressTrail();
  renderBoard();
}

function finishGame() {
  stopTimer();
  clearTimeout(state.idleTimer);
  hideSpeechBubble();
  GameSounds.victory();
  vibrate([30, 60, 30, 60, 60]);

  buildCollage();
  winMovesEl.textContent = state.moves;
  winTimeEl.textContent = formatTime(state.seconds);
  winRatingEl.textContent = rateGame(state.moves);

  showScreen(winScreen);
  launchConfetti();
}

function rateGame(moves) {
  if (moves < 20) return '★★★★★';
  if (moves <= 24) return '★★★★☆';
  if (moves <= 30) return '★★★☆☆';
  return '★★☆☆☆';
}

function buildCollage() {
  collageEl.innerHTML = '';
  PHOTOS.forEach((p) => {
    const img = document.createElement('img');
    img.src = p.src;
    img.alt = p.name;
    collageEl.appendChild(img);
  });
}

/* -------------------------------------------------------------------------
   13. CONFETTI (lightweight canvas particle burst)
   ------------------------------------------------------------------------- */

function launchConfetti() {
  const canvas = $('#confettiCanvas');
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  const colors = ['#F0A25C', '#FFD37E', '#8A6748', '#FBD9AE', '#FFFFFF'];
  const pieces = Array.from({ length: 90 }, () => ({
    x: Math.random() * window.innerWidth,
    y: -20 - Math.random() * window.innerHeight * 0.5,
    w: 6 + Math.random() * 6,
    h: 8 + Math.random() * 8,
    color: colors[Math.floor(Math.random() * colors.length)],
    speedY: 2 + Math.random() * 2.5,
    speedX: -1.2 + Math.random() * 2.4,
    rot: Math.random() * 360,
    rotSpeed: -8 + Math.random() * 16,
  }));

  let frame = 0;
  const maxFrames = 220;

  function draw() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    pieces.forEach((p) => {
      p.x += p.speedX;
      p.y += p.speedY;
      p.rot += p.rotSpeed;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    frame++;
    if (frame < maxFrames) {
      requestAnimationFrame(draw);
    } else {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
  }
  draw();

  window.addEventListener('resize', resize, { once: true });
}

/* -------------------------------------------------------------------------
   14. SAVE RESULT (renders a shareable PNG card)
   ------------------------------------------------------------------------- */

function saveResult() {
  GameSounds.pop();
  const W = 640, H = 800;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // background
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#FBF3E6');
  grad.addColorStop(1, '#F3E4CC');
  ctx.fillStyle = grad;
  roundRect(ctx, 0, 0, W, H, 28);
  ctx.fill();

  ctx.fillStyle = '#4A3A2A';
  ctx.textAlign = 'center';
  ctx.font = '600 34px Fredoka, sans-serif';
  ctx.fillText('🐾 Finding Cila & Zoro', W / 2, 90);

  ctx.font = '700 22px Fredoka, sans-serif';
  ctx.fillStyle = '#DE8438';
  ctx.fillText('You found them!', W / 2, 130);

  // photo grid
  const gridSize = 4;
  const cell = 128;
  const gap = 10;
  const gridW = gridSize * cell + (gridSize - 1) * gap;
  const startX = (W - gridW) / 2;
  const startY = 170;

  let loaded = 0;
  const imgs = PHOTOS.map((p) => {
    const im = new Image();
    im.crossOrigin = 'anonymous';
    im.src = p.src;
    return im;
  });

  Promise.all(
    imgs.map(
      (im) =>
        new Promise((res) => {
          if (im.complete) return res();
          im.onload = res;
          im.onerror = res;
        })
    )
  ).then(() => {
    imgs.forEach((im, i) => {
      const col = i % gridSize;
      const row = Math.floor(i / gridSize);
      const x = startX + col * (cell + gap);
      const y = startY + row * (cell + gap);
      ctx.save();
      roundRect(ctx, x, y, cell, cell, 14);
      ctx.clip();
      try {
        drawImageCover(ctx, im, x, y, cell, cell);
      } catch (e) {
        ctx.fillStyle = '#EDDFC4';
        ctx.fillRect(x, y, cell, cell);
      }
      ctx.restore();
    });

    // stats
    const statsY = startY + 2 * (cell + gap) + 60;
    ctx.font = '700 20px Nunito, sans-serif';
    ctx.fillStyle = '#4A3A2A';
    ctx.textAlign = 'left';
    const statsX = startX;
    ctx.fillText(`⭐ Moves: ${state.moves}`, statsX, statsY);
    ctx.fillText(`⏱ Time: ${formatTime(state.seconds)}`, statsX, statsY + 34);
    ctx.fillText(`🏆 Rating: ${rateGame(state.moves)}`, statsX, statsY + 68);

    ctx.textAlign = 'center';
    ctx.font = '600 15px Nunito, sans-serif';
    ctx.fillStyle = '#8A6748';
    ctx.fillText('Cila & Zoro udah nggak sembunyi lagi 🐈🤍', W / 2, H - 30);

    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'finding-cila-zoro-result.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    });
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawImageCover(ctx, img, x, y, w, h) {
  const iw = img.naturalWidth || 1;
  const ih = img.naturalHeight || 1;
  const scale = Math.max(w / iw, h / ih);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (iw - sw) / 2;
  const sy = (ih - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

/* -------------------------------------------------------------------------
   15. EVENT WIRING
   ------------------------------------------------------------------------- */

startBtn.addEventListener('click', startGame);

howToPlayBtn.addEventListener('click', () => {
  GameSounds.pop();
  howToModal.hidden = false;
});

document.querySelectorAll('[data-close-modal]').forEach((el) => {
  el.addEventListener('click', () => {
    howToModal.hidden = true;
  });
});

soundToggle.addEventListener('click', () => {
  const nowOn = soundToggle.getAttribute('aria-pressed') === 'false';
  soundToggle.setAttribute('aria-pressed', String(nowOn));
  GameSounds.setMuted(!nowOn);
  if (nowOn) GameSounds.pop();
});

restartBtn.addEventListener('click', () => {
  GameSounds.pop();
  stopTimer();
  clearTimeout(state.idleTimer);
  resetGameState();
  startTimer();
  resetIdleTimer();
});

playAgainBtn.addEventListener('click', () => {
  GameSounds.pop();
  resetGameState();
  showScreen(gameScreen);
  startTimer();
  resetIdleTimer();
});

saveResultBtn.addEventListener('click', saveResult);

// Prevent accidental double-tap zoom on iOS
let lastTouchEnd = 0;
document.addEventListener(
  'touchend',
  (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) e.preventDefault();
    lastTouchEnd = now;
  },
  { passive: false }
);

/* -------------------------------------------------------------------------
   16. INIT
   ------------------------------------------------------------------------- */

seedAmbientDecoration();

// Kick off a low-priority preload as soon as the page loads so the
// "Start Finding" tap feels instant even on the first visit.
window.addEventListener('load', () => {
  preloadImages(PHOTOS).then(() => {
    state.imagesReady = true;
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {
      /* offline support is a bonus, not a requirement */
    });
  }
});
