# Eigene Maps bauen

Du hast **drei Wege**, eine Map zu erstellen — von schnell-und-einfach bis professionell.

---

## Option A — Prozedural per Code (am schnellsten)

**Wann:** Test-Maps, Box-Arena-Stil, geometrische Layouts.
**Aufwand:** 10-30 Minuten pro Map.
**Optik:** Bunt, einfach, "Greybox" — wie die Default-Maps.

### Schritt 1 — Map registrieren

In `public/js/shared/maps.js`, im `MAP_CONFIG`-Objekt einen neuen Eintrag hinzufügen:

```js
hangar: {
  id: 'hangar',
  name: 'HANGAR',
  skyColor:    0x202028,
  fogColor:    0x101015,
  fogDensity:  0.03,
  bounds:      { minX: -38, maxX: 38, minZ: -38, maxZ: 38 },
  spawnPoints: [
    [0, 1.7, 30], [10, 1.7, 25], [-10, 1.7, 25],
    [0, 1.7, -30], [10, 1.7, -25], [-10, 1.7, -25],
  ],
},
```

### Schritt 2 — Map-Builder schreiben

In `public/game.html`, im `MAP_BUILDERS`-Objekt:

```js
hangar() {
  // Boden
  addBox(80, 0.2, 80, 0, -0.1, 0, makeMat(0x333333, 0.95), false);

  // Zentrale Halle
  addBox(30, 12, 30, 0, 6, 0, makeMat(0x556677, 0.85));

  // Container-Reihen
  for (let i = -2; i <= 2; i++) {
    addBox(4, 3, 8, i * 8, 1.5, -25, makeMat(i % 2 ? 0x884422 : 0x224488));
  }

  // Aussenwände
  addBox(0.5, 8, 80,  40, 4, 0, makeMat(0x223344));
  addBox(0.5, 8, 80, -40, 4, 0, makeMat(0x223344));

  // Atmosphäre
  const pl = new THREE.PointLight(0xffaa44, 2, 30);
  pl.position.set(0, 8, 0);
  scene.add(pl);
}
```

### Schritt 3 — Map im Menü auswählbar machen

In `public/index.html`, im `<select id="smap">` ergänzen:

```html
<option value="hangar">HANGAR</option>
```

Fertig. Server neu starten, Map ist auswählbar.

---

## Option B — Blender modellieren, als GLTF importieren (empfohlen für richtige Maps)

**Wann:** Du willst echte Geometrie — Treppen, Wände mit Texturen, Möbel, Details.
**Aufwand:** 2-10 Stunden pro Map (je nach Detailgrad).
**Optik:** Professionell — wie ein "echtes" Spiel aussehen kann.

### Was du brauchst

- **[Blender](https://www.blender.org)** — kostenlos, Industriestandard für 3D
- Eventuell: Texturen von **[Poly Haven](https://polyhaven.com)** (kostenlos, CC0)
- Das war's — keine Unity, keine Unreal Engine

### Workflow

1. **In Blender modellieren:**
   - Box-Geometrie für Wände, Plattformen, Cover (genau wie im Code, aber visuell)
   - Maßstab beachten: 1 Blender-Einheit = 1 Meter (= Three.js-Einheit)
   - Nicht zu detailliert! 5.000-30.000 Polygone reichen.

2. **Texturen auftragen:**
   - In Blender: jede Fläche kriegt ein "Material" mit BaseColor + Roughness + Normal-Map
   - Free-Texturen z. B. von Poly Haven, AmbientCG, Textures.com

3. **Spawn-Punkte markieren:**
   - In Blender Empty-Objekte (Add → Empty → Plain Axes) an Spawn-Stellen platzieren
   - Benenne sie `Spawn_01`, `Spawn_02`, ...
   - Position später aus Blender ablesen → in `MAP_CONFIG` eintragen

4. **Exportieren:**
   - File → Export → glTF 2.0 (.glb/.gltf)
   - Format: **GLB** (alles in einer Datei)
   - "+Y Up" anhaken, Animation aus, Lighten aus
   - Speichern in: `public/assets/models/hangar.glb`

5. **In den Code laden:**

In `public/js/shared/maps.js` neuen Eintrag mit `modelUrl`:

```js
hangar: {
  id: 'hangar',
  name: 'HANGAR',
  modelUrl: 'assets/models/hangar.glb',  // ← NEU
  skyColor: 0x202028, fogColor: 0x101015, fogDensity: 0.025,
  bounds: { minX: -38, maxX: 38, minZ: -38, maxZ: 38 },
  spawnPoints: [/* ... aus Blender abgelesen */],
},
```

Im `<head>` von `public/game.html` zusätzlich GLTFLoader laden:

```html
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
```

In `loadMap()` in `game.html` GLTF-Support ergänzen:

```js
function loadMap(mapId) {
  mapMeshes.forEach(m => scene.remove(m));
  mapMeshes = [];
  const cfg = MAP_CONFIG[mapId];
  scene.background = new THREE.Color(cfg.skyColor);
  scene.fog = new THREE.FogExp2(cfg.fogColor, cfg.fogDensity);

  if (cfg.modelUrl) {
    // GLTF-Modell laden
    new THREE.GLTFLoader().load(cfg.modelUrl, gltf => {
      gltf.scene.traverse(c => {
        if (c.isMesh) {
          c.castShadow = c.receiveShadow = true;
          mapMeshes.push(c);   // ← wichtig, sonst funktioniert Kollision/Hit nicht!
        }
      });
      scene.add(gltf.scene);
    });
  } else if (MAP_BUILDERS[mapId]) {
    MAP_BUILDERS[mapId]();   // Prozedural-Fallback
  }
  document.getElementById('map-name').textContent = cfg.name;
}
```

Fertig. Three.js lädt das `.glb`, Texturen kommen automatisch mit, Schatten/Kollision funktionieren.

---

## Option C — Sketchfab / kostenlose Asset-Packs

**Wann:** Du willst keine Modelle bauen, nur fertige nutzen.

- **[Sketchfab](https://sketchfab.com/3d-models)** → "Downloadable" + Lizenz "CC0" filtern → `.glb` runterladen
- **[Quaternius](https://quaternius.com)** → komplette Modular-Packs (auch FPS-Maps)
- **[Kenney.nl](https://kenney.nl)** → Lowpoly-Assets, viele kostenlos

Die `.glb`-Datei in `public/assets/models/` ablegen und wie in **Option B** referenzieren.

---

## Brauche ich Unity oder Unreal?

**Nein.** Three.js + Blender reichen für ein Spiel deiner Größenordnung locker aus.

Unity/Unreal lohnt sich, wenn:
- Du Konsolen / Steam beliefern willst
- Du eine komplette Physik-Engine brauchst (Ragdolls, Vehicles, Destruction)
- Du Hunderte detaillierte Animationen hast
- Dein Team ohne Unity-Editor nicht arbeiten kann

Für ein Browser-PvP-Spiel mit 8 Spielern auf statischen Maps ist Three.js die bessere Wahl —
schneller zu deployen, kein Download nötig, jeder kann sofort spielen.

---

## Performance-Faustregeln

- **Polygone gesamt:** unter 100.000 Triangles pro Map
- **Texturen:** maximal 2048×2048, atlassiert wenn möglich
- **Lichter:** maximal 4 dynamische Punktlichter (Three.js wird sonst langsam)
- **`.glb`-Dateigröße:** unter 5 MB pro Map (sonst lädt's zu lange)

Tipp: In Blender vor dem Export "Mesh → Decimate" auf hochpolygonale Objekte anwenden.
