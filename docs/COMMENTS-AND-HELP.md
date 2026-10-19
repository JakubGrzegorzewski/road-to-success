# Komentarze opiekuna i zakładka Pomoc – plan

Data: 2026-10-19 · Dotyczy: RTS 2.0 (po fazach 1–5, [IMPLEMENTATION.md](IMPLEMENTATION.md)) · Model danych: [ARCHITECTURE.md §3](ARCHITECTURE.md)

Dwie niezależne funkcje:

- **A. Komentarze** do każdego punktu próby: zadania, wymagania i próby jako całości. Opiekun zostawia uwagi, a podopieczny odpowiada i oznacza je jako załatwione.
- **B. Zakładka „Pomoc”** z poradnikami do każdej funkcji aplikacji, działająca offline, z wyszukiwarką i linkami kontekstowymi „?” na ekranach.

Obie można wdrażać osobno. Kolejność proponuję A → B, bo poradnik o komentarzach powinien opisywać gotowy UI.

---

## A. Komentarze

### A.1 Stan obecny

- `comments: Map<uuid, Map { taskId, authorId, date, content }>` w dokumencie Yjs, fasada `database/TaskComment.ts` (add/update/delete, `getByTaskId`), migracja z Dexie, kaskadowe usuwanie z zadaniem (`deleteTasksWhere`), eksport JSON.
- Brak UI. Teksty `advancement.comment.*` w `locales/*.json` i ikona `assets/images/chatBubble.svg` już są.
- Brak kont. Osoba (`people`) to tylko imię i nazwisko. Opiekun próby to `rankInProgress.mentorId`, a podopieczny to `personId`.

### A.2 Czym jest „punkt próby”

Komentarz zawsze należy do jednej próby i jest przypięty do jednego celu:

| `targetType` | `targetId` | Gdzie w UI |
|---|---|---|
| `task` | uuid zadania | karta zadania (`TaskComponent`) |
| `requirement` | id wymagania z `requirements.json` (jako string) | lista „Pokaż wybrane wymagania” w widoku próby |
| `advancement` | `''` | sekcja „Uwagi ogólne” pod ideą stopnia |

Wymagania są statyczne i wspólne dla wszystkich prób danego stopnia, więc komentarz do wymagania musi mieć `rankInProgressId`, bo inaczej pojawiłby się w każdej próbie.

### A.3 Model danych (zmiana addytywna)

```
comments: Map<uuid, Map {
  rankInProgressId,          // NOWE – zawsze ustawione dla nowych komentarzy
  targetType,                // NOWE – 'task' | 'requirement' | 'advancement'
  targetId,                  // NOWE
  taskId,                    // zostaje: ustawiane dla targetType='task' (zgodność ze starszą wersją)
  authorId,                  // personId z `people`
  authorName,                // NOWE – migawka imienia, gdy osoba zostanie usunięta
  date,                      // ISO, czas utworzenia
  editedAt?,                 // NOWE – ISO, ostatnia edycja treści
  content,                   // string (LWW – edytuje tylko autor, więc Y.Text niepotrzebny)
  resolved?, resolvedAt?, resolvedById?   // NOWE – „załatwione”
}>
```

Decyzje:

- **`SCHEMA_VERSION` zostaje 1.** Zmiana jest tylko addytywna. Starsza wersja aplikacji nie ma UI komentarzy, a jej `getAll()` i tak odfiltruje rekordy bez istniejącego `taskId`. Nie ma potrzeby blokować importu plików `.rts` w starszych wersjach.
- **Normalizacja przy odczycie:** rekord bez `targetType` (dane sprzed zmiany, migracja z Dexie) traktujemy jako `{ targetType: 'task', targetId: taskId }`, a `rankInProgressId` wyliczamy z zadania. Bez migracji danych w miejscu.
- **Sieroty ukryte przy odczycie**, tak jak w zadaniach: komentarz jest widoczny tylko wtedy, gdy istnieje jego próba, a dla `task` także zadanie.
- **Kaskada:** `RankInProgress.deleteObject` usuwa w tej samej transakcji wszystkie komentarze z jego `rankInProgressId` (dziś usuwa je tylko pośrednio, przez zadania). `deleteTasksWhere` bez zmian. Wymagania się nie usuwają, ale zmiana stopnia próby (`requestRankChange`) osieroca komentarze do wymagań. Ukrywamy je, a popup „Zmień stopień” mówi, ile komentarzy do wymagań zniknie, i usuwa je przy potwierdzeniu.
- **Treść jako zwykły string.** Komentarz ma jednego autora, a równoległa edycja tego samego komentarza jest mało prawdopodobna. Ostatni zapis wygrywa.
- **`resolved` jako pole skalarne (LWW).** Równoległe „załatw” i „otwórz ponownie” rozstrzyga Yjs deterministycznie. To wystarczy.

