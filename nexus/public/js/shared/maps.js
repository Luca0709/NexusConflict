// ═══════════════════════════════════════════════════════════
//  MAPS — Konfiguration & Builder
//  Wird vom Client UND vom Server gelesen (Server nutzt nur
//  Metadaten + Spawn-Points; Geometrie wird clientseitig gebaut).
//
//  Neue Map hinzufügen:
//    1. Eintrag in MAP_CONFIG ergänzen.
//    2. Build-Funktion in MAP_BUILDERS ergänzen (nur Client).
//    3. Spawn-Points definieren — Server respawned darüber.
//
//  Später: Statt prozedural per Code → GLTF-Modell laden
//  (Beispiel ganz unten in dieser Datei).
// ═══════════════════════════════════════════════════════════
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NEXUS_MAPS = factory();
}(typeof self !== 'undefined' ? self : this, function () {

  // ── METADATA + SPAWN-PUNKTE (server- und client-seitig nutzbar) ──
  const MAP_CONFIG = {
    district: {
      id: 'district',
      name: 'DISTRICT',
      skyColor: 0x1a1a2e,
      fogColor: 0x0a0a14,
      fogDensity: 0.025,
      bounds: { minX: -38, maxX: 38, minZ: -38, maxZ: 38 },
      spawnPoints: [
        [0,1.7,30],[8,1.7,28],[-8,1.7,28],[15,1.7,25],[-15,1.7,25],
        [0,1.7,-30],[-8,1.7,-28],[8,1.7,-28],[-15,1.7,-25],[15,1.7,-25],
      ],
      // Optional: 'modelUrl' setzen, dann wird statt buildFn ein GLTF geladen
      // modelUrl: 'assets/models/district.glb',
    },
    cargo: {
      id: 'cargo',
      name: 'CARGO',
      skyColor: 0x0d1117,
      fogColor: 0x050a0f,
      fogDensity: 0.035,
      bounds: { minX: -38, maxX: 38, minZ: -38, maxZ: 38 },
      spawnPoints: [
        [-30,1.7,-30],[-25,1.7,-25],[-30,1.7,30],[-25,1.7,25],
        [30,1.7,-30],[25,1.7,-25],[30,1.7,30],[25,1.7,25],
      ],
    },
    deadlock: {
      id: 'deadlock',
      name: 'DEADLOCK',
      skyColor: 0x12001a,
      fogColor: 0x0a0010,
      fogDensity: 0.04,
      bounds: { minX: -38, maxX: 38, minZ: -38, maxZ: 38 },
      spawnPoints: [
        [0,1.7,30],[-15,1.7,25],[15,1.7,25],
        [0,1.7,-30],[-15,1.7,-25],[15,1.7,-25],
        [-30,1.7,0],[30,1.7,0],
      ],
    },
    amongusskeld: {
      id: 'amongusskeld',
      name: 'AMONGUS_SKELD',
      modelUrl: 'assets/models/among_us_skeld.glb',  // ← NEU
      skyColor: 0x202028, fogColor: 0x101015, fogDensity: 0.025,
      bounds: { minX: -38, maxX: 38, minZ: -38, maxZ: 38 },
      spawnPoints: [[5,5,0],],
    },
    playground: {
      id: 'playground',
      name: 'Playground',
      modelUrl: 'assets/models/Playground.glb',  // ← NEU
      skyColor: 0x6FB7FF,
      bounds: { minX: -38, maxX: 38, minZ: -38, maxZ: 38 },
      spawnPoints: [[5,5,0],],
    },
    city: {
      id: 'city',
      name: 'City',
      modelUrl: 'assets/models/City.glb',  // ← NEU
      skyColor: 0x6FB7FF,
      bounds: { minX: -38, maxX: 38, minZ: -38, maxZ: 38 },
      spawnPoints: [[5,5,0],],
    },
  };

  function getSpawn(mapId) {
    const cfg = MAP_CONFIG[mapId] || MAP_CONFIG.district;
    const p = cfg.spawnPoints[Math.floor(Math.random() * cfg.spawnPoints.length)];
    return { x: p[0], y: p[1], z: p[2] };
  }

  return { MAP_CONFIG, getSpawn };
}));
