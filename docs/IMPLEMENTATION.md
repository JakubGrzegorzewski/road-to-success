# Road To Success 2.0 – stan wdrożenia planu architektury

Data: 2026-10-18 · Plan: [ARCHITECTURE.md](ARCHITECTURE.md)

Zrobione: **fazy 1–5**. Poza zakresem, zgodnie z planem: faza 6 (załączniki) i opcjonalny „peer zawsze włączony”.

## Decyzje z sekcji „Do ustalenia”

| Pytanie | Decyzja w kodzie |
|---|---|
| Dostawca TURN | Obaj. `/api/turn` używa Cloudflare Realtime TURN, gdy są `TURN_KEY_ID` + `TURN_KEY_API_TOKEN`, albo coturn (`TURN_SHARED_SECRET` + `TURN_URLS`). Bez konfiguracji: tylko STUN. |
| Peer always-on | Nie (wymagałby przechowywania danych na serwerze). |
| Role tylko do odczytu | Nie. Link = pełny dostęp, a podgląd tylko do odczytu to PDF lub eksport. |
| Domena | Bez znaczenia dla kodu: link i `/signal` biorą origin strony (`location`). |

## Faza 1 – mobile, PWA, PDF

- Zależności: usunięte `@vue/cli-plugin-pwa`, `register-service-worker`, `@vueuse/core` (tylko `useFavicon` z błędną ścieżką), `js-cookie` (zastąpione `localStorage`), `axios`, `express` i `react` (nieużywane; skrypt `start` wskazywał na nieistniejący `server.js`) oraz `gh-pages`. Dodane `vite-plugin-pwa`.
- PWA: manifest (`lang: pl`, `standalone`), ikony 192/512/maskable/apple-touch wygenerowane z `logo.svg` (`public/icons`), `viewport-fit=cover`, `theme-color`. Rejestracja przez `virtual:pwa-register` w `main.ts` (`autoUpdate`).
- `rank.json` (2,7 MB base64) zastąpiony przez `ranks.json` (9 KB) oraz pliki PNG w `src/assets/ranks/`. Workbox precache obejmuje JS (z pdfmake, więc PDF działa offline), CSS, czcionki i ikony. Tła A4 (5 × ~300 KB) trafiają do cache przy pierwszym użyciu.
- Układ: `useDisplay()` (telefon < 600 px), dolny pasek `v-bottom-navigation` na telefonie, górny pasek z linkami na komputerze, `100dvh`, `env(safe-area-inset-*)`, cele dotyku ≥ 44 px (`pointer: coarse`), popupy jako bottom-sheet na telefonie. Tabela wymagań w podglądzie od 960 px, poniżej karty. Wymagania w zadaniu na telefonie to lista z pełną treścią (nie ma hovera). Fragmenty idei zaznacza się stuknięciem w słowa.
- PDF: `pdf/advancementViewModel.ts` (czysta funkcja) jest wspólny dla podglądu na ekranie i PDF. Wspólny rdzeń wyróżnień idei to `getIdeaSegments()`. `pdf/buildAdvancementPdf.ts` ładuje `pdfmake` na żądanie, używa czcionki Roboto (polskie znaki, otwarta licencja) i dwóch układów (tabela wymagań / lista zadań). Tło stopnia (grafika A4) można włączyć w PDF. `pdf/deliverPdf.ts`: arkusz udostępniania na urządzeniach dotykowych → pobranie → iOS: nowa karta. Po wygaśnięciu gestu pojawia się dialog „Udostępnij / Pobierz”.
- `window.print()` i reguły `@media print` zostały jako przycisk „Drukuj” na komputerze. Zgodnie z planem są tymczasowe.

## Faza 2 – Yjs + UUID

