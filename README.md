# V MUSIC

Static site (no build step). Open through any web server or deploy the folder as-is (Vercel, Netlify, GitHub Pages).

    index.html          page markup
    css/styles.css      all styles
    js/app.js           player, library, playlists, lyrics, visualizer, settings, account, i18n (EN/UZ)
    js/fullshow.js      "Full animation": fullscreen WebGL show driven by the live audio
    js/pip.js           floating animation window (Picture-in-Picture)
    js/welcome.js       first-visit sign-up screen
    js/i18n-extra.js    extra Uzbek strings
    assets/             logo, wordmark, favicon

Notes: accounts and playlists are stored in the browser only (localStorage). The floating window opens
with its button in the Visualizer tab; Chrome/Edge can also open it automatically when you switch tabs.

## Auto-find lyrics and cover (AI)
`api/identify.js` is a Vercel serverless function. After you upload a track the page reads its tags and embedded cover,
then calls `/api/identify`: Claude cleans the name into artist + title (set `ANTHROPIC_API_KEY` in Vercel; without it a simple
parser is used), iTunes Search returns the original cover, LRCLIB returns synced lyrics. Results are cached in the browser.

## How a track is identified (in order)
1. Tags and embedded cover inside the file.
2. `/api/identify`: Claude turns the file name into artist + title, iTunes gives the original cover, LRCLIB gives synced lyrics.
3. `/api/listen`: if step 2 finds nothing, a 12 s clip is sent to AudD to recognise the song, then cover and lyrics are looked up again.
4. `/api/transcribe`: if there are still no lyrics, the song is cut into 45 s chunks and OpenAI Whisper writes timed lyrics (AI transcription, may contain mistakes).
Settings -> "Service status" shows which of the three keys the server can see. Claude itself cannot hear audio, so listening uses AudD and Whisper.

## Built-in songs
`js/library.js` loads the two songs in `assets/music/` (AAC, `.m4a`). On the first visit the site looks up their synced lyrics
(and the original cover of "Детство") and caches them in the browser. Add more songs by adding entries to `LIB` in `js/library.js`.

## Full animation
`js/fullshow.js`: a liquid-glass card with the cover, title and synced lyrics over a WebGL liquid. Beats are detected from the
spectrum (spectral flux) and drive ripples, blob size, cover glow and the card pulse.

## Finding lyrics and covers (all free paths)
Order: tags/embedded cover -> /api/identify (if deployed) -> browser lookups with no keys (js/lookup.js):
covers from iTunes, Deezer, MusicBrainz + Cover Art Archive; lyrics from LRCLIB, then lyrics.ovh -> if still no lyrics,
free AI in the browser (js/identify.js, `browserAsr`): Whisper (transformers.js) downloads ~80 MB once and writes timed lyrics.
Optional server keys (api/): ANTHROPIC_API_KEY, AUDD_API_TOKEN, OPENAI_API_KEY. No lyrics are bundled with the site.

## Full animation modes
`words`: cover as a liquid wallpaper, clock, and every sung word appears as a node of a constellation (press M or the sparkle button to switch).
`glass`: liquid-glass card with cover, title and synced lyrics.

## Languages
English, Oʻzbekcha, Русский (`js/app.js` holds the Uzbek strings, `js/i18n-extra.js` more Uzbek, `js/i18n-ru.js` Russian). Strings are keyed by their English text.

## Mini player (Dynamic Island)
`js/pip.js`: iOS Dynamic Island style player in a Picture-in-Picture window: a small pill (cover, title, equalizer, play) that grows into the
full player (cover, title, artist, time, seek, previous/pause/next) when you hover it. In Chrome/Edge it opens by itself when you leave the site while
music plays and asks the browser to place it at the top centre of the screen (Settings -> "Mini player opens when I leave"). Browsers only allow
resizing/moving that window after a click inside it, so if hover alone does not grow it, click the pill once.

## Saved songs
`js/persist.js` stores songs you add (file, cover, title/artist) in IndexedDB, so they are still in the library after you close the site.
Playlists and favorites refer to them by key, and Settings -> "Clear saved data" removes them too.

## Free AI listening
`js/asr-worker.js` runs Whisper in a Web Worker (the page stays responsive), one track at a time, only on devices with 4+ CPU threads and no data-saver.

## v10: what changed
- **Next song plays by itself.** When a song ends the next one starts. Repeat now starts on "Repeat all", so the list also loops back to the first song after the last one (tap Repeat to switch to "off" or "one"). A file that cannot play is skipped while auto-advancing.
- **Glass dropdowns.** `js/select.js` replaces the browser's own list on every select (language, visualizer style, playback speed, the ⋯ track menu, the welcome screen). The select keeps its value and `change` event, so nothing else had to change. Works with mouse, touch and keyboard (arrows, Enter, Esc).
- **Liquid-glass clock.** `clockGlass()` in `js/fullshow.js` paints frosted digits with a lit rim, a cool refracted edge, a diagonal reflection and a soft shadow. The date is formatted by hand for Uzbek (the browser returned "M11 22, Sun").
- **Installable app (PWA).** `manifest.webmanifest`, `sw.js` and `js/pwa.js`. Chrome/Edge/Android show **Settings -> Install app**; on iPhone/iPad use Share -> Add to Home Screen. After install it opens in its own window and works offline (the built-in songs are saved after the first play).
  A service worker only runs on **https** (Vercel/Netlify/GitHub Pages are fine) or on `localhost`, not when you open `index.html` from a file. After you deploy a new version, bump `V` in `sw.js` so phones drop the old cache.

## v11
Clock restyled after the iOS 26 lock screen: rounded wide digits (SF Pro Rounded on Apple devices, Nunito elsewhere), clear glass with a thick light bevel on every edge and round colon dots.
