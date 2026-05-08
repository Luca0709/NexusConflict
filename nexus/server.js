// ═══════════════════════════════════════════════════════════
//  NEXUS CONFLICT — Multiplayer Server
//  Node.js + Express + Socket.io
//
//  Lokal starten:  npm install  →  npm start
//  Default Port:   3000  (PORT-Environment-Variable überschreibt das)
//
//  Architektur:
//    • Server-authoritativ: Health, Kills, Deaths, Score, Respawn
//    • Client schickt Position/Rotation @ ~30 Hz, Server snapshot @ 20 Hz
//    • Hits: Client raycastet, Server validiert (Distanz + Cooldown)
// ═══════════════════════════════════════════════════════════

const express = require('express');
const http    = require('http');
const path    = require('path');
const { Server } = require('socket.io');

// Geteilte Configs (gleicher Code wie im Browser)
const { WEAPONS, findWeapon } = require('./public/js/shared/weapons.js');
const { MAP_CONFIG, getSpawn } = require('./public/js/shared/maps.js');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: '*' } });

const MAX_HEALTH = 200;

// Statische Dateien aus /public ausliefern
app.use(express.static(path.join(__dirname, 'public')));

// Healthcheck (wichtig für viele Hosting-Plattformen)
app.get('/health', (_req, res) => res.json({ ok: true, rooms: rooms.size }));

// ─── KONFIGURATION ───────────────────────────────────────────
const CONFIG = {
  maxPlayersPerRoom: 8,
  tickRate:          20,    // Server-Ticks/s für Snapshots
  respawnTime:       4000,  // ms
  matchDuration:     600,   // s (10 min)
  scoreLimit:        50,    // TDM/FFA Punktelimit
};

const GAME_MODES = ['tdm', 'ffa', 'domination'];
const ROOM_NAME_MAX  = 32;
const PLAYER_NAME_MAX = 16;

// ─── SERVER-STATE ────────────────────────────────────────────
const rooms   = new Map(); // roomId   -> Room
const players = new Map(); // socketId -> { roomId }

// ─── HELPER ──────────────────────────────────────────────────
const roomId = () => Math.random().toString(36).substring(2, 7).toUpperCase();
const sanitize = (s, max) => String(s || '').replace(/[<>]/g, '').slice(0, max).trim();
const dist3 = (a, b) => {
  const dx=a.x-b.x, dy=a.y-b.y, dz=a.z-b.z;
  return Math.sqrt(dx*dx+dy*dy+dz*dz);
};

function getRoomList() {
  const list = [];
  rooms.forEach((room, id) => {
    list.push({
      id,
      name:       room.name,
      map:        room.map,
      mode:       room.mode,
      players:    room.players.size,
      maxPlayers: CONFIG.maxPlayersPerRoom,
      ping:       Math.floor(Math.random() * 30) + 10, // Demo-Ping
    });
  });
  return list;
}

function broadcastServerList() {
  io.emit('server_list', getRoomList());
}

// ─── ROOM ────────────────────────────────────────────────────
class Room {
  constructor(id, name, map, mode) {
    this.id      = id;
    this.name    = name;
    this.map     = MAP_CONFIG[map] ? map : 'district';
    this.mode    = GAME_MODES.includes(mode) ? mode : 'tdm';
    this.players = new Map(); // socketId -> PlayerState
    this.scores  = { alpha: 0, bravo: 0 };
    this.timeLeft = CONFIG.matchDuration;
    this.running  = false;
    this.tickInterval  = null;
    this.timerInterval = null;
  }

  addPlayer(socketId, displayName, loadout) {
    // Team-Balance: kleineres Team kriegt den neuen Spieler
    const teams = { alpha: 0, bravo: 0 };
    this.players.forEach(p => teams[p.team]++);
    const team = (this.mode === 'ffa') ? 'ffa'
               : (teams.alpha <= teams.bravo) ? 'alpha' : 'bravo';

    const spawn = getSpawn(this.map);

    // Loadout validieren — fallback auf Default
    const primaryWeapon   = findWeapon(loadout?.primary)   || findWeapon('kn44');
    const secondaryWeapon = findWeapon(loadout?.secondary) || findWeapon('mr6');

    const playerState = {
      id:        socketId,
      name:      displayName,
      team,
      pos:       spawn,
      rot:       { yaw: 0, pitch: 0 },
      health:    MAX_HEALTH,
      alive:     true,
      kills:     0,
      deaths:    0,
      xp:        0,
      pose:      'standing',  // 'standing' | 'crouching' | 'sliding'
      lastHit:   0,
      loadout:   { primary: primaryWeapon.id, secondary: secondaryWeapon.id },
    };
    this.players.set(socketId, playerState);
    if (!this.running) this.start();
    return playerState;
  }