- `store/doc.ts` (model z sekcji 3 planu), `store/persistence.ts` (`y-indexeddb`, baza `road-to-success`, `navigator.storage.persist()`), `store/events.ts` (`observeDeep` → `db-update`, łączenie zdarzeń co 50 ms), `store/ids.ts` (`crypto.randomUUID` z fallbackiem dla http w sieci lokalnej).
- Fasady w `database/*` zachowują klasy i asynchroniczne API. Zmiany: `id: string`, `userId` → `personId`, `requirementsIds` → `requirementIds`, brak tablic odwrotnych. Doszły metody polowe (`Task.setStatus`, `toggleRequirement`, `setPartIdea`, `contentText`). `update()` zapisuje tylko różnice, a treść jako diff tekstu, więc nie nadpisuje zmian z innych urządzeń.
- Treść zadania to `Y.Text` edytowany przez `CollaborativeTextarea` (minimalny diff przy każdym naciśnięciu klawisza, kursor przesuwany przy zmianach z innych urządzeń).
- Kaskadowe usuwanie w jednej transakcji, a odczyty ukrywają sieroty. Odczyty nie emitują już `db-update`.
- Migracja z Dexie (`store/migrateFromDexie.ts`) czyta starą bazę bez schematu (tryb dynamiczny Dexie) i nigdy jej nie tworzy ani nie usuwa.
- `store/tabSync.ts`: kilka otwartych kart na jednym urządzeniu synchronizuje się przez BroadcastChannel.

## Faza 3 – eksport/import

`export/exportFile.ts`: plik `.rts` = magic `RTSDOC` + wersja formatu + nagłówek JSON (`schemaVersion`, wersja aplikacji, data, liczniki) + `Y.encodeStateAsUpdate`. Import najpierw sprawdza plik na kopii dokumentu i pokazuje, ile rekordów będzie po scaleniu. Pliki z nowszym schematem są odrzucane z prośbą o aktualizację. Jest też eksport JSON do odczytu. UI: Ustawienia i kafelek „Zaimportuj kopię” na liście prób.

## Faza 4 – P2P

- `sync/room.ts`: pokój 128 bit, klucz 256 bit, link `/dolacz#r=…&k=…`, kod QR, „Zmień pokój” = nowy pokój i klucz.
- `sync/syncService.ts`: `WebrtcProvider` z hasłem pokoju, stany `disabled | unsupported | offline | connecting | alone | synced`, `lastSyncedAt`, ponowne łączenie po `online` i `visibilitychange`.
- `worker/`: `index.ts` (routing, kontrola Origin, limit na IP przez binding `ratelimits`), `signal.ts` (Durable Object z WebSocket Hibernation, auto-odpowiedź na ping, limity połączeń na pokój i na IP, rozmiaru wiadomości i tematów, IP tylko jako skrót), `signalHub.ts` (protokół y-webrtc), `turn.ts`.
- `public/_headers`: CSP (`script-src 'self'`, `connect-src 'self'`), `no-referrer`, `nosniff`, `frame-ancestors 'none'`.

## Faza 5 – UX synchronizacji

Wskaźnik w nagłówku i kropka na dolnym pasku, lista połączonych urządzeń z nazwami (awareness), nazwa urządzenia, przypomnienie o kopii (14 dni, odkładane o 3 dni) i dialog „Scal z pokojem / Zacznij od danych pokoju” przy dołączaniu z niepustymi danymi.

## Odstępstwa od planu (i dlaczego)