### A.4 Kto pisze – tożsamość bez kont

Zgodnie z decyzją „link = pełny dostęp” nie ma uwierzytelniania. Tożsamość jest **deklaracją urządzenia**:

- `localState` dostaje klucz `commentAuthorId: string` (per urządzenie, nie synchronizowany).
- Przy pierwszym komentarzu pojawia się wybór „Piszę jako:” z listą osób. Na górze są opiekun i podopieczny tej próby, a niżej „Dodaj osobę”. Wybór jest zapamiętany i można go zmienić w kompozytorze (link „zmień”) oraz w Ustawieniach (obok nazwy urządzenia).
- Etykieta roli przy autorze jest wyliczana, nie zapisywana: **Opiekun**, gdy `authorId === mentorId` tej próby, **Podopieczny**, gdy `=== personId`, a w innym wypadku samo imię. Zmiana opiekuna próby zmienia więc etykiety, co jest poprawne.
- Edycja i usuwanie są widoczne w UI tylko przy własnych komentarzach (`authorId === commentAuthorId`). To ochrona przed pomyłką, nie zabezpieczenie, i poradnik mówi to wprost.

### A.5 Fasada

`database/TaskComment.ts` → `database/Comment.ts`. Stara nazwa zostaje jako re-eksport, więc testy i eksport działają bez zmian.

```ts
type CommentTarget =
  | { type: 'task'; id: string }
  | { type: 'requirement'; id: number }
  | { type: 'advancement' }

Comment.getByRankInProgressId(ripId): Promise<IComment[]>      // wszystkie, posortowane po date
Comment.add({ rankInProgressId, target, authorId, content }): Promise<IComment>
Comment.edit(id, content): Promise<void>                       // ustawia editedAt
Comment.setResolved(id, resolved: boolean, byId: string): Promise<void>
Comment.deleteObject(id): Promise<void>
Comment.deleteWhere(pred)                                      // do kaskad, w transakcji
// czyste funkcje (testowalne bez dokumentu):
groupByTarget(comments): Map<targetKey, IComment[]>            // targetKey = 'task:<uuid>' | 'req:<id>' | 'adv'
openCount(comments): number
```

`IComment` w `interfaces.ts` rozszerza `ITaskComment` o nowe pola (`taskId` opcjonalne). `store/events.ts` już mapuje `comments` na `ITypesEnum.ETaskComment`, więc widok tylko dopisuje ten typ do `useDbUpdates`.

### A.6 UI

Nowe komponenty w `components/Comments/`:

| Komponent | Rola |
|---|---|
| `CommentButton.vue` | ikona dymka (`chatBubble.svg`) z licznikiem: liczba otwartych uwag albo szara liczba wszystkich, gdy wszystkie są załatwione. `aria-label` „Komentarze (3 otwarte)”. Cel dotyku ≥ 44 px. |
| `CommentThread.vue` | lista komentarzy jednego celu i kompozytor. Wpis to autor, etykieta roli, data względna („2 godz. temu”, `Intl.RelativeTimeFormat`), treść (`white-space: pre-wrap`, bez HTML), znacznik „edytowano”, menu „Edytuj / Usuń” (tylko własne) i przycisk „Załatwione ✓ / Otwórz ponownie”. Załatwione są zwinięte w „Pokaż załatwione (2)”. |
| `CommentComposer.vue` | `textarea` z autorozmiarem, „Piszę jako: X (zmień)”, Ctrl/⌘+Enter wysyła. Szkic trzymany w `localStorage` per cel, żeby nie przepadł przy przełączeniu karty. |
| `CommentsSummary.vue` | panel „Otwarte uwagi (n)” w widoku próby: lista wszystkich otwartych, pogrupowana po celu („Zadanie 2”, „Wymaganie 5”, „Uwagi ogólne”). Kliknięcie przewija do celu i otwiera wątek. |

