// ═══════════════════════════════════════════════════════════
//  WEAPONS — Single Source of Truth
//  Wird vom Client UND vom Server gelesen.
//
//  Neue Waffe hinzufügen:
//    1. Eintrag in der passenden Kategorie ergänzen.
//    2. Optional: model: 'pfad/zur/datei.glb'  (sonst Box-Modell)
//    3. Speichern. Fertig — überall verfügbar.
// ═══════════════════════════════════════════════════════════
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NEXUS_WEAPONS = factory();
}(typeof self !== 'undefined' ? self : this, function () {

  const WEAPONS = {
    ar: [
      { id:'kn44',  name:'KN-44',   dmg:34, rof:600, ammo:30, reserve:90,  range:60, recoil:1.2, color:0x888888, desc:'Vollautomatisch' },
      { id:'hvk30', name:'HVK-30',  dmg:28, rof:780, ammo:36, reserve:108, range:50, recoil:0.9, color:0x667788, desc:'Hohe Feuerrate' },
      { id:'icr1',  name:'ICR-1',   dmg:30, rof:560, ammo:30, reserve:90,  range:75, recoil:0.7, color:0x886655, desc:'Wenig Rückstoß' },
      {
        id:    'ak47',
        name:  'AK 47',
        model: 'assets/models/AK47.glb',
        scale: 0.2,                    // skalieren, falls Modell zu groß ist
        offset: { x: 0.18, y: -0.27, z: -0.2 },  // Position im Sichtfeld: x: links oder rechts von dir, y: auf oder ab, z: näher oder weiter weg
        rotation: { x: 0, y: Math.PI/2, z: 0 },     // ggf. drehen     MATH.PI für 180 Grad drehung, Derweil NUR bei Y ändern, dass Waffe geradeaus zeigt.
        dmg:38, rof:485, ammo:30, reserve:90,  range:79, recoil:1.4, desc:'Sturmgewehr mit hoher Reichweite und erhöhtem Schaden. Hohe Durchschlagskraft bei niedrigerem RPM',
      },
      {
        id:    'm16',
        name:  'M16 A4',
        model: 'assets/models/M16.glb',
        scale: 0.2,                    // skalieren, falls Modell zu groß ist
        offset: { x: 0.18, y: -0.295, z: -0.2 },  // Position im Sichtfeld: x: links oder rechts von dir, y: auf oder ab, z: näher oder weiter weg
        rotation: { x: 0, y: Math.PI/2, z: 0 },     // ggf. drehen     MATH.PI für 180 Grad drehung, Derweil NUR bei Y ändern, dass Waffe geradeaus zeigt.
        dmg:42, rof:510, ammo:24, reserve:72,  range:72, recoil:1.6, desc:'Burst-Sturmgewehr mit hoher Reichweite und moderaten Schaden. Stark auf mittlerer Distanz.',
      },
    ],
    smg: [
      { id:'vesper',    name:'Vesper',    dmg:24, rof:900, ammo:25, reserve:100, range:30, recoil:0.6, color:0x557788, desc:'Schnellste SMG' },
      { id:'razorback', name:'Razorback', dmg:32, rof:680, ammo:30, reserve:90,  range:40, recoil:1.0, color:0x776655, desc:'Schwere SMG' },
      { id:'pharo',     name:'Pharo',     dmg:28, rof:760, ammo:20, reserve:80,  range:35, recoil:0.8, color:0x888866, desc:'Burst-SMG' },
      {
        id:    'ak47u',
        name:  'AK 47u',
        model: 'assets/models/ak47u.glb',
        scale: 0.2,                    // skalieren, falls Modell zu groß ist
        offset: { x: 0.18, y: -0.27, z: -0.2 },  // Position im Sichtfeld: x: links oder rechts von dir, y: auf oder ab, z: näher oder weiter weg
        rotation: { x: 0, y: Math.PI/2, z: 0 },     // ggf. drehen     MATH.PI für 180 Grad drehung, Derweil NUR bei Y ändern, dass Waffe geradeaus zeigt.
        dmg:31, rof:810, ammo:30, reserve:90,  range:37, recoil:1.2, color:0x888866, desc:'Vollautomatische SMG, kleiner Bruder der AK47.',      },
      {
        id:    'vmp',
        name:  'VMP',
        model: 'assets/models/VMP.glb',
        scale: 0.2,                    // skalieren, falls Modell zu groß ist
        offset: { x: 0.18, y: -0.315, z: -0.2 },  // Position im Sichtfeld: x: links oder rechts von dir, y: auf oder ab, z: näher oder weiter weg
        rotation: { x: 0, y: Math.PI/2, z: 0 },     // ggf. drehen     MATH.PI für 180 Grad drehung, Derweil NUR bei Y ändern, dass Waffe geradeaus zeigt.
        
        dmg:33, rof:905, ammo:32, reserve:96,  range:31, recoil:1.4, color:0x888866, desc:'Vollautomatische SMG, Nahkampfmonster mit sehr hoher Geschossgeschwindigkeit.',
      },
    ],
    sniper: [
      { id:'locus', name:'Locus',   dmg:100, rof:50, ammo:5, reserve:20, range:200, recoil:3.0, color:0x556677, desc:'One-Shot Bolt' },
      { id:'svg',   name:'SVG-100', dmg:85,  rof:90, ammo:7, reserve:28, range:180, recoil:2.2, color:0x667755, desc:'Halbautomatisch' },
    ],
    pistol: [
      { id:'mr6',     name:'MR6',     dmg:28, rof:480, ammo:12, reserve:48, range:30, recoil:0.5, color:0x777777, desc:'Standardpistole' },
      { id:'rk5',     name:'RK5',     dmg:34, rof:380, ammo:10, reserve:40, range:35, recoil:0.7, color:0x666666, desc:'Burst-Pistole' },
      { id:'marshal', name:'Marshal', dmg:80, rof:120, ammo:2,  reserve:16, range:25, recoil:2.5, color:0x886644, desc:'Hand Cannon' },
    ],
    knife: [
      { id:'combat',    name:'Kampfmesser',     dmg:100, rof:200, ammo:0, reserve:0, range:2, recoil:0, color:0x444444, desc:'Letale Nahkampfwaffe' },
      { id:'butterfly', name:'Butterfly Knife', dmg:90,  rof:280, ammo:0, reserve:0, range:2, recoil:0, color:0x666666, desc:'Schnelle Klinge' },
    ],
  };

  // Hilfsfunktion: Waffe per ID finden (cross-Kategorie).
  function findWeapon(id) {
    for (const cat in WEAPONS) {
      const w = WEAPONS[cat].find(w => w.id === id);
      if (w) return { ...w, category: cat };
    }
    return null;
  }

  return { WEAPONS, findWeapon };
}));