1. **Znacznik migracji jest per urządzenie**, w IndexedDB `road-to-success-device`, a nie w `meta.migratedFromDexie`. Znacznik w synchronizowanym dokumencie sprawiłby, że urządzenie, które najpierw się zsynchronizuje, nigdy nie przeniesie własnych starych danych. W dokumencie zostaje tylko `meta.legacyImport:<id>`, które zabezpiecza przed podwójną migracją po awarii w trakcie.
2. **„Zacznij od danych pokoju” usuwa lokalną bazę i przeładowuje stronę**, zamiast kasować rekordy. Usunięcia rekordów zsynchronizowałyby się i skasowały te same dane u innych (np. po wcześniejszym imporcie tego samego pliku). Poprzednie dane zostają na urządzeniu jako kopia do pobrania lub scalenia w Ustawieniach.
3. **Poprawione `requirements.json`.** `rankId` był przesunięty o 1 względem `rank.id`. Stara aplikacja przypadkiem to kompensowała, pobierając wymagania po id próby zamiast po id stopnia, co dla drugiej próby pokazywało wymagania innego stopnia. Usunięty duplikat id 45. Lista wymagań stopnia pochodzi teraz z `requirements.json`, bo `requirementIds` w `rank.json` zawierały nieistniejące 1012 i nie miały 2016.
4. **Sygnalizacja jest shardowana per pokój**: `/signal?s=<SHA-256(pokój)>` → osobny Durable Object. Id pokoju nie pojawia się w logach.
5. **Strona główna bez danych** pokazuje ekran powitalny („Dodaj pierwszą osobę / Dołącz do synchronizacji / Importuj kopię”) zamiast przekierowania do dodawania osoby. Ogranicza to duplikaty, gdy ktoś chce dołączyć do istniejących danych.
6. Nie zrobiono opcjonalnego przesyłania całego dokumentu serią kodów QR (faza 3). QR służy do przekazania linku do pokoju.
7. Komentarze mają model, fasadę i migrację, ale nadal nie mają UI (wcześniej też nie miały).

## Poprawione przy okazji

- Zmiana statusu zadania jest zapisywana od razu (wcześniej dopiero przy następnej zmianie treści).
- Domyślny język to polski (pasek nawigacji ustawiał angielski przy pierwszej wizycie).
- Widoki odpinają nasłuch zdarzeń przy wyjściu (wcześniej nasłuchy się kumulowały).
- Status na kolorowym tle ma czytelny biały tekst. Lista rozwijana obsługuje klawiaturę.

## Weryfikacja

W środowisku, w którym powstał kod, nie było dostępu do rejestru npm. Sprawdzono więc na zastępczym zestawie narzędzi: esbuild + `@vue/compiler-sfc`, biblioteki ze źródeł z GitHuba, pdfmake 0.2.23 (kod obsługuje API 0.2 i 0.3), TypeScript 6.0.3 i Playwright 1.56 z Chromium:

- 57 testów jednostkowych, scalania i Workera (te same pliki co w `tests/`, uruchomione przez `node:test` z nakładką zgodną z API Vitesta) – zielone;
- `vue-tsc` 3.3.13 (zbudowany ze źródeł) z TypeScript 6.0.3 i prawdziwymi typami `vite/client` oraz `vite-plugin-pwa` dla całego `src` (32 pliki `.vue`) i `tests/unit` – bez błędów (typy Vitesta zastąpione namiastką);
- 6 testów E2E z `tests/e2e` – zielone, w tym brak przewijania w poziomie przy 360 px, trwałość po przeładowaniu, PDF, import kopii w drugiej przeglądarce, synchronizacja dwóch przeglądarek przez WebRTC (zmiana widoczna po ~30 ms, równoległa edycja tego samego tekstu scalona) oraz dołączanie do pokoju z własnymi danymi („Scal” i „Zacznij od danych pokoju” z kopią);
- cały przepływ z nagłówkami CSP z `public/_headers` – bez naruszeń.

**Do sprawdzenia po `npm install`** (niedostępne w tamtym środowisku): `npm run verify` (w tym `tsc` dla konfiguracji Vite/Playwright i Workera z `@cloudflare/workers-types`, `vite build` z vite-plugin-pwa, test Workera w workerd), `npm run test:e2e` oraz ręcznie na urządzeniach: iOS Safari (udostępnianie PDF, instalacja PWA), Android Chrome i połączenie LTE ↔ Wi-Fi przez TURN.