Rozmieszczenie:

- **Zadanie:** `CommentButton` w `task-header` obok statusu. Wątek rozwija się pod treścią zadania, wewnątrz karty. Na telefonie (< 600 px) otwiera się jako bottom-sheet (ten sam wzorzec co `PopupComponent`), bo rozwinięty wątek w karcie wydłużyłby stronę.
- **Wymaganie:** przycisk w każdym `requirement-item` listy „Pokaż wybrane wymagania”. Wątek zawsze jako bottom-sheet lub popup, bo lista jest w `<details>`.
- **Próba:** sekcja „Uwagi ogólne” pod ideą i nad zadaniami, plus `CommentsSummary`, gdy są otwarte uwagi.
- **Lista prób (`AdvancementCardComponent`):** plakietka „3 uwagi”, gdy próba ma otwarte komentarze.
- **„Nowe od ostatniej wizyty”:** `localState.commentsSeenAt: Record<rankInProgressId, number>` (per urządzenie). Komentarze innych autorów nowsze niż ta wartość dostają kropkę. Znacznik aktualizuje się przy wyjściu z widoku próby. Powiadomień push nie ma, bo nie ma serwera z danymi.
- Kotwice: karta zadania dostaje `id="zadanie-<uuid>"`, a wymaganie `id="wymaganie-<id>"`. Link `/stopien/<id>#zadanie-<uuid>` otwiera wątek, więc można go wysłać w komunikatorze.

### A.7 Podgląd, PDF, eksport

- Podgląd i PDF: nowa opcja „Dołącz komentarze” (domyślnie **wyłączona**, bo PDF to zwykle dokument do oddania), zapamiętana jak `rts.pdfLayout`. `advancementViewModel` dostaje `comments` pogrupowane po celu. W układzie listy idą pod zadaniem, w układzie tabeli jako aneks „Uwagi” na końcu z odnośnikami „Zad. 2”. Opcja „tylko otwarte / wszystkie”.
- Eksport JSON: komentarze przy zadaniach (jak dziś) oraz `advancement.comments` i `requirements[].comments`. Plik `.rts` nie wymaga zmian, bo to zrzut Yjs.

### A.8 Teksty (i18n)

Rozszerzenie istniejącego `advancement.comment`: `open`, `resolve`, `reopen`, `resolved`, `showResolved`, `writingAs`, `change`, `edited`, `general` („Uwagi ogólne”), `openCount` („{n} otwarte uwagi”, z formami liczby mnogiej przez `|` vue-i18n), `roleMentor`, `roleMentee`, `newSinceLastVisit`, `pdfInclude`, `orphanedOnRankChange`. Po polsku i angielsku.

### A.9 Testy

- Jednostkowe (`tests/unit/comments.test.ts`): add/edit/resolve/delete; normalizacja starego rekordu (`taskId` bez `targetType`); ukrywanie sierot; kaskada przy usuwaniu zadania i próby; usuwanie komentarzy do wymagań przy zmianie stopnia; `groupByTarget` i `openCount`.
- Scalanie (`merge.test.ts`): dwa dokumenty dodają komentarze równolegle i oba zostają; równoległe `resolve` i `edit` tego samego komentarza dają identyczny stan po `applyUpdate` w obu kierunkach; usunięcie próby na A i komentarz na B dają sierotę ukrytą w obu dokumentach.
- Migracja: komentarz z Dexie jest widoczny w wątku zadania.
- E2E: opiekun na przeglądarce A dodaje uwagę do zadania, a na B pojawia się licznik i wątek; B oznacza „Załatwione” i licznik na A spada do 0. Telefon 360 px: bottom-sheet bez przewijania w poziomie, klawiatura nie zasłania pola (`visualViewport`). PDF z komentarzami i bez.

---

## B. Zakładka „Pomoc”

### B.1 Założenia

- Działa **offline** (PWA), bez zewnętrznych serwisów, zgodnie z CSP `script-src 'self'`.
- Treść łatwa do edycji: **Markdown w repo**, a nie teksty wpisywane w komponentach.
- Bez nowej zależności w runtime: Markdown jest kompilowany do HTML przy budowaniu.
- Wejście z nawigacji oraz z kontekstu: ikona „?” przy trudniejszych miejscach prowadzi do konkretnej sekcji poradnika.

