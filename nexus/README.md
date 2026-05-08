# NEXUS CONFLICT

Browser-basierter PvP First-Person-Shooter im Stil von Call of Duty Black Ops 3.
**Stack:** Node.js + Express + Socket.io (Server) · Three.js + Vanilla JS (Client) · keine Build-Tools nötig.

---

## Projektstruktur

```
nexus/
├── server.js                    Multiplayer-Server (Node.js)
├── package.json
├── public/                      Alles, was der Browser sieht
│   ├── index.html               Hauptmenü
│   ├── game.html                Spielbildschirm (Three.js)
│   ├── js/shared/
│   │   ├── weapons.js           Waffen-Datenbank (Server + Client)
│   │   └── maps.js              Map-Configs & Spawnpoints
│   └── assets/                  Eigene Texturen, 3D-Modelle, Sounds
├── README.md                    diese Datei
├── MAPS.md                      eigene Maps bauen
└── WEAPONS.md                   eigene Waffen bauen
```

---

## Lokal starten

Voraussetzung: **Node.js ≥ 18** ([nodejs.org](https://nodejs.org)).

```bash
cd nexus
npm install
npm start
```

Browser öffnen: <http://localhost:3000>

Zum Testen mehrere Browser-Tabs parallel öffnen — jeder Tab ist ein eigener Spieler.
Tab 1 erstellt Server → andere Tabs sehen ihn im Server-Browser → beitreten.

---

## Auf einer Website hosten

Da das ein **Echtzeit-Multiplayer-Spiel mit WebSockets** ist, brauchst du einen Anbieter,
der dauerhaft laufende Node-Prozesse + WebSockets unterstützt. Standard-Webhoster
(Netlify, GitHub Pages) gehen **nicht**.

### Empfohlene Optionen (mit Free-Tier)

| Anbieter      | Setup-Aufwand | Skalierung           | Bemerkung                                    |
|---------------|---------------|----------------------|----------------------------------------------|
| **Render**    | sehr einfach  | gut                  | "Web Service" → Repo verbinden → fertig      |
| **Railway**   | einfach       | gut                  | `railway up`, GitHub-Integration             |
| **Fly.io**    | mittel        | sehr gut (global)    | für Latenz wichtig                           |
| **Heroku**    | einfach       | mäßig                | nicht mehr kostenlos, aber bekannt           |
| **Hetzner / DigitalOcean / VPS** | hoch | beste Kontrolle | bei Skalierung billiger                      |

### Render (3-Minuten-Anleitung)

1. Repo auf GitHub pushen.
2. Auf <https://render.com> → "New +" → "Web Service" → Repo wählen.
3. Settings: Build = `npm install`, Start = `npm start`.
4. Deploy. Die URL bekommst du danach (z. B. `nexus-conflict.onrender.com`).
5. Fertig — die kostenlose Stufe schläft nach 15 min Inaktivität ein, das reicht zum Testen.

### Wichtig für Production

- **HTTPS ist Pflicht** für Pointer Lock und manche Browser-Features. Render/Railway/Fly liefern das automatisch.
- Server liest `process.env.PORT` automatisch — nicht ändern, sonst funktioniert kein Hoster.
- CORS ist auf `*` offen — vor Production auf deine Domain einschränken (siehe `server.js`, Zeile mit `cors:`).

---

## Wie spielbar ist das in einem Tab vs. zwischen Geräten?

- **Lokal:** Beliebig viele Tabs auf demselben PC — jeder Tab ist ein eigener Spieler.
- **Online:** Jeder verbindet sich von seinem Gerät auf deine gehostete URL.
- **Maximal pro Server-Room:** 8 Spieler (in `server.js` änderbar via `CONFIG.maxPlayersPerRoom`).
- **Maximal Rooms gleichzeitig:** ~200 (Limit in `server.js`).

Realistische Spieleranzahl pro VPS (1 vCPU, 1 GB RAM): **etwa 100 gleichzeitige Spieler** auf 12-15 Räumen.
Für mehr brauchst du Sharding (mehrere Server, Spieler werden auf einen verteilt) — das ist erst bei
ein paar tausend gleichzeitigen Spielern relevant.

---

## Was bisher funktioniert

- ✅ Server-Browser mit echten Räumen, Live-Updates
- ✅ Server erstellen / beitreten / Quickplay
- ✅ Loadout-Editor (Waffen werden in `localStorage` gespeichert)
- ✅ Three.js FPS mit Pointer Lock, WASD, Sprint, Sprung
- ✅ Live-Synchronisation der Spieler-Positionen (~20 Hz Snapshot)
- ✅ Hit-Detection (Client-Raycast → Server-Validation)
- ✅ Server-authoritative Health, Kills, Deaths, Score
- ✅ Auto-Respawn nach 4 s
- ✅ Kill-Feed, Death-Screen, Hit-Marker, Schadens-Vignette
- ✅ Match-Timer, Score-Limit, Match-End-Screen
- ✅ Team Deathmatch + Free For All
- ✅ Waffen-Wechsel (1 / 2)

## Was du noch ergänzen könntest

- Domination-Modus (Zonen capturen) — Gerüst existiert bereits (`mode: 'domination'`)
- Granaten / Equipment / Perks
- Skins und Killcam
- Sound-Effekte (Three.js + `THREE.Audio`)
- Sprint-Anim, Jiggle bei Bewegung, ADS-Zoom (FOV-Animation)
- Anti-Cheat (Server-Side: Geschwindigkeits-Validation, Wallhack-Erkennung)
- Persistente Stats / Leveling (mit Datenbank, z. B. SQLite oder Postgres)

---

## Eigene Maps & Waffen

Siehe **[MAPS.md](MAPS.md)** und **[WEAPONS.md](WEAPONS.md)**.

Kurz: **Du brauchst keine Engine wie Unity.** Maps modellierst du in **Blender** (kostenlos),
exportierst als `.glb`-Datei und Three.js lädt sie direkt mit dem `GLTFLoader`. Genauso für Waffen.

---

## Troubleshooting

| Problem | Lösung |
|---------|--------|
| `EADDRINUSE :3000` | Anderer Prozess läuft auf Port 3000. `PORT=3001 npm start` |
| Pointer-Lock funktioniert nicht | Nur auf `https://` oder `localhost`. `http://` über IP geht nicht. |
| "Server nicht verbunden" | `npm start` läuft? Firewall? F12 öffnen, Konsole checken. |
| Lag / Ruckeln | `tickRate` in `server.js` anpassen (Standard 20). Höhere Rate = mehr Last. |
| Spieler unsichtbar | Browser-Konsole checken — meist fehlende Map oder Loadout. |
