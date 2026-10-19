# Road To Success – plan architektury (mobile, PDF, sync P2P)

Status: propozycja · Data: 2026-10-18

## 0. Cel i zasady

Cel: aplikacja działa na telefonie i komputerze, ma PDF na każdym urządzeniu, dane da się przenosić i współdzielić (mentor + harcerz) **bez przechowywania danych na serwerze właściciela**.

Zasady, które wynikają z celu:

1. **Local-first.** Pełna kopia danych na każdym urządzeniu, aplikacja działa offline.
2. **Brak serwera danych.** Jedyna infrastruktura to: hosting statyczny, mały worker sygnalizacyjny (nic nie zapisuje), STUN/TURN (przekazuje szyfrowany ruch).
3. **Sync = scalanie, nie nadpisywanie.** CRDT (Yjs), więc dwie osoby mogą edytować offline bez konfliktów.
4. **Dane osobowe (często niepełnoletnich) nie opuszczają urządzeń w postaci jawnej.** Cały ruch szyfrowany hasłem pokoju, którego nie ma serwer.
5. **Fazy są niezależne i wdrażalne osobno.** Każda daje wartość sama.

## 1. Stan obecny (punkt wyjścia)

| Obszar | Dziś | Problem |
|---|---|---|
| Storage | Dexie/IndexedDB `RoadSuccessDB`, tabele z `++id` | dane tylko w jednej przeglądarce; ID kolidują między urządzeniami |
| Relacje | `taskIds`, `commentIds`, `ranksInProgressIds` dublują `rankInProgressId`/`taskId` | rozjadą się przy edycji z dwóch miejsc |
| Dane statyczne | `rank.json` 2,7 MB, `requirements.json` | nie powinny być synchronizowane |
| PDF | `window.print()` w `CreatingAdvancement.vue` + `@media print` | na telefonie niedziałające/zależne od układu ekranu |
| PWA | `register-service-worker`, `@vue/cli-plugin-pwa`, klucz `pwa` w vite.config | brak manifestu i ikon, pakiety z ery Vue CLI nie działają z Vite |
| Układ | Vuetify, ale komponenty pisane pod desktop | tabela `AsTableAdvancementComponent` nie mieści się w telefonie |
| Deploy | Docker+nginx, gh-pages, Cloudflare (wrangler) | trzy ścieżki naraz |
| Zdarzenia | `eventBus.emit('db-update')` także w odczytach (`Task.getAll/getById`) | ryzyko pętli odświeżeń |

## 2. Docelowa architektura

```
┌───────────────────────── przeglądarka (telefon / komputer) ─────────────────────────┐
│  Widoki Vue (Vuetify, responsywne)                                                  │
│        │ wywołują                                                                   │
│  Fasady src/scripts/database/*  (to samo publiczne API: getAll/add/update/delete)   │
│        │                                                                            │
│  Warstwa store: Y.Doc  ──► y-indexeddb (trwałość lokalna)                           │
│        │                                                                            │
│  SyncService ──► WebrtcProvider (y-webrtc, szyfrowanie hasłem pokoju)               │
│  PdfService  ──► pdfmake (lazy) ──► navigator.share / pobranie                      │
│  ExportService ─► plik .rts (Yjs update) / JSON                                     │
└──────────────┬──────────────────────────────────────────────────────────────────────┘
               │ WebRTC (dane, szyfrowane P2P)          │ wss /signal (tylko „poznanie się")
        drugie urządzenie                       Cloudflare Worker + Durable Object
                                               (przekazuje wiadomości, nic nie zapisuje)
                                               + STUN / TURN (krótkotrwałe poświadczenia)
```

### Struktura katalogów (docelowa)