### B.2 Nawigacja i routing

- Trasy: `/pomoc` (`Help`, spis i wyszukiwarka) oraz `/pomoc/:slug` (`HelpArticle`), z kotwicami sekcji `#…`.
- `MobileNavComponent`: czwarta zakładka „Pomoc” (ikona znaku zapytania w kółku). Cztery pozycje mieszczą się przy 360 px (grow, etykieta 12 px).
- `NavBarComponent`: link „Pomoc” po „Ustawieniach”.
- Ekran powitalny (pusta baza): czwarty przycisk „Jak to działa?” → `/pomoc/pierwsze-kroki`.

### B.3 Treść i budowanie

```
src/help/
  pl/  pierwsze-kroki.md  proba.md  zadania.md  ...  (źródło prawdy)
  en/  ...                                          (opcjonalne; brak → wersja PL + informacja)
  img/ *.webp                                       (zrzuty ekranu)
```

Frontmatter każdego pliku:

```yaml
---
title: Synchronizacja między urządzeniami
summary: Jak połączyć telefon i komputer, żeby pracować na tych samych danych.
category: dane          # start | proba | dane | aplikacja | problemy
order: 10
keywords: [sync, link, qr, pokój, telefon]
related: [kopie-zapasowe, praca-offline]
---
```

- Mała wtyczka Vite (`vite/helpMarkdown.ts`, ok. 40 linii) zamienia `*.md` na moduł `{ meta, html, headings, text }`. `marked` i `gray-matter` są wyłącznie **devDependencies**. Nagłówki dostają stabilne `id` (slug bez polskich znaków), więc działają linki `#sekcja`.
- `src/scripts/help.ts` indeksuje artykuły przez `import.meta.glob('../help/*/*.md')`. Lista (meta) jest ładowana od razu, a treść leniwie, osobnym chunkiem na artykuł. Workbox i tak precache'uje wszystkie chunki JS, więc całość działa offline.
- HTML pochodzi z repo (zaufane źródło), więc nie trzeba go sanityzować w runtime. Wtyczka i tak odrzuca surowy HTML w Markdown (`marked` z `renderer.html = () => ''`), żeby nikt przypadkiem nie wstawił `<script>`, który i tak zablokowałby CSP.
- Specjalne bloki: `> [!TIP]`, `> [!WARNING]` → ramki w kolorach `--accent-info` / `--accent-warning`. `:::ios` / `:::android` → zakładki z instrukcją per system (do instalacji PWA i PDF).

### B.4 Widoki

- **`HelpView.vue`:** pole wyszukiwania na górze, pod nim kafelki kategorii z listą artykułów (tytuł i `summary`). Wyszukiwanie po `title`, `keywords` i `text`, z normalizacją polskich znaków („zrodlo” znajduje „źródło”), z prostym rankingiem (tytuł > słowa kluczowe > treść) i podświetleniem trafienia. Bez biblioteki, bo przy ok. 15 artykułach wystarczy filtr w pamięci.
- **`HelpArticleView.vue`:** tytuł, spis sekcji (na komputerze przyklejony z boku, na telefonie zwinięty `<details>`), treść, „Zobacz też” z `related` i link „Wróć do pomocy”. Na końcu „Czy to pomogło?” – **bez** wysyłania czegokolwiek (nie ma serwera). Zamiast tego jest link „Zgłoś problem”, który otwiera zgłoszenie na GitHubie z tytułem artykułu. Do decyzji, patrz B.8.
- **`HelpLink.vue`:** okrągła ikona „?” (≥ 44 px dotyku) z `to="/pomoc/<slug>#<sekcja>"`. Umieszczenie: widok synchronizacji (stany wskaźnika, „Zmień pokój”), dialog „Scal / Zacznij od danych pokoju”, pasek podglądu PDF, kompozytor komentarza („Piszę jako”), import kopii, przypomnienie o kopii, komunikat `app.memoryOnly`.

### B.5 Spis poradników („do wszystkiego”)

