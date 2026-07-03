# Finding Cila & Zoro 🐾

A cute, mobile-first memory-match PWA starring two real cats, Cila & Zoro.
Pure HTML/CSS/vanilla JS — no build step, no frameworks.

## Run it

Any static server works, e.g.:

```
python3 -m http.server 8080
```

Then open `http://localhost:8080` on your phone or desktop.
(Opening `index.html` directly via `file://` will mostly work too, except
the service worker — that needs `http://` or `https://`.)

To install as an app: open the site in Chrome (Android) or Safari (iPhone,
via Share → Add to Home Screen).

## Customize

- **Photos** — edit the `PHOTOS` array at the top of `js/app.js`. Each entry
  is `{ src, name }`; swap the paths in `assets/photos/` for your own images.
  Keep exactly 8 entries (8 pairs = 16 cards).
- **Text / dialogues** — the `IDLE_DIALOGUES` array in `js/app.js`, plus the
  copy directly in `index.html`.
- **Colors** — all in the `:root` block at the top of `css/style.css`.
- **Sounds** — synthesized in `js/sounds.js` via the Web Audio API, so there
  are no audio files to replace; tweak the frequencies/durations there.
- **Icons** — regenerate `assets/icons/*.png` with your own artwork at the
  same sizes (192, 512, 512 maskable, 180 apple-touch, 32 favicon).

## Note on the photo set

Two of the source photos you provided (`cila1.jpg` / `cila2.jpg`) were
identical images, so right now the deck has one repeated pair rather than
8 fully distinct photos. The game still works fine — just swap in a fresh
8th photo of Cila in `assets/photos/cila2.jpg` (or update the path in
`PHOTOS`) whenever you have one.

## Structure

```
index.html          Markup for all 3 screens (welcome, game, win) + modal
css/style.css        All styling, design tokens, animations
js/app.js             Game logic (state, board, matching, timer, win, PWA init)
js/sounds.js          Tiny synthesized sound effects (no audio files)
manifest.json         PWA manifest
sw.js                  Service worker (offline cache-first)
assets/photos/         The 8 game photos
assets/icons/           App icons
```
