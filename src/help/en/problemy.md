---
title: Troubleshooting
summary: No changes from the other device, messages about data in another tab and in memory, PDF on iPhone, a missing advancement, duplicated people, starting over.
category: problemy
order: 10
keywords: [problem, error, not working, sync, pdf, iphone, duplicate, duplicates, person, start over, reset, not found]
related: [synchronizacja, kopie-zapasowe, pdf]
---

## I do not see changes from the other device {#nie-widze-zmian-z-drugiego-urzadzenia}

Check one by one:

1. **Are both apps open right now?** Data flows directly between devices, so the other device must have the app open. “Waiting for other devices” means your device is ready, but nobody else is there.
2. **Is it the same room?** In the Sync tab, “Connected now” should show the other device's name. If someone [changed the room](/pomoc/synchronizacja#zmien-pokoj), you need the new link.
3. **Is there internet?** “No internet connection” disappears by itself when the connection is back.
4. **Phone on mobile data, computer on Wi-Fi?** Such a connection sometimes fails. Try connecting both devices to the same Wi-Fi.
5. **Refresh the page** on both devices.

If nothing helps, move the data with a [backup](/pomoc/kopie-zapasowe): export on one device, import on the other. Importing merges data and overwrites nothing.

## “The data was replaced in another tab” {#dane-zostaly-zastapione-w-innej-karcie}

The app is open in several tabs and in one of them “Start from the room's data” was chosen. The other tabs must reload – choose **Reload**. Nothing is lost: the previous data is in [Settings](/pomoc/kopie-zapasowe#kopia-sprzed-zacznij-od-danych-pokoju).

## “Changes will be lost when the tab is closed” {#zmiany-znikna-po-zamknieciu-karty}

The browser does not allow saving data – usually because of private (incognito) mode or blocked site data. What to do:

- open the app in a normal browser window,
- in the browser's settings allow this site to store data (cookies and site data),
- before closing the tab [export a backup](/pomoc/kopie-zapasowe#eksport-kopii-rts) or connect to another device with [sync](/pomoc/synchronizacja).

## The PDF does not download on an iPhone {#pdf-nie-pobiera-sie-na-iphonie}

- When the **PDF ready** window appears, tap **Share** or **Download** – iOS needs an extra tap when creating the file took longer.
- In the share sheet choose **Save to Files**.
- If the PDF opened in a new tab, use that tab's share button.
- Try Safari and check that the system is up to date.

More in [Preview and PDF](/pomoc/pdf#zapis-i-udostepnianie).

## “This advancement was not found” {#nie-znaleziono-tej-proby}

The advancement was deleted on another device or has not reached this device yet (e.g. you open a link to an advancement on a new phone). Open the app on a device that has the advancement and wait for sync – the view refreshes by itself when it arrives.

Deleting is synced to all devices in the room. You can look for an older version in a [backup](/pomoc/kopie-zapasowe#import-i-scalanie).

## The same person is listed twice {#ta-sama-osoba-jest-na-liscie-dwa-razy}

This happens when the same person was added separately on two devices and the data was merged later (by sync or import). The app does not merge people automatically, because it cannot know it is really the same person.

- In advancements choose one of them as mentee or mentor. The other one simply stays unused.
- Next time: on a new device **join the room first**, and only then add people.

## How to start over {#jak-zaczac-od-nowa}

- **One device that should take the room's data:** join the room and choose [Start from the room's data](/pomoc/synchronizacja#scal-czy-zacznij-od-danych-pokoju).
- **I want to clear this device:** first make a [backup](/pomoc/kopie-zapasowe), then delete this site's data in the browser's settings. The app starts like the first time.

> [!WARNING]
> Clearing the data on one device does not remove it from the other devices in the room. If you join that room again, the data comes back.