| slug | Tytuł | Zawartość |
|---|---|---|
| `pierwsze-kroki` | Pierwsze kroki | czym jest aplikacja, dodanie siebie, pierwsza próba w 3 krokach |
| `proba` | Zakładanie i edycja próby | stopień, podopieczny, opiekun, zmiana stopnia (co się traci), idea i wymagania startowe/końcowe, usuwanie próby |
| `zadania` | Zadania | dodawanie, treść (równoczesne pisanie z dwóch urządzeń), przypisywanie wymagań, zaznaczanie fragmentu idei stuknięciem, kolejność, usuwanie |
| `statusy` | Statusy zadań | znaczenie każdego statusu i kolorów, propozycja typowego przebiegu pracy z opiekunem |
| `komentarze` | Komentarze i uwagi | dla opiekuna (gdzie zostawić uwagę, uwagi ogólne, panel otwartych uwag) i dla podopiecznego (odpowiedź, „Załatwione”), „Piszę jako”, kropka „nowe”, link do zadania, dlaczego można edytować tylko swoje (i że to nie zabezpieczenie) |
| `pdf` | Podgląd i PDF | układ tabeli i listy, tło stopnia, komentarze w PDF, zapis i udostępnianie na iPhonie, Androidzie i komputerze, drukowanie |
| `synchronizacja` | Synchronizacja między urządzeniami | link i kod QR, znaczenie stanów (zsynchronizowano / sam w pokoju / łączenie / offline), nazwa urządzenia, lista połączonych, „Zmień pokój” i kiedy go użyć (zgubiony telefon), „Scal” kontra „Zacznij od danych pokoju” |
| `kopie-zapasowe` | Kopie zapasowe | eksport `.rts` i JSON, import i podgląd scalenia, przypomnienie co 14 dni, kopia sprzed „Zacznij od danych pokoju” |
| `instalacja` | Instalacja jako aplikacja | iOS Safari (Udostępnij → Do ekranu początkowego), Android Chrome, komputer, aktualizacje |
| `offline-prywatnosc` | Praca offline i prywatność | dane tylko na Twoich urządzeniach, szyfrowanie pokoju, co widzi serwer sygnalizacji (nic z treści), trwałe przechowywanie, tryb prywatny przeglądarki |
| `ustawienia` | Ustawienia | język, nazwa urządzenia, „Piszę jako”, kopie |
| `problemy` | Rozwiązywanie problemów | nie widzę zmian z drugiego urządzenia; „dane zastąpione w innej karcie”; „zmiany znikną po zamknięciu karty”; PDF nie pobiera się na iPhonie; próba „nie znaleziona”; duplikaty osób po imporcie; jak zacząć od nowa |
| `slowniczek` | Słowniczek | próba, stopień, idea, wymaganie, zadanie, opiekun, podopieczny, pokój, kopia |

Na start tylko PL, a EN jako druga iteracja. Język artykułu wynika z `locale`, z powrotem do PL.

### B.6 Zrzuty ekranu bez ręcznej roboty

Skrypt Playwright `tests/e2e/help-screens.spec.ts` (osobny projekt w `playwright.config.ts`, uruchamiany przez `npm run help:screens`) wypełnia bazę danymi przykładowymi, robi zrzuty kluczowych ekranów w rozdzielczości telefonu i komputera, zapisuje je do `src/help/img/*.webp` i rysuje obwódki wokół elementów (`locator.evaluate` → `outline`). Zrzuty odświeża się po zmianach UI jednym poleceniem. W PR widać różnice obrazów.

### B.7 Testy

- Jednostkowe: wtyczka Markdown (frontmatter, id nagłówków bez polskich znaków, odrzucanie surowego HTML, bloki TIP/WARNING), wyszukiwarka (normalizacja, ranking).
- Spójność treści (`help.test.ts`): każdy `related` i każdy `HelpLink` w `src/**/*.vue` wskazuje na istniejący `slug#sekcja`. Test pada, gdy ktoś zmieni nagłówek i zepsuje link kontekstowy.
- E2E: `/pomoc` działa offline po pierwszym wejściu (`context.setOffline(true)`); wyszukanie „qr” znajduje „Synchronizacja”; „?” w widoku synchronizacji otwiera właściwą sekcję; 360 px bez przewijania w poziomie; bottom nav z 4 zakładkami.