```
src/scripts/
  store/
    doc.ts              # Y.Doc, mapy, typy, schemaVersion
    persistence.ts      # y-indexeddb
    ids.ts              # newId() = crypto.randomUUID()
    events.ts           # ydoc -> eventBus (debounce)
    migrateFromDexie.ts # jednorazowa migracja
  sync/
    room.ts             # generowanie/parsowanie linku, przechowanie pokoju
    syncService.ts      # WebrtcProvider, stan, odtwarzanie połączenia
    iceServers.ts       # STUN + pobranie TURN z /api/turn
  export/
    exportFile.ts       # .rts / JSON, import = applyUpdate
  pdf/
    advancementViewModel.ts
    buildAdvancementPdf.ts
    deliverPdf.ts
  database/             # fasady (User, Task, RankInProgress, TaskComment) – bez zmiany API
worker/
  index.ts              # routing: /signal, /api/turn
  signal.ts             # Durable Object
```

## 3. Model danych (Yjs)

`ranks` i `requirements` zostają statycznym JSON-em w aplikacji (z `id` z pliku) – nie wchodzą do dokumentu, tylko są przywoływane po `rankId`/`requirementId`.

```
meta:            Map { schemaVersion: 1, createdAt }
people:          Map<uuid, Map { fullName }>
ranksInProgress: Map<uuid, Map { rankId, personId, mentorId, createdAt }>
tasks:           Map<uuid, Map { rankInProgressId, content: Y.Text, status,
                                 requirementIds: Map<string,true> (zbiór),
                                 partIdea: string[] (zapis atomowy), order, createdAt }>
comments:        Map<uuid, Map { taskId, authorId, date, content }>
```

Decyzje:

- **UUID** (`crypto.randomUUID`) zamiast `++id`.
- **Bez tablic odwrotnych** (`taskIds`, `commentIds`…): relacje wyliczane zapytaniem po kluczu obcym. `IUser.ranksInProgressIds/mentorRanksInProgressIds/commentIds` znikają.
- **Zbiory jako `Map<id,true>`**, żeby równoległe dodanie tego samego wymagania nie dawało duplikatów.
- **`content` jako `Y.Text`**: dwie osoby mogą pisać w jednym zadaniu.
- **Usuwanie**: twarde usunięcie + kaskada w jednej transakcji (`ydoc.transact`); odczyty odfiltrowują sieroty (rekord zależny od nieistniejącego rodzica), na wypadek równoległej edycji.
- **Załączniki** (`IAttachment.fileData: File`) poza zakresem pierwszej wersji (osobny, zaszyfrowany magazyn blobów – faza 6).

## 4. Fazy

### Faza 1 – Mobile, PWA, PDF (bez zmiany przechowywania)

Wartość od razu: aplikacja używalna na telefonie, PDF działa wszędzie.

**1.1 Porządki zależności**
- Usunąć `@vue/cli-plugin-pwa`, `register-service-worker`, klucz `pwa` z `vite.config.ts`.
- Dodać `vite-plugin-pwa` (strategia `generateSW`, `registerType: 'autoUpdate'`).
- Zweryfikować, które z `react`, `express`, `axios`, `js-cookie`, `@vueuse/core` są faktycznie używane; nieużywane usunąć (`package.json` „start": `node server.js` – brak pliku).

**1.2 PWA**
- `manifest`: nazwa, `display: standalone`, `lang: pl`, `theme_color`, ikony 192/512 + maskable (z `logo.svg`).
- Workbox precache: `rank.json` (2,7 MB) przekracza domyślny limit – ustawić `maximumFileSizeToCacheInBytes` albo wyciąć z niego `iconInBase64` do osobnych plików.
- `index.html`: `viewport-fit=cover`, `theme-color`.

**1.3 Układ responsywny**
- `useDisplay()` z Vuetify; breakpoint mobilny `< 600px`.
- `AsTableAdvancementComponent` → na mobile widok kart (jedno wymaganie = jedna karta); tabela tylko od `md`.
- Nawigacja: dolny pasek na mobile (`v-bottom-navigation`), `NavBarComponent` na desktopie.
- Wysokości `100dvh`, `env(safe-area-inset-*)`, cele dotyku ≥ 44 px, `PopupComponent` jako pełnoekranowy bottom-sheet na mobile.

**1.4 PDF z danych, nie z ekranu**
- `advancementViewModel.ts`: czysta funkcja `(rankInProgress, tasks, requirements, rank, person, mentor) -> ViewModel`.
- Refaktor `getIdeaWithSelectedParts`: wydzielić czystą funkcję zwracającą segmenty `{text, highlighted}[]`; wersja HTML dla ekranu i wersja PDF korzystają z tego samego rdzenia.
- `buildAdvancementPdf.ts`: `pdfmake` ładowany dynamicznie (`import()`), czcionka z polskimi znakami osadzona (Noto Sans/Roboto; Museo tylko jeśli licencja pozwala na osadzanie).
- `deliverPdf.ts`: 1) `navigator.canShare({files})` → `navigator.share` (arkusz udostępniania na telefonie), 2) inaczej `<a download>`, 3) iOS fallback: otwarcie blob URL w nowej karcie.
- Przycisk w `CreatingAdvancement.vue` wywołuje `deliverPdf(...)`; `window.print()` i `@media print` zostają tymczasowo jako zapasowa ścieżka, usuwane po fazie 1 testach.

