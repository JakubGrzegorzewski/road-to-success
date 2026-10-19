---
title: Offline use and privacy
summary: Where the data lives, what the server sees, how room encryption works and why private browsing is a bad idea.
category: dane
order: 30
keywords: [offline, privacy, personal data, gdpr, encryption, server, security, private mode, incognito, storage]
related: [synchronizacja, kopie-zapasowe, instalacja]
---

## Data only on your devices {#dane-tylko-na-twoich-urzadzeniach}

All data – including mentees' names – is stored in the browser on your devices. The app has **no data server** and no user accounts. Nobody except people with the link to your room can access it.

## Working offline {#praca-offline}

After the first visit the app works without internet: you can browse and change advancements, write comments, create PDFs and read this help. The internet is needed only for [sync](/pomoc/synchronizacja) – changes made offline are sent automatically when the connection is back.

## Room encryption {#szyfrowanie-pokoju}

The room key is in the link, in the part after `#`, which never reaches the server. Everything devices send each other is encrypted with this key. Data flows **directly between devices**. If a direct connection is impossible (e.g. on some mobile networks), the traffic goes through a relay server (TURN), but it stays encrypted.

## What the signalling server sees {#co-widzi-serwer-sygnalizacji}

The server only helps devices find each other. It sees encrypted messages and a hash of the room name, and **nothing of the content**: no people, advancements, tasks or comments. It stores nothing either.

## Persistent storage {#trwale-przechowywanie}

Browsers may delete data of sites that have not been used for a long time (especially Safari). To prevent it:

- [install the app](/pomoc/instalacja) on the home screen,
- in **Settings → Device storage** choose **Ask for persistent storage** if it is shown,
- make [backups](/pomoc/kopie-zapasowe).

## Private browsing {#tryb-prywatny-przegladarki}

In private (incognito) mode browsers often do not allow saving data. The app then warns that changes will be lost when the tab is closed. Use a normal browser window – see also [troubleshooting](/pomoc/problemy#zmiany-znikna-po-zamknieciu-karty).
