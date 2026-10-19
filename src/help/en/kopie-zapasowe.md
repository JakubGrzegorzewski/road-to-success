---
title: Backups
summary: Exporting .rts and JSON backups, importing with merging, the 14-day reminder and the copy kept before “Start from the room's data”.
category: dane
order: 20
keywords: [backup, export, import, rts, json, file, reminder, restore]
related: [synchronizacja, offline-prywatnosc, problemy]
---

Your data exists only on your devices. If they are all lost, or the browser deletes the data, a backup is the only way to get it back.

![Backup in Settings](../img/kopie.webp)

## Exporting a backup (.rts) {#eksport-kopii-rts}

In **Settings** choose **Export backup (.rts)**. The file contains all data: people, advancements, tasks and comments. On a phone the share menu opens – save the file to Files or Drive, or mail it to yourself.

The file name contains the date, e.g. `road-to-success-2026-10-19.rts`.

## Exporting to JSON {#eksport-do-json}

**Export to JSON (read-only)** creates a text file you can open in an editor or process with a program. It contains people, advancements, tasks and comments. **It cannot be imported** – use the `.rts` file for backups.

## Import and merging {#import-i-scalanie}

**Import / merge a backup** (in Settings) or the **Import a backup** tile on the advancement list:

1. Pick an `.rts` file.
2. The app checks the file and shows how many people, advancements and tasks it contains and how many there will be after merging.
3. Choose **Merge**.

Importing **overwrites nothing** – the data from the file is merged with the data on the device. The same file can be imported many times, and importing it again changes nothing.

> [!WARNING]
> An older backup will not bring back something that was deleted later in the same data: the deletion is the newer change and “wins”. To look at the old version, import the backup in another browser or a window that is not in the sync room.

A file from a newer version of the app is rejected with a request to update – refresh the page then.

## Backup reminder {#przypomnienie-o-kopii}

The advancement list and the sync screen show a **Make a backup** reminder when:

- 14 days have passed since the last backup from this device, or
- there has never been a backup and the data is a few days old.

**Export now** makes a backup right away, **Later** postpones the reminder by 3 days.

## The copy from before “Start from the room's data” {#kopia-sprzed-zacznij-od-danych-pokoju}

When you choose [Start from the room's data](/pomoc/synchronizacja#scal-czy-zacznij-od-danych-pokoju) while joining a room, the device's previous data is kept. **Settings** shows “Backup of the data from before joining the room” with two options:

- **Download backup** – saves it as an `.rts` file,
- **Merge it back** – merges it with the current data (and the room's data).