  removePlayer(socketId) {
    this.players.delete(socketId);
    if (this.players.size === 0) this.stop();
  }

  start() {
    if (this.running) return;
    this.running = true;

    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      io.to(this.id).emit('timer', this.timeLeft);
      if (this.timeLeft <= 0) this.endMatch('time');
    }, 1000);

    this.tickInterval = setInterval(() => {
      const snapshot = {};
      this.players.forEach((p, id) => {
        snapshot[id] = {
          pos: p.pos, rot: p.rot,
          health: p.health, alive: p.alive,
          name: p.name, team: p.team,
          kills: p.kills, deaths: p.deaths,
          xp: p.xp, pose: p.pose,
        };
      });
      io.to(this.id).emit('snapshot', snapshot);
    }, 1000 / CONFIG.tickRate);
  }

  stop() {
    this.running = false;
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.tickInterval)  clearInterval(this.tickInterval);
  }

  endMatch(reason = 'time') {
    this.stop();
    let winner = 'DRAW';
    if (this.mode === 'tdm') {
      winner = this.scores.alpha > this.scores.bravo ? 'ALPHA'
             : this.scores.bravo > this.scores.alpha ? 'BRAVO' : 'DRAW';
    } else if (this.mode === 'ffa') {
      let topName = '—', topKills = -1;
      this.players.forEach(p => { if (p.kills > topKills) { topKills = p.kills; topName = p.name; } });
      winner = topName;
    }
    io.to(this.id).emit('match_end', { reason, winner, scores: this.scores });
  }

  processHit(shooterId, targetId, weaponId, hitDistance) {
    const shooter = this.players.get(shooterId);
    const target  = this.players.get(targetId);
    if (!shooter || !target || !target.alive) return;
    if (shooter.team !== 'ffa' && shooter.team === target.team) return; // Friendly Fire aus

    // Validierung: existiert die Waffe und stimmt die Distanz grob?
    const weapon = findWeapon(weaponId);
    if (!weapon) return;
    const realDist = dist3(shooter.pos, target.pos);
    if (Math.abs(realDist - hitDistance) > 5)         return; // Cheat-Check
    if (realDist > weapon.range * 1.5)                return; // Außerhalb der Reichweite
    if (Date.now() - target.lastHit < 50)             return; // Spam-Schutz
    target.lastHit = Date.now();

    target.health = Math.max(0, target.health - weapon.dmg);

    // An den Schützen: "Du hast getroffen" (für Hitmarker + Gegner-Healthbar)
    io.to(shooterId).emit('you_hit', {
      targetId: target.id,
      health:   target.health,
      killed:   target.health <= 0,
      xpGain:   target.health <= 0 ? 100 : 0,
    });

    if (target.health <= 0) {
      target.alive = false;
      target.deaths++;
      shooter.kills++;
      shooter.xp += 100;  // +100 XP pro Kill
      if (this.mode === 'tdm') this.scores[shooter.team]++;

      io.to(this.id).emit('player_killed', {
        killerId:   shooter.id,
        killerName: shooter.name,
        victimId:   target.id,
        victimName: target.name,
        weapon:     weapon.name,
        scores:     this.scores,
      });

      // Win-Bedingung
      if (this.mode === 'tdm' && Math.max(this.scores.alpha, this.scores.bravo) >= CONFIG.scoreLimit) {
        this.endMatch('score');
      }

      // Respawn
      setTimeout(() => {
        if (!this.players.has(targetId)) return;
        target.health = MAX_HEALTH;
        target.alive  = true;
        target.pos    = getSpawn(this.map);
        io.to(targetId).emit('respawn', { pos: target.pos });
      }, CONFIG.respawnTime);
    }

    io.to(targetId).emit('take_damage', { health: target.health, fromId: shooter.id });
  }
}