### B.8 Do ustalenia

| Pytanie | Propozycja |
|---|---|
| Komentarze w PDF domyślnie? | Wyłączone, z opcją w podglądzie. |
| Kto może oznaczyć „Załatwione”? | Każdy (spójnie z „link = pełny dostęp”). Alternatywa: przycisk widoczny tylko dla opiekuna próby, ale bez kont to i tak tylko UI. |
| Komentarze do wymagań – potrzebne od razu? | Tak, w modelu od razu. UI można wypuścić w drugim kroku, jeśli zadania wystarczą. |
| Odpowiedzi w wątku (zagnieżdżenie)? | Nie, płaski wątek per punkt. Przy jednym opiekunie i jednym podopiecznym zagnieżdżenie tylko komplikuje telefon. |
| „Zgłoś problem” z poradnika? | Link do GitHub Issues, jeśli repo jest publiczne. W przeciwnym razie `mailto:`. |
| Poradniki po angielsku? | Druga iteracja. |

---

## Kolejność wdrożenia i szacunek

| Krok | Zakres | Ok. |
|---|---|---|
| A1 | model, normalizacja, fasada `Comment`, kaskady, testy jednostkowe i scalania | 0,5 dnia |
| A2 | `CommentButton` / `Thread` / `Composer` przy zadaniach, „Piszę jako”, i18n, E2E sync | 1 dzień |
| A3 | wymagania i uwagi ogólne, `CommentsSummary`, plakietka na liście, „nowe od ostatniej wizyty”, kotwice | 0,5–1 dnia |
| A4 | PDF i eksport JSON | 0,5 dnia |
| B1 | wtyczka Markdown, `help.ts`, trasy, nawigacja, `HelpView` / `HelpArticleView`, wyszukiwarka | 1 dzień |
| B2 | 13 poradników PL, `HelpLink` w ekranach, test spójności linków | 1–1,5 dnia |
| B3 | skrypt zrzutów ekranu, EN | 0,5–1 dnia |

Pliki do zmiany: `interfaces.ts`, `store/doc.ts` (komentarz w nagłówku), `store/localState.ts` (`commentAuthorId`, `commentsSeenAt`), `database/Comment.ts` (+ re-eksport `TaskComment.ts`), `database/RankInProgress.ts` (kaskada, zmiana stopnia), `views/CreatingAdvancement.vue`, `components/Advancement/TaskComponent.vue`, `AdvancementCardComponent.vue`, `pdf/advancementViewModel.ts`, `pdf/buildAdvancementPdf.ts`, `export/exportFile.ts`, `scripts/router.ts`, `MobileNavComponent.vue`, `NavBarComponent.vue`, `AllAdvancementsView.vue` (ekran powitalny), `SettingsView.vue`, `vite.config.ts`, `locales/*.json`. Nowe: `components/Comments/*`, `views/HelpView.vue`, `views/HelpArticleView.vue`, `components/Universal/HelpLink.vue`, `scripts/help.ts`, `vite/helpMarkdown.ts`, `src/help/**`.

---

## Stan wdrożenia (2026-10-19)

Zrobione: **A1–A4 i B1–B3** (w tym poradniki EN).

### Decyzje z B.8

| Pytanie | Decyzja w kodzie |
|---|---|
| Komentarze w PDF domyślnie? | Wyłączone. „Dołącz komentarze” + „Tylko otwarte / Wszystkie” w podglądzie, zapamiętane w `rts.pdfComments` i `rts.pdfCommentScope`. |
| Kto może oznaczyć „Załatwione”? | Każdy. Edycja i usuwanie tylko przy własnych komentarzach (według „Piszę jako”). |
| Komentarze do wymagań od razu? | Tak, model i UI. |
| Odpowiedzi w wątku? | Płaski wątek per punkt. |
| „Zgłoś problem” | Link do GitHub Issues (`HELP_ISSUES_URL` w `src/scripts/help.ts`). Jeśli repozytorium jest prywatne, wystarczy podmienić na `mailto:`. |
| Poradniki po angielsku? | Zrobione (13 artykułów, `src/help/en`). Nagłówki mają jawne id `## Title {#polskie-id}`, więc linki „?” działają w obu językach. |