**Kryteria akceptacji:** Lighthouse PWA zainstalowalna; PDF generuje się i da się udostępnić na iOS Safari i Android Chrome; żaden ekran nie przewija się poziomo przy 360 px.

### Faza 2 – Nowy model danych (Yjs + UUID)

**2.1 Zależności:** `yjs`, `y-indexeddb`.

**2.2 `store/doc.ts`** – jedyny `Y.Doc`, mapy z punktu 3, `meta.schemaVersion`.

**2.3 `store/persistence.ts`** – `new IndexeddbPersistence('road-to-success', ydoc)`; aplikacja czeka na `whenSynced` przed pierwszym renderem list (stan „ładowanie").

**2.4 Fasady `database/*`** – te same klasy i sygnatury asynchroniczne, nowa implementacja nad mapami. Dzięki temu widoki zmieniają się minimalnie (głównie typ `id: number` → `string`, w `router.ts` `props` bez `Number()`).
- Operacje wielokrokowe (`Task.add`, `Task.deleteObject`, zmiana `rankId` w `RankInProgress.update`) w `ydoc.transact(...)`.
- Usunąć emitowanie `db-update` z odczytów.

**2.5 `store/events.ts`** – `ydoc.on('afterTransaction')` → debounce ~50 ms → `eventBus.emit('db-update', {type})`; typ wyznaczany po nazwie zmienionej mapy (`observeDeep`).

**2.6 Migracja z Dexie (`migrateFromDexie.ts`)**
1. Przy starcie: jeśli istnieje baza `RoadSuccessDB` z danymi i `meta.migratedFromDexie` nie jest ustawione → migruj.
2. Zbuduj mapę `stareId -> uuid` dla people/rankInProgress/tasks/comments.
3. Przepisz rekordy, zamieniając klucze obce; tablice odwrotne pomiń; `requirementsIds` → zbiór.
4. Wszystko w jednej transakcji; na końcu `meta.migratedFromDexie = true`.
5. Bazy Dexie **nie kasować** – zostaje jako kopia zapasowa przez co najmniej jedną wersję.
6. Migracja tylko na urządzeniu, które ma dane (inne dołączą przez sync lub plik – patrz ryzyka).

**Kryteria akceptacji:** testy jednostkowe migracji na realistycznym zrzucie Dexie; dwa `Y.Doc` edytowane niezależnie i scalone (`applyUpdate` w obu kierunkach) dają identyczny stan; wszystkie dotychczasowe ekrany działają bez regresji.

### Faza 3 – Eksport i import (sync bez infrastruktury)

- `exportFile.ts`: `Y.encodeStateAsUpdate(ydoc)` zapisane jako `.rts` (nagłówek: magic, `schemaVersion`, data) + osobny eksport czytelny JSON.
- Import: walidacja nagłówka i wersji → `Y.applyUpdate(ydoc, bytes)`. Scalanie jest przemienne i idempotentne, więc import tego samego pliku dwa razy nie szkodzi, a import z drugiego urządzenia **jest** synchronizacją.
- UI w ustawieniach: „Eksportuj kopię", „Importuj / scal", ostrzeżenie o wersji schematu nowszej niż aplikacja.
- Opcjonalnie: transfer przez serię kodów QR (`qrcode`, kawałki ~1–2 KB) dla małych dokumentów.

**Kryteria akceptacji:** eksport z komputera → import na telefonie daje identyczne dane; zmiany po obu stronach scalają się bez utraty.

### Faza 4 – Synchronizacja P2P

**4.1 Pokój i link (`sync/room.ts`)**
- `room` = 128 bitów losowych, `key` = 256 bitów losowych, base64url.
- Link: `https://…/dolacz#r=<room>&k=<key>` (fragment nie trafia do żadnego serwera). Widok `/dolacz` odczytuje fragment, zapisuje pokój w IndexedDB i od razu czyści adres (`history.replaceState`).
- Ten sam link jako kod QR (do zeskanowania telefonem).
- Ekran: „Utwórz pokój", „Dołącz", „Opuść / zmień pokój" (zmiana pokoju = odwołanie dostępu).

**4.2 `sync/syncService.ts`**
```ts
provider = new WebrtcProvider(room, ydoc, {
  password: key,
  signaling: [`wss://${location.host}/signal`],
  peerOpts: { config: { iceServers } },
})
```
Obsługa zdarzeń `status`, `synced`, `peers`; automatyczne ponowne łączenie po powrocie online (`online`/`visibilitychange`); stan eksponowany jako `ref`: `offline | connecting | alone | synced(n) `, plus `lastSyncedAt`.

**4.3 Worker sygnalizacyjny (`worker/`)**
- Jeden Worker obsługuje `/signal` (upgrade WebSocket → Durable Object) i `/api/turn`; reszta ścieżek to zasoby statyczne SPA.
- `wrangler.jsonc`: `main`, `assets.run_worker_first: ["/signal", "/api/*"]`, binding Durable Object, migracja klasy.
- Durable Object `Signal`: mapa `topic -> zbiór WebSocketów`; obsługa wiadomości protokołu y-webrtc (`subscribe`, `unsubscribe`, `publish`, `ping` → `pong`); WebSocket Hibernation API.
- Ograniczenia: max rozmiar wiadomości, max liczba tematów na połączenie, limit połączeń na IP. **Nic nie jest zapisywane**, brak logowania treści.

**4.4 ICE (`iceServers.ts`)**
- STUN: publiczne serwery.
- TURN: `/api/turn` w Workerze generuje krótkotrwałe poświadczenia u dostawcy TURN (Cloudflare Realtime TURN lub własny `coturn`); sekrety jako `wrangler secret`. Pobierane przy starcie synchronizacji, z cache na czas ważności.

**4.5 Bezpieczeństwo**
- Hasło pokoju szyfruje sygnalizację i dane w `y-webrtc`; serwer widzi tylko zaszyfrowane wiadomości.
- Link = pełen dostęp (odczyt+zapis); brak ról w CRDT. Widok „tylko do odczytu" realizowany eksportem/PDF.
- CSP w nagłówkach (`script-src 'self'`), bo wyciek klucza = wyciek danych.

**Kryteria akceptacji:** dwa urządzenia w tej samej sieci synchronizują zmiany w < 2 s; telefon na LTE + komputer na Wi-Fi łączą się przez TURN; edycja offline na obu stronach scala się po powrocie online; serwer nie zawiera żadnych odczytywalnych danych.

### Faza 5 – Odporność i UX synchronizacji

- Wskaźnik w nagłówku: „Zsynchronizowano z 1 urządzeniem · 2 min temu" / „Czeka na połączenie".
- Lista połączonych urządzeń i nazw (Yjs awareness: nazwa osoby).
- Okresowa przypominajka o kopii zapasowej, gdy ostatni eksport jest starszy niż N dni (bo gdy wszystkie urządzenia zginą, dane znikną).
- Dołączanie do pokoju przy niepustych danych lokalnych: dialog „Scal z pokojem" / „Zacznij od danych pokoju" (unikanie duplikatów po podwójnej migracji).
- Opcjonalny **peer zawsze włączony**: ten sam Worker/DO działający jako dodatkowy uczestnik z zaszyfrowaną kopią. Wymaga zgody użytkownika, bo to jest przechowywanie; rozwiązuje problem „nigdy nie jesteśmy online razem".

### Faza 6 – Załączniki (później)

`IAttachment` jako osobne zaszyfrowane bloby (limit rozmiaru, miniatura), w dokumencie tylko metadane + hash; transfer P2P na żądanie.

## 5. Deploy i CI

- Jedna ścieżka: Cloudflare (statyczne SPA + Worker). `Dockerfile`, `nginx.conf`, `gh-pages` i obecny workflow budujący obraz – usunąć albo świadomie zostawić jedną alternatywę.
- GitHub Actions: `npm ci` → `typecheck` → `vitest` → `vite build` → `wrangler deploy`.
- Wersja aplikacji (`__APP_VERSION__`) widoczna w stopce i zapisywana przy eksporcie.

## 6. Testy

| Poziom | Co | Narzędzie |
|---|---|---|
| Jednostkowe | fasady na `Y.Doc` w pamięci, migracja Dexie, widok-model PDF, segmenty idei | Vitest + `fake-indexeddb` |
| Scalanie | dwa `Y.Doc`, losowe sekwencje edycji, zbieżność stanów | Vitest (własne generatory) |
| Integracyjne | Worker sygnalizacyjny lokalnie | `wrangler dev` + Vitest |
| E2E | dwa konteksty przeglądarki, jeden „offline", sync po powrocie; widok 360 px; generowanie PDF | Playwright |
| Ręczne | iOS Safari (udostępnianie PDF, PWA), Android Chrome, LTE↔Wi-Fi | urządzenia fizyczne |

## 7. Ryzyka i decyzje do podjęcia

| Ryzyko | Mitygacja |
|---|---|
| Podwójna migracja z Dexie na dwóch urządzeniach → zduplikowani ludzie/próby | migracja tylko tam, gdzie są dane; dialog scalania; (opcjonalnie) narzędzie „połącz duplikaty osób" |
| Symetryczny NAT w sieciach komórkowych | TURN obowiązkowy w produkcji; monitorować odsetek połączeń przez TURN |
| Sync tylko gdy oba urządzenia są online | eksport/import (faza 3), opcjonalny peer always-on (faza 5) |
| Utrata linku = utrata dostępu do pokoju | kopia zapasowa do pliku; link można wyświetlić ponownie w ustawieniach |
| Link daje pełny dostęp | świadoma decyzja; zmiana pokoju odwołuje; PDF dla widoku tylko do odczytu |
| Dane niepełnoletnich (RODO) | brak jawnych danych na serwerze; polityka prywatności opisująca przepływ; szyfrowanie end-to-end |
| iOS usuwa dane PWA/Safari po okresie nieaktywności (ITP) | zainstalowana PWA + przypominajka o kopii + `navigator.storage.persist()` |
| Licencja czcionki Museo przy osadzaniu w PDF | użyć czcionki o otwartej licencji w PDF |

**Do ustalenia:** (1) dostawca TURN (Cloudflare vs własny coturn), (2) czy włączać opcjonalny peer always-on, (3) czy potrzebne role tylko-do-odczytu, (4) docelowa domena (link współdzielenia i `/signal` są na tej samej origin).

## 8. Zmiany zależności

Dodać: `vite-plugin-pwa`, `pdfmake`, `yjs`, `y-indexeddb`, `y-webrtc`, `qrcode`; dev: `vitest`, `fake-indexeddb`, `@playwright/test`, `wrangler`.
Usunąć: `@vue/cli-plugin-pwa`, `register-service-worker`; po audycie nieużywane (`react`, `express`, `axios`, `js-cookie`). `dexie` zostaje tylko do migracji, potem do usunięcia.

## 9. Kolejność i szacunek pracy

1. Faza 1 (mobile/PWA/PDF) – największy efekt dla użytkownika, niezależna.
2. Faza 2 (model Yjs + migracja) – fundament; ryzykowna, wymaga testów.
3. Faza 3 (eksport/import) – szybka po fazie 2; rozwiązuje przenoszenie danych.
4. Faza 4 (P2P) – infrastruktura + UI pokoju.
5. Faza 5–6 – dopracowanie i załączniki.
