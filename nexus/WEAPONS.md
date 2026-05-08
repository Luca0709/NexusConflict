# Eigene Waffen bauen

Genau wie bei Maps: Du kannst Waffen rein per Code bauen (schnell) oder als 3D-Modell laden (schöner).

---

## Schnell-Variante (Box-Modell, wie Default)

In `public/js/shared/weapons.js` einfach einen neuen Eintrag in der passenden Kategorie hinzufügen:

```js
ar: [
  // ... bestehende Sturmgewehre ...
  {
    id:      'xr2',           // einzigartige ID, klein geschrieben
    name:    'XR-2',           // Anzeigename
    dmg:     38,               // Schaden pro Treffer (1-100)
    rof:     680,              // Schussrate in Schuss/Minute
    ammo:    30,               // Magazingröße
    reserve: 120,              // Reserve-Munition
    range:   65,               // Effektive Reichweite (Server validiert!)
    recoil:  1.0,              // Rückstoß-Stärke
    color:   0x995533,         // Farbe der Box-Waffe
    desc:    'Burst-Modus',    // Tooltip im Loadout-Menü
  },
],
```

**Sofort verfügbar** — Server liest die Datei beim Start, Client beim Page-Load. Keine Code-Änderungen.

### Welche Stats wofür?

| Feld     | Wirkung                                              |
|----------|------------------------------------------------------|
| `dmg`    | Schaden pro Schuss. 100 = One-Hit-Kill bei vollem Health. |
| `rof`    | Schuss/Minute. 600 = 10 Schuss/Sekunde.              |
| `ammo`   | Magazingröße                                         |
| `reserve`| Reserve-Munition                                     |
| `range`  | In Metern (= Three.js-Einheiten). Server cappt bei `range × 1.5`. |
| `recoil` | Mausschlag nach oben pro Schuss                      |
| `color`  | Hex-Farbe (nur falls keine `model:`-URL)             |

---

## 3D-Modell-Variante (richtige Waffe)

### Wo kriegst du Modelle her?

| Quelle                                              | Bemerkung                              |
|-----------------------------------------------------|----------------------------------------|
| **Blender selbst modellieren**                      | Volle Kontrolle, viel Aufwand          |
| **[Sketchfab](https://sketchfab.com/)** (CC0-Filter) | Riesige Auswahl, sofort einsatzbereit |
| **[Quaternius FPS Pack](https://quaternius.com)**   | 30+ Lowpoly-Waffen kostenlos           |
| **[Kenney FPS Asset Pack](https://kenney.nl/assets)** | Cartoony, kostenlos                  |

Modelle sollten als **`.glb`** vorliegen (oder `.gltf`).
Wenn du `.fbx`/`.obj` hast → in Blender öffnen, dann als `.glb` exportieren.

### Schritt 1 — Modell ablegen

```
public/assets/models/weapons/xr2.glb
```

### Schritt 2 — In Waffen-Eintrag verlinken

```js
{
  id:    'xr2',
  name:  'XR-2',
  model: 'assets/models/xr2.glb',
  scale: 0.15,                    // skalieren, falls Modell zu groß ist
  offset: { x: 0.18, y: -0.14, z: -0.35 },  // Position im Sichtfeld
  rotation: { x: 0, y: Math.PI, z: 0 },     // ggf. drehen
  // ... restliche Stats wie oben
}
```

### Schritt 3 — `buildWeaponMesh()` in `game.html` anpassen

```js
const weaponLoader = new THREE.GLTFLoader();

function buildWeaponMesh(weapon) {
  weaponGroup.clear();

  if (weapon.model) {
    weaponLoader.load(weapon.model, gltf => {
      const m = gltf.scene;
      const s = weapon.scale || 1;
      m.scale.set(s, s, s);
      if (weapon.offset)   m.position.set(weapon.offset.x, weapon.offset.y, weapon.offset.z);
      if (weapon.rotation) m.rotation.set(weapon.rotation.x, weapon.rotation.y, weapon.rotation.z);
      weaponGroup.add(m);
    });
    return;
  }

  // Fallback: Box-Modell (alter Code)
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.08, 0.4),
    new THREE.MeshStandardMaterial({ color: weapon.color, roughness: 0.8 }));
  body.position.set(0.18, -0.14, -0.35);
  weaponGroup.add(body);
  // ... (rest wie bisher)
}
```

---

## Skins (gleiche Waffe, andere Optik)

Skins sind nur "Texturen-Tausch" — keine neue Waffen-Logik.

Empfohlene Struktur:

```js
{
  id: 'kn44',
  name: 'KN-44',
  model: 'assets/models/weapons/kn44.glb',
  skins: {
    default: 'assets/textures/kn44_default.png',
    gold:    'assets/textures/kn44_gold.png',
    desert:  'assets/textures/kn44_desert.png',
    cyber:   'assets/textures/kn44_cyber.png',
  },
  // ...
}
```

In `buildWeaponMesh()` nach dem Laden des Modells:

```js
m.traverse(c => {
  if (c.isMesh && weapon.skins?.[selectedSkin]) {
    new THREE.TextureLoader().load(weapon.skins[selectedSkin], tex => {
      c.material.map = tex;
      c.material.needsUpdate = true;
    });
  }
});
```

Den `selectedSkin`-State kannst du im Loadout-Editor vom Spieler wählen lassen
(zusätzliche `<div class="wcard">`-Buttons unter den Stats).

---

## Sounds für Waffen

Three.js hat eingebauten Audio-Support:

```js
const listener = new THREE.AudioListener();
camera.add(listener);

const audioLoader = new THREE.AudioLoader();
const sounds = {};

audioLoader.load('assets/sounds/kn44_fire.mp3', buf => {
  sounds.kn44 = buf;
});

function playShootSound(weaponId) {
  if (!sounds[weaponId]) return;
  const audio = new THREE.Audio(listener);
  audio.setBuffer(sounds[weaponId]);
  audio.setVolume((SETTINGS.sfx || 90) / 100);
  audio.play();
}
```

In `shoot()` aufrufen:

```js
playShootSound(state.currentWeapon.id);
```

Free-Sounds: **[freesound.org](https://freesound.org)**, **[soundbible.com](http://soundbible.com)**, **[zapsplat.com](https://www.zapsplat.com)**.

---

## Cheat-Schutz (Erinnerung!)

Der Server validiert bereits:
- **Reichweite:** Schuss-Distanz wird gegen `range × 1.5` geprüft
- **Existenz:** `weaponId` muss in der Datenbank sein
- **Spam:** Max. ein Treffer-Hit pro Ziel alle 50 ms
- **Friendly Fire:** im selben Team kein Schaden

Wenn du `dmg`-Werte änderst — Server liest die gleiche Datei wie der Client, also kann ein
Spieler den `dmg`-Wert nicht im Browser manipulieren. Server hat immer das letzte Wort.

---

## Reicht das, oder brauche ich Unity?

Das hier reicht für **Browser-FPS mit 8-16 Spielern, Loadouts, Skins, Sounds, Animationen, ADS** völlig aus.

Unity/Unreal lohnt sich erst, wenn du:
- Realistische Reload-Animationen mit Bone-Rigging brauchst
- Physik-basierte Hülsenauswurf, Stoff-Simulation, Ragdolls willst
- Auf Steam veröffentlichst
- Mit einem 5+ Personen Team an einem AAA-Projekt arbeitest

Für deine Zielsetzung — **Browser, 8 Spieler, COD-Stil-Look** — ist Three.js objektiv das richtige Werkzeug.