### Odstępstwa od planu (i dlaczego)

1. **Bez `gray-matter`.** Frontmatter to kilka pól `klucz: wartość` i list `[a, b]`, więc wtyczka ma własny mały parser. Jedyna nowa zależność to `marked` (devDependency).
2. **Dwa moduły na artykuł:** `x.md?meta` (meta, nagłówki, tekst do wyszukiwania – w chunku widoku Pomoc) i `x.md` (HTML – osobny, leniwy chunk). Bez tego eager-import meta wciągnąłby treść wszystkich artykułów do jednego chunku.
3. **Brakujący zrzut ekranu nie psuje buildu** (ostrzeżenie Vite, obraz pominięty), za to `tests/unit/help.test.ts` go zgłasza.
4. **WebP bez biblioteki:** skrypt zrzutów konwertuje PNG → WebP w przeglądarce (`canvas.toDataURL('image/webp')`). Projekt Playwright `help-screens` jest włączany tylko przez `HELP_SCREENS=1` (`npm run help:screens`), więc `npm run test:e2e` nie nadpisuje obrazów.
5. **„Otwórz ponownie” zapisuje `null`** w `resolvedAt`/`resolvedById` zamiast je usuwać. Wtedy równoległe „załatw” i „otwórz ponownie” zawsze kończą się spójnym stanem (wszystkie trzy pola od jednego klienta).
6. **„Nowe od ostatniej wizyty”** zapisuje się przy wyjściu z próby i przy schowaniu aplikacji (`visibilitychange`), a kropki w otwartym widoku liczą się od chwili wejścia.
7. **Popup „Zmień stopień”** pojawia się też wtedy, gdy próba nie ma zadań, ale ma komentarze do wymagań.
8. **Eksport JSON:** `advancement.comments` (uwagi ogólne), `advancement.requirements[]` tylko z wymaganiami, które mają komentarze, a komentarze mają `resolved`, `editedAt`, `resolvedAt`, `resolvedBy`.

### Poprawione przy okazji

- `body { overflow-x: clip }` (z `hidden` jako fallbackiem): `position: sticky` znowu działa. Dotyczy spisu treści poradnika i paska podglądu PDF, który wcześniej nie był przyklejony.
- Dolny pasek na telefonie: stuknięcie aktywnej zakładki z podstrony (próba, poradnik) wraca do jej startu. Wcześniej nic się nie działo.
- Polskie formy liczby mnogiej w vue-i18n (`polishPlural`: 1 / 2–4 / 5+).

### Weryfikacja

Środowisko bez dostępu do rejestru npm, więc jak przy RTS 2.0 – zastępczy zestaw narzędzi: zależności z `node_modules` projektu, testy jednostkowe przez `node:test` z nakładką zgodną z API Vitesta (expect z Vitesta), build przez esbuild + `@vue/compiler-sfc` + ta sama wtyczka `vite/helpMarkdown.ts`, a zamiast `wrangler dev` serwer Node z nagłówkami CSP z `public/_headers` i sygnalizacją zgodną z y-webrtc.

- 93 testy jednostkowe, scalania i Workera – zielone (w tym nowe: `comments`, `helpMarkdown`, `helpSearch`, `help` oraz rozszerzone `merge`, `migration`, `pdf`, `exportFile`);
- `vue-tsc` dla `src` i `tests/unit` oraz `tsc` dla `tsconfig.node.json` (z `vite/**`) – bez błędów;
- 14 testów E2E (Chromium) – zielone, w tym: opiekun komentuje na jednym urządzeniu, a podopieczny widzi licznik i oznacza „Załatwione” na drugim (przez WebRTC), link `#zadanie-…` otwiera wątek, bottom-sheet przy 360 px, PDF z komentarzami i bez, wyszukiwarka, „?” otwiera właściwą sekcję, EN, Pomoc offline;
- przejście przez komentarze, PDF i Pomoc z CSP z `public/_headers` – bez naruszeń i bez błędów w konsoli.

**Do sprawdzenia po `npm install`:** `npm run verify` (prawdziwy `vite build` z wtyczką i vite-plugin-pwa), `npm run test:e2e` przez `wrangler dev`, `npm run help:screens` oraz ręcznie: klawiatura w bottom-sheet na iOS Safari i Androidzie.