// ─── SOCKET.IO EVENTS ────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[+] ${socket.id} verbunden  (online: ${io.engine.clientsCount})`);

  socket.emit('config', { weapons: WEAPONS, maps: Object.keys(MAP_CONFIG) });

  // Server-Liste anfordern
  socket.on('get_servers', () => socket.emit('server_list', getRoomList()));

  // Server erstellen
  socket.on('create_room', ({ name, map, mode, playerName, loadout }) => {
    if (rooms.size >= 200) return socket.emit('error_msg', 'Server-Limit erreicht');
    const cleanName       = sanitize(name, ROOM_NAME_MAX) || 'Mein Server';
    const cleanPlayerName = sanitize(playerName, PLAYER_NAME_MAX) || 'SPIELER';

    const id = roomId();
    const room = new Room(id, cleanName, (map || '').toLowerCase(), (mode || 'tdm').toLowerCase());
    rooms.set(id, room);

    socket.join(id);
    const ps = room.addPlayer(socket.id, cleanPlayerName, loadout);
    players.set(socket.id, { roomId: id });

    socket.emit('room_joined', {
      roomId: id, map: room.map, mode: room.mode,
      timeLeft: room.timeLeft, scores: room.scores,
      playerState: ps,
    });
    broadcastServerList();
    console.log(`[Room] ${id} erstellt: "${cleanName}" map=${room.map} mode=${room.mode}`);
  });

  // Server beitreten
  socket.on('join_room', ({ roomId: rid, playerName, loadout }) => {
    const room = rooms.get(rid);
    if (!room)                                              return socket.emit('error_msg', 'Server nicht gefunden');
    if (room.players.size >= CONFIG.maxPlayersPerRoom)      return socket.emit('error_msg', 'Server voll');

    const cleanPlayerName = sanitize(playerName, PLAYER_NAME_MAX) || 'SPIELER';
    socket.join(rid);
    const ps = room.addPlayer(socket.id, cleanPlayerName, loadout);
    players.set(socket.id, { roomId: rid });

    socket.emit('room_joined', {
      roomId: rid, map: room.map, mode: room.mode,
      timeLeft: room.timeLeft, scores: room.scores,
      playerState: ps,
    });
    socket.to(rid).emit('player_joined', { id: socket.id, name: ps.name, team: ps.team });
    broadcastServerList();
  });

  // Quickplay: nimm den ersten Server, der passt — oder erstelle einen
  socket.on('quickplay', ({ mode, playerName, loadout }) => {
    let target = null;
    rooms.forEach(r => {
      if (target) return;
      if (r.mode === mode && r.players.size < CONFIG.maxPlayersPerRoom) target = r;
    });
    if (target) {
      socket.emit('quickplay_match', { roomId: target.id });
    } else {
      // Neuen Quick-Server erstellen
      const id = roomId();
      const map = ['district','cargo','deadlock'][Math.floor(Math.random()*3)];
      const room = new Room(id, 'QUICKPLAY ' + id, map, mode);
      rooms.set(id, room);
      broadcastServerList();
      socket.emit('quickplay_match', { roomId: id });
    }
  });

  // Position aktualisieren
  socket.on('move', ({ pos, rot, pose }) => {
    const pd = players.get(socket.id);
    if (!pd) return;
    const room = rooms.get(pd.roomId);
    if (!room) return;
    const p = room.players.get(socket.id);
    if (p && p.alive) {
      p.pos = pos;
      p.rot = rot;
      if (pose === 'standing' || pose === 'crouching' || pose === 'sliding') p.pose = pose;
    }
  });

  // Schuss melden
  socket.on('shoot', ({ targetId, weaponId, hitDistance }) => {
    const pd = players.get(socket.id);
    if (!pd) return;
    const room = rooms.get(pd.roomId);
    if (!room) return;
    // Schuss-Effekt für andere Spieler broadcasten (Sound/Muzzle-Flash)
    socket.to(pd.roomId).emit('player_shot', { id: socket.id, weaponId });
    if (targetId) room.processHit(socket.id, targetId, weaponId, hitDistance);
  });

  // Disconnect
  socket.on('disconnect', () => {
    const pd = players.get(socket.id);
    if (pd) {
      const room = rooms.get(pd.roomId);
      if (room) {
        room.removePlayer(socket.id);
        socket.to(pd.roomId).emit('player_left', { id: socket.id });
        if (room.players.size === 0) {
          rooms.delete(pd.roomId);
          console.log(`[Room] ${pd.roomId} geschlossen (leer)`);
        }
        broadcastServerList();
      }
      players.delete(socket.id);
    }
    console.log(`[-] ${socket.id} getrennt  (online: ${io.engine.clientsCount})`);
  });
});

// ─── START ───────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║   NEXUS CONFLICT — SERVER LÄUFT     ║');
  console.log(`║   http://localhost:${PORT}              ║`);
  console.log('╚══════════════════════════════════════╝\n');
});
