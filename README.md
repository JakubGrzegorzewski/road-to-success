# Droga do sukcesu

Aplikacja do planowania i prowadzenia prób na stopnie harcerskie i instruktorskie. Działa na telefonie i komputerze, także offline (PWA). Generuje PDF próby i synchronizuje dane między urządzeniami (np. opiekun ↔ podopieczny) bez przechowywania ich na serwerze.

- Plan architektury: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Co zostało zrobione i czym różni się od planu: [docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md)

## W skrócie

- **Local-first.** Wszystkie dane są w jednym dokumencie [Yjs](https://yjs.dev) zapisanym w IndexedDB przeglądarki (`y-indexeddb`). Każde urządzenie ma pełną kopię.
- **Synchronizacja P2P.** `y-webrtc` łączy urządzenia bezpośrednio przez WebRTC. Ruch jest szyfrowany kluczem z linku do pokoju, a link nie trafia na serwer (klucz jest w części `#…` adresu).
- **Serwer bez danych.** Cloudflare Worker serwuje statyczną aplikację, pomaga urządzeniom się odnaleźć (`/signal`, Durable Object) i wydaje krótkotrwałe poświadczenia TURN (`/api/turn`). Niczego nie zapisuje.
- **Kopie zapasowe.** Plik `.rts` (aktualizacja Yjs). Import scala dane, niczego nie nadpisuje.
- **PDF z danych.** `pdfmake` (ładowany na żądanie). Na telefonie plik trafia do arkusza udostępniania, na komputerze jest pobierany.

## Uruchomienie lokalne

```bash
npm install
npm run dev          # Vite, http://localhost:5173 — bez serwera sygnalizacyjnego (sync nie połączy urządzeń)
npm run worker:dev   # build + wrangler dev, http://localhost:8787 — pełna aplikacja z /signal i /api/turn
```

Synchronizacja wymaga bezpiecznego kontekstu (HTTPS albo `localhost`). Żeby używać Vite i Workera jednocześnie, uruchom `npx wrangler dev` w osobnym terminalu i ustaw `VITE_SIGNALING_URL=ws://localhost:8787/signal` (np. w `.env.local`) oraz `ALLOWED_ORIGINS=http://localhost:5173` w `.dev.vars`.

## Testy

```bash
npm run typecheck    # vue-tsc (aplikacja), tsc (configi), tsc (worker)
npm test             # Vitest: fasady na Y.Doc, migracja z Dexie, scalanie, eksport/import, PDF, worker
npm run build
npm run test:worker  # prawdziwy Worker + Durable Object w lokalnym workerd (po buildzie)
npm run test:e2e     # Playwright: telefon 360 px, PDF, kopia zapasowa, synchronizacja dwóch przeglądarek
npm run verify       # typecheck + test + build + test:worker
```

Przed pierwszym `test:e2e`: `npx playwright install chromium`.

## Wdrożenie (Cloudflare)

Jedna ścieżka: statyczna aplikacja i Worker w jednym projekcie (`wrangler.jsonc`).

```bash
npx wrangler login
npm run deploy                     # vite build + wrangler deploy
```

GitHub Actions (`.github/workflows/deploy.yml`) na każdym pushu i PR uruchamia typecheck, testy, build, test Workera i E2E. Po pushu do `main` wdraża aplikację, jeśli repozytorium ma sekrety `CLOUDFLARE_API_TOKEN` i `CLOUDFLARE_ACCOUNT_ID`.

### TURN (łączenie przez sieci komórkowe)

Bez TURN urządzenia łączą się bezpośrednio (STUN). To zwykle działa w jednej sieci Wi-Fi, ale często zawodzi między LTE a Wi-Fi. W produkcji skonfiguruj jednego dostawcę:

| Dostawca | Konfiguracja |
|---|---|
| Cloudflare Realtime TURN | `npx wrangler secret put TURN_KEY_ID` i `npx wrangler secret put TURN_KEY_API_TOKEN` |
| coturn (`use-auth-secret`) | `npx wrangler secret put TURN_SHARED_SECRET` oraz zmienna `TURN_URLS` w `wrangler.jsonc`, np. `turn:turn.example.org:3478,turns:turn.example.org:5349` |

Czas ważności poświadczeń ustawia `TURN_TTL` (sekundy, domyślnie 4 h).

## Dane i prywatność

- Dane (także osobowe podopiecznych) są tylko na urządzeniach użytkowników. Serwer widzi wyłącznie zaszyfrowane wiadomości sygnalizacyjne.
- Link do pokoju daje pełny dostęp (odczyt i zapis). „Zmień pokój” w ekranie Synchronizacja tworzy nowy pokój i klucz, czyli odbiera dostęp urządzeniom ze starym linkiem.
- Dane z wersji 1.x (Dexie, baza `RoadSuccessDB`) są przenoszone automatycznie przy pierwszym uruchomieniu. Stara baza zostaje jako kopia zapasowa.
- Gdy wszystkie urządzenia zginą, dane znikną. Aplikacja przypomina o kopii `.rts` co 14 dni.

## Struktura

```
src/
  scripts/
    store/      Y.Doc, IndexedDB, zdarzenia, migracja z Dexie, synchronizacja kart
    database/   fasady: User, RankInProgress, Task, TaskComment (Yjs) oraz Rank, Requirement (statyczny JSON)
    sync/       pokój i link, y-webrtc, serwery ICE
    export/     kopie .rts / JSON
    pdf/        widok-model, pdfmake, przekazanie pliku (share/download)
  views/        Próby, Próba, Dodaj osobę, Synchronizacja, Dołącz, Ustawienia
  assets/ranks/ ikony stopni i tła dokumentów A4
worker/         Cloudflare Worker: /signal (Durable Object), /api/turn
tests/          unit, worker, e2e
```
