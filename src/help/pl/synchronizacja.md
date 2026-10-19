---
title: Synchronizacja między urządzeniami
summary: Jak połączyć telefon i komputer albo urządzenia opiekuna i podopiecznego, żeby pracować na tych samych danych.
category: dane
order: 10
keywords: [sync, synchronizacja, link, qr, kod qr, pokój, telefon, komputer, urządzenie, połączenie, zmień pokój, scal]
related: [kopie-zapasowe, offline-prywatnosc, problemy]
---

Synchronizacja łączy urządzenia w **pokój**. Wszystkie urządzenia w pokoju mają te same dane, a zmiany z jednego pojawiają się na pozostałych w ciągu sekundy. Zmiany zrobione w tym samym czasie są scalane – nic nie jest nadpisywane.

![Ekran synchronizacji](../img/synchronizacja.webp)

## Jak połączyć urządzenia

1. Na pierwszym urządzeniu (tym, na którym są już dane) otwórz zakładkę **Synchronizacja** i wybierz **Utwórz pokój**.
2. Przekaż link do pokoju drugiemu urządzeniu: **Kopiuj link**, **Udostępnij link** albo **Pokaż kod QR**.
3. Na drugim urządzeniu otwórz link (albo zeskanuj kod aparatem). Możesz też wkleić link w polu „Dołącz do pokoju”.
4. Po chwili oba urządzenia pokażą „Zsynchronizowano z 1 urządzeniem”.

> [!WARNING]
> **Link to klucz do wszystkich danych.** Każdy, kto go ma, może czytać i zmieniać próby, zadania i komentarze. Wysyłaj go tylko zaufanym osobom.

## Link i kod QR

Link wygląda tak: `…/dolacz#r=…&k=…`. Część po znaku `#` to nazwa pokoju i klucz szyfrowania. Ta część nigdy nie trafia na serwer, a po dołączeniu aplikacja usuwa ją z paska adresu. Kod QR zawiera ten sam link – najwygodniej przenieść nim dostęp z komputera na telefon.

## Stany synchronizacji

Stan widać w nagłówku (na komputerze) albo jako kropkę na zakładce „Synchronizacja” (na telefonie):

| Stan | Co znaczy |
|---|---|
| **Zsynchronizowano z n urządzeniami** (zielony) | Połączenie działa, dane są aktualne. |
| **Czeka na inne urządzenia** (niebieski) | Twoje urządzenie jest w pokoju, ale żadne inne nie ma teraz otwartej aplikacji. |
| **Czeka na połączenie** (pomarańczowy) | Trwa łączenie. Jeśli trwa długo, zobacz [rozwiązywanie problemów](/pomoc/problemy#nie-widze-zmian-z-drugiego-urzadzenia). |
| **Brak internetu** (czerwony) | Pracujesz offline. Zmiany zapisują się na urządzeniu i wyślą się po powrocie internetu. |
| **Tylko to urządzenie** (szary) | Urządzenie nie jest w żadnym pokoju. |

> [!NOTE]
> Dane płyną **bezpośrednio między urządzeniami**. Synchronizacja działa więc tylko wtedy, gdy co najmniej dwa urządzenia mają jednocześnie otwartą aplikację. Gdy to niemożliwe, przenieś dane [kopią zapasową](/pomoc/kopie-zapasowe).

## Nazwa urządzenia i lista połączonych

W polu **Nazwa tego urządzenia** wpisz np. „Telefon Kuby”. Pozostałe urządzenia zobaczą tę nazwę na liście **Połączone teraz**. Lista pokazuje urządzenia, które w tej chwili mają otwartą aplikację w tym pokoju.

## Scal czy zacznij od danych pokoju

Jeśli dołączasz do pokoju na urządzeniu, na którym są już jakieś dane, aplikacja zapyta, co z nimi zrobić:

- **Scal z pokojem** – Twoje dane i dane pokoju łączą się. Wybierz to, gdy na obu urządzeniach są różne, potrzebne próby.
- **Zacznij od danych pokoju** – urządzenie przyjmuje tylko dane pokoju. Wybierz to, gdy Twoje dane to np. testowa próba albo duplikat. Dotychczasowe dane nie przepadają: zostają jako kopia w [Ustawieniach](/pomoc/kopie-zapasowe#kopia-sprzed-zacznij-od-danych-pokoju).

> [!TIP]
> Na nowym urządzeniu najpierw dołącz do pokoju, a dopiero potem dodawaj osoby i próby. Unikniesz wtedy zdublowanych osób.

## Zmień pokój

**Zmień pokój (odbierz dostęp)** tworzy nowy pokój z nowym kluczem. Urządzenia ze starym linkiem przestają się synchronizować i nie dostaną już nowych zmian. Użyj tego, gdy:

- zgubisz telefon, który był w pokoju,
- link trafił do niewłaściwej osoby,
- kończysz współpracę z kimś, kto miał dostęp.

Po zmianie wyślij nowy link tylko tym urządzeniom, które mają zostać. Dane, które już są na starych urządzeniach, tam zostają – zmiana pokoju ich nie usuwa.

## Opuść pokój

**Opuść pokój** wyłącza synchronizację na tym urządzeniu. Dane zostają na nim, a pozostałe urządzenia zachowują swoje kopie.
