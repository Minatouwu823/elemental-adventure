const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const partyList = document.getElementById("partyList");
const inventoryList = document.getElementById("inventoryList");

const ui = {
  hpBar: document.getElementById("hpBar"),
  staminaBar: document.getElementById("staminaBar"),
  energyBar: document.getElementById("energyBar"),
  hpText: document.getElementById("hpText"),
  staminaText: document.getElementById("staminaText"),
  energyText: document.getElementById("energyText"),
  questText: document.getElementById("questText")
};

const world = {
  width: 2400,
  height: 1800,
  obstacles: [
    { x: 260, y: 280, w: 240, h: 140 },
    { x: 640, y: 540, w: 220, h: 150 },
    { x: 1100, y: 380, w: 200, h: 140 },
    { x: 1500, y: 740, w: 250, h: 150 },
    { x: 333, y: 1040, w: 260, h: 140 },
    { x: 840, y: 1060, w: 220, h: 150 },
    { x: 1340, y: 1180, w: 260, h: 160 },
    { x: 1750, y: 1030, w: 240, h: 160 }
  ]
};

const keys = {};

const party = [
  { id: 1, name: "Astra", role: "Pyro", color: "#ff915d", hp: 150, maxHp: 150, stamina: 100, maxStamina: 100, energy: 100, maxEnergy: 100, speed: 235, attack: 24, range: 95, skillDamage: 38, skillRadius: 180, dashBoost: 760, x: 840, y: 660, radius: 18, facing: 0, attackCooldown: 0, skillCooldown: 0, dashCooldown: 0, invuln: 0, combo: 0, comboTimer: 0, alive: true },
  { id: 2, name: "Liora", role: "Cryo", color: "#7ce0ff", hp: 130, maxHp: 130, stamina: 100, maxStamina: 100, energy: 100, maxEnergy: 100, speed: 245, attack: 20, range: 90, skillDamage: 32, skillRadius: 175, dashBoost: 790, x: 840, y: 660, radius: 18, facing: 0, attackCooldown: 0, skillCooldown: 0, dashCooldown: 0, invuln: 0, combo: 0, comboTimer: 0, alive: true },
  { id: 3, name: "Nami", role: "Hydro", color: "#66d4ff", hp: 145, maxHp: 145, stamina: 100, maxStamina: 100, energy: 100, maxEnergy: 100, speed: 238, attack: 19, range: 88, skillDamage: 30, skillRadius: 180, dashBoost: 780, x: 840, y: 660, radius: 18, facing: 0, attackCooldown: 0, skillCooldown: 0, dashCooldown: 0, invuln: 0, combo: 0, comboTimer: 0, alive: true },
  { id: 4, name: "Sora", role: "Anemo", color: "#93f7c9", hp: 140, maxHp: 140, stamina: 100, maxStamina: 100, energy: 100, maxEnergy: 100, speed: 250, attack: 20, range: 90, skillDamage: 30, skillRadius: 182, dashBoost: 820, x: 840, y: 660, radius: 18, facing: 0, attackCooldown: 0, skillCooldown: 0, dashCooldown: 0, invuln: 0, combo: 0, comboTimer: 0, alive: true },
  { id: 5, name: "Volt", role: "Electro", color: "#d6a6ff", hp: 125, maxHp: 125, stamina: 100, maxStamina: 100, energy: 100, maxEnergy: 100, speed: 240, attack: 23, range: 104, skillDamage: 40, skillRadius: 210, dashBoost: 780, x: 840, y: 660, radius: 18, facing: 0, attackCooldown: 0, skillCooldown: 0, dashCooldown: 0, invuln: 0, combo: 0, comboTimer: 0, alive: true },
  { id: 6, name: "Goro", role: "Geo", color: "#f0cd75", hp: 170, maxHp: 170, stamina: 100, maxStamina: 100, energy: 100, maxEnergy: 100, speed: 210, attack: 25, range: 96, skillDamage: 36, skillRadius: 185, dashBoost: 720, x: 840, y: 660, radius: 20, facing: 0, attackCooldown: 0, skillCooldown: 0, dashCooldown: 0, invuln: 0, combo: 0, comboTimer: 0, alive: true }
];

const quests = [
  { id: 1, title: "Forest Sweep", description: "Defeat 5 raiders.", target: 5, progress: 0, type: "kills", complete: false },
  { id: 2, title: "Relic Recovery", description: "Collect 3 relic fragments.", target: 3, progress: 0, type: "relics", complete: false },
  { id: 3, title: "Shrine Defender", description: "Activate the shrine waypoint and survive the wave.", target: 1, progress: 0, type: "waypoint", complete: false }
];

const inventory = {
  herbs: 2,
  relics: 0,
  crystals: 4,
  potions: 1,
  ore: 3
};

const state = {
  activeIndex: 0,
  enemies: [],
  particles: [],
  projectiles: [],
  relics: [
    { x: 240, y: 560 },
    { x: 1700, y: 520 },
    { x: 1080, y: 1400 },
    { x: 1980, y: 1250 }
  ],
  weatherParticles: [],
  cameraX: 0,
  cameraY: 0,
  lastTime: 0,
  wave: 1,
  damageFlash: 0,
  gameOver: false,
  victory: false,
  dayProgress: 0.3,
  shrineActivated: false,
  questIndex: 0
};

const player = { x: 840, y: 660, radius: 18, facing: 0, dashTimer: 0, dashVector: { x: 1, y: 0 }, dashPulse: 0 };

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function angleTo(a, b) {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

function getActive() {
  return party[state.activeIndex];
}

function rectCircleCollision(rect, circle) {
  const closestX = clamp(circle.x, rect.x, rect.x + rect.w);
  const closestY = clamp(circle.y, rect.y, rect.y + rect.h);
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  return dx * dx + dy * dy < circle.radius * circle.radius;
}

function updateInventoryUI() {
  inventoryList.innerHTML = Object.entries(inventory)
    .map(([key, value]) => `<div class="inventory-item"><span>${key}</span><strong>${value}</strong></div>`)
    .join("");
}

function updatePartyUI() {
  partyList.innerHTML = party
    .map((member, index) => {
      const active = index === state.activeIndex ? "active" : "";
      const pct = (member.hp / member.maxHp) * 100;
      return `
        <div class="party-card ${active}" data-index="${index}" style="border-color:${index === state.activeIndex ? "rgba(139,214,255,0.9)" : "rgba(255,255,255,0.08)"};">
          <div class="party-head">
            <div class="party-name"><span class="party-dot" style="background:${member.color}; color:${member.color};"></span>${member.name}</div>
            <span class="party-role">${member.role}</span>
          </div>
          <div class="bar-shell" style="height:8px; margin-top:4px;">
            <div class="bar hp" style="width:${clamp(pct,0,100)}%; background:linear-gradient(90deg, ${member.color}, #f7e8b7);"></div>
          </div>
        </div>
      `;
    })
    .join("");

  partyList.querySelectorAll(".party-card").forEach((card) => {
    card.addEventListener("click", () => {
      const idx = Number(card.dataset.index);
      if (party[idx].alive) switchCharacter(idx);
    });
  });
}

function updateHUD() {
  const active = getActive();
  ui.hpBar.style.width = `${(active.hp / active.maxHp) * 100}%`;
  ui.staminaBar.style.width = `${(active.stamina / active.maxStamina) * 100}%`;
  ui.energyBar.style.width = `${(active.energy / active.maxEnergy) * 100}%`;
  ui.hpText.textContent = `${Math.ceil(active.hp)} / ${active.maxHp}`;
  ui.staminaText.textContent = `${Math.ceil(active.stamina)} / ${active.maxStamina}`;
  ui.energyText.textContent = `${Math.ceil(active.energy)} / ${active.maxEnergy}`;

  const activeQuest = quests.find((q) => !q.complete) || quests[quests.length - 1];
  ui.questText.textContent = `${activeQuest.title}: ${activeQuest.progress}/${activeQuest.target}`;

  updatePartyUI();
  updateInventoryUI();
}

function switchCharacter(index) {
  if (!party[index] || !party[index].alive) return;
  state.activeIndex = index;
  const active = getActive();
  player.x = active.x;
  player.y = active.y;
  player.facing = active.facing;
  updateHUD();
}

function awardInventory(item, amount = 1) {
  inventory[item] = (inventory[item] || 0) + amount;
}

function checkQuestProgress() {
  for (const quest of quests) {
    if (!quest.complete) {
      if (quest.type === "kills") quest.progress = Math.min(quest.target, state.enemiesDefeated);
      if (quest.type === "relics") quest.progress = Math.min(quest.target, inventory.relics);
      if (quest.type === "waypoint") quest.progress = state.shrineActivated ? 1 : 0;
      quest.complete = quest.progress >= quest.target;
    }
  }

  if (quests.every((q) => q.complete)) {
    state.victory = true;
    state.gameOver = false;
  }
}

function addParticles(x, y, color, count, spread = 2.2) {
  for (let i = 0; i < count; i++) {
    state.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 180 * spread,
      vy: (Math.random() - 0.5) * 180 * spread,
      r: 2 + Math.random() * 4,
      life: 0.6 + Math.random() * 0.6,
      color
    });
  }
}

function addProjectile(x, y, tx, ty, color, speed, damage) {
  const dx = tx - x;
  const dy = ty - y;
  const len = Math.hypot(dx, dy) || 1;
  state.projectiles.push({ x, y, vx: (dx / len) * speed, vy: (dy / len) * speed, r: 7, color, damage, life: 1.8 });
}

function spawnEnemy() {
  const margin = 240;
  for (let tries = 0; tries < 50; tries++) {
    const x = Math.random() * (world.width - margin * 2) + margin;
    const y = Math.random() * (world.height - margin * 2) + margin;
    const blocked = world.obstacles.some((rect) => rectCircleCollision(rect, { x, y, radius: 18 }));
    if (!blocked && dist({ x, y }, player) > 260) {
      const roll = Math.random();
      let enemy;
      if (roll < 0.4) {
        enemy = { type: "Raider", hp: 25 + state.wave * 3, maxHp: 25 + state.wave * 3, speed: 85 + state.wave * 6, attack: 9 + state.wave, radius: 18, color: "#ff8d8d", cooldown: 0, hitFlash: 0, x, y };
      } else if (roll < 0.75) {
        enemy = { type: "Warden", hp: 36 + state.wave * 4, maxHp: 36 + state.wave * 4, speed: 75 + state.wave * 5, attack: 12 + state.wave, radius: 20, color: "#ffb26f", cooldown: 0, hitFlash: 0, x, y };
      } else {
        enemy = { type: "Abyss", hp: 50 + state.wave * 5, maxHp: 50 + state.wave * 5, speed: 92 + state.wave * 7, attack: 15 + state.wave, radius: 22, color: "#d39bff", cooldown: 0, hitFlash: 0, x, y };
      }
      state.enemies.push(enemy);
      return;
    }
  }
}

function spawnWave() {
  const count = Math.min(4 + state.wave * 2, 18);
  for (let i = 0; i < count; i++) spawnEnemy();
}

function performAttack() {
  const active = getActive();
  if (active.attackCooldown > 0 || state.gameOver || state.victory) return;

  active.attackCooldown = 0.38;
  active.combo = (active.combo + 1) % 3;
  active.comboTimer = 0.8;

  for (const enemy of state.enemies) {
    const enemyAngle = angleTo({ x: player.x, y: player.y }, enemy);
    const delta = Math.abs(Math.atan2(Math.sin(enemyAngle - player.facing), Math.cos(enemyAngle - player.facing)));
    if (dist(player, enemy) < active.range && delta < 0.95) {
      const damage = active.attack + active.combo * 5 + Math.random() * 3;
      enemy.hp -= damage;
      enemy.hitFlash = 0.15;
      addParticles(enemy.x, enemy.y, active.color, 12, 2.6);
      if (enemy.hp <= 0) {
        state.enemiesDefeated += 1;
        awardInventory("crystals", 1);
        addParticles(enemy.x, enemy.y, "#f6df95", 18, 3.2);
      }
    }
  }

  state.enemies = state.enemies.filter((enemy) => enemy.hp > 0);
  checkQuestProgress();
  if (!state.victory && state.enemiesDefeated > 0 && state.enemiesDefeated % 5 === 0) {
    state.wave += 1;
    spawnWave();
  }
}

function performSkill() {
  const active = getActive();
  if (active.skillCooldown > 0 || active.energy < 35 || state.gameOver || state.victory) return;

  active.energy = clamp(active.energy - 35, 0, active.maxEnergy);
  active.skillCooldown = 2.5;

  for (const enemy of state.enemies) {
    if (dist(player, enemy) < active.skillRadius) {
      let damage = active.skillDamage;
      if (active.role === "Hydro") active.hp = clamp(active.hp + 12, 0, active.maxHp);
      if (active.role === "Anemo") {
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const len = Math.hypot(dx, dy) || 1;
        enemy.x += (dx / len) * 26;
        enemy.y += (dy / len) * 26;
      }
      if (active.role === "Electro") addProjectile(player.x, player.y, enemy.x, enemy.y, "#d6a6ff", 420, damage * 0.6);
      enemy.hp -= damage;
      addParticles(enemy.x, enemy.y, active.color, 16, 3.2);
      if (enemy.hp <= 0) {
        state.enemiesDefeated += 1;
        awardInventory("crystals", 1);
      }
    }
  }

  state.enemies = state.enemies.filter((enemy) => enemy.hp > 0);
  checkQuestProgress();
}

function performDash() {
  const active = getActive();
  if (active.dashCooldown > 0 || active.stamina < 20 || state.gameOver || state.victory) return;

  const inputX = Number(keys.d || keys.ArrowRight) - Number(keys.a || keys.ArrowLeft);
  const inputY = Number(keys.s || keys.ArrowDown) - Number(keys.w || keys.ArrowUp);
  const moveLen = Math.hypot(inputX, inputY) || 1;
  const dirX = inputX === 0 && inputY === 0 ? Math.cos(player.facing) : inputX / moveLen;
  const dirY = inputX === 0 && inputY === 0 ? Math.sin(player.facing) : inputY / moveLen;

  player.dashVector.x = dirX;
  player.dashVector.y = dirY;
  player.dashTimer = 0.18;
  player.dashPulse = 0.18;
  active.dashCooldown = 1.2;
  active.stamina = clamp(active.stamina - 20, 0, active.maxStamina);
}

function tryMove(dx, dy) {
  const active = getActive();
  const nextX = { x: player.x + dx, y: player.y, radius: active.radius };
  const nextY = { x: player.x, y: player.y + dy, radius: active.radius };

  const blockedX = world.obstacles.some((rect) => rectCircleCollision(rect, nextX));
  const blockedY = world.obstacles.some((rect) => rectCircleCollision(rect, nextY));

  if (!blockedX) player.x += dx;
  if (!blockedY) player.y += dy;

  player.x = clamp(player.x, player.radius, world.width - player.radius);
  player.y = clamp(player.y, player.radius, world.height - player.radius);
  active.x = player.x;
  active.y = player.y;
}

function damagePlayer(amount) {
  const active = getActive();
  if (active.invuln > 0 || state.gameOver || state.victory) return;

  active.hp -= amount;
  active.invuln = 0.45;
  state.damageFlash = 0.25;
  addParticles(player.x, player.y, "#ff7d7d", 12, 2.2);

  if (active.hp <= 0) {
    active.hp = 0;
    active.alive = false;
    const nextIndex = party.findIndex((member) => member.alive && member !== active);
    if (nextIndex !== -1) {
      switchCharacter(nextIndex);
      party[nextIndex].hp = Math.max(party[nextIndex].hp, party[nextIndex].maxHp * 0.55);
    } else {
      state.gameOver = true;
    }
  }
}

function updatePlayer(dt) {
  const active = getActive();
  if (!active || !active.alive) return;

  const moveX = Number(keys.d || keys.ArrowRight) - Number(keys.a || keys.ArrowLeft);
  const moveY = Number(keys.s || keys.ArrowDown) - Number(keys.w || keys.ArrowUp);

  if (moveX !== 0 || moveY !== 0) {
    const len = Math.hypot(moveX, moveY) || 1;
    player.facing = Math.atan2(moveY, moveX);
    const dx = (moveX / len) * active.speed * dt;
    const dy = (moveY / len) * active.speed * dt;

    if (player.dashTimer > 0) {
      tryMove(player.dashVector.x * active.dashBoost * dt, player.dashVector.y * active.dashBoost * dt);
      player.dashTimer = Math.max(0, player.dashTimer - dt);
    } else {
      tryMove(dx, dy);
    }
  } else if (player.dashTimer > 0) {
    tryMove(player.dashVector.x * active.dashBoost * dt, player.dashVector.y * active.dashBoost * dt);
    player.dashTimer = Math.max(0, player.dashTimer - dt);
  }

  active.x = player.x;
  active.y = player.y;
  active.facing = player.facing;
  active.attackCooldown = Math.max(0, active.attackCooldown - dt);
  active.skillCooldown = Math.max(0, active.skillCooldown - dt);
  active.dashCooldown = Math.max(0, active.dashCooldown - dt);
  active.invuln = Math.max(0, active.invuln - dt);
  active.stamina = clamp(active.stamina + dt * 18, 0, active.maxStamina);
  active.energy = clamp(active.energy + dt * 8, 0, active.maxEnergy);

  if (active.comboTimer > 0) {
    active.comboTimer = Math.max(0, active.comboTimer - dt);
    if (active.comboTimer === 0) active.combo = 0;
  }

  if (player.dashPulse > 0) player.dashPulse = Math.max(0, player.dashPulse - dt * 2.5);

  const interactedRelic = state.relics.find((r) => !r.collected && dist({ x: player.x, y: player.y }, r) < 35);
  if (interactedRelic && keys.e) {
    interactedRelic.collected = true;
    inventory.relics += 1;
    state.message = "Relic recovered.";
    awardInventory("herbs", 1);
    checkQuestProgress();
  }

  if (dist({ x: player.x, y: player.y }, { x: 1280, y: 850 }) < 55 && keys.e && !state.shrineActivated) {
    state.shrineActivated = true;
    checkQuestProgress();
    inventory.potions += 1;
    state.message = "Shrine activated. Quest complete.";
  }
}

function updateEnemies(dt) {
  for (const enemy of state.enemies) {
    enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
    enemy.cooldown = Math.max(0, enemy.cooldown - dt);

    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const len = Math.hypot(dx, dy) || 1;

    if (len > 1) {
      const moveX = (dx / len) * enemy.speed * dt;
      const moveY = (dy / len) * enemy.speed * dt;
      const nextX = { x: enemy.x + moveX, y: enemy.y, radius: enemy.radius };
      const nextY = { x: enemy.x, y: enemy.y + moveY, radius: enemy.radius };
      const blockedX = world.obstacles.some((rect) => rectCircleCollision(rect, nextX));
      const blockedY = world.obstacles.some((rect) => rectCircleCollision(rect, nextY));
      if (!blockedX) enemy.x += moveX;
      if (!blockedY) enemy.y += moveY;
    }

    if (dist(player, enemy) < enemy.radius + player.radius + 8 && enemy.cooldown <= 0) {
      enemy.cooldown = 0.9;
      damagePlayer(enemy.attack + Math.random() * 4);
    }
  }

  state.enemies = state.enemies.filter((enemy) => enemy.hp > 0);
  if (state.enemies.length < 4 + state.wave && !state.gameOver && !state.victory) spawnEnemy();
}

function updateProjectiles(dt) {
  for (const p of state.projectiles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;

    for (const enemy of state.enemies) {
      if (dist(p, enemy) < p.r + enemy.radius) {
        enemy.hp -= p.damage;
        enemy.hitFlash = 0.2;
        addParticles(p.x, p.y, p.color, 8, 2.2);
        p.life = 0;
        if (enemy.hp <= 0) {
          state.enemiesDefeated += 1;
          awardInventory("crystals", 1);
        }
      }
    }
  }

  state.projectiles = state.projectiles.filter((p) => p.life > 0 && p.x > 0 && p.x < world.width && p.y > 0 && p.y < world.height);
  state.enemies = state.enemies.filter((enemy) => enemy.hp > 0);
  checkQuestProgress();
}

function updateParticles(dt) {
  for (const p of state.particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
  }
  state.particles = state.particles.filter((p) => p.life > 0);
}

function drawBackground() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const skyTop = "#17395a";
  const skyBottom = "#091821";
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, skyTop);
  gradient.addColorStop(1, skyBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let x = -4; x < world.width / 48 + 4; x++) {
    for (let y = -4; y < world.height / 48 + 4; y++) {
      const px = x * 48 - state.cameraX;
      const py = y * 48 - state.cameraY;
      ctx.fillStyle = (x + y) % 2 === 0 ? "#14374b" : "#102b39";
      ctx.fillRect(px, py, 48, 48);
    }
  }

  for (const rect of world.obstacles) {
    const x = rect.x - state.cameraX;
    const y = rect.y - state.cameraY;
    ctx.fillStyle = "#587083";
    ctx.fillRect(x, y, rect.w, rect.h);
    ctx.strokeStyle = "#dfeaf3";
    ctx.strokeRect(x, y, rect.w, rect.h);
  }

  for (const relic of state.relics) {
    if (!relic.collected) {
      const x = relic.x - state.cameraX;
      const y = relic.y - state.cameraY;
      ctx.fillStyle = "#f4d681";
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff3c5";
      ctx.fillRect(x - 4, y - 12, 8, 24);
    }
  }

  const shrineX = 1280 - state.cameraX;
  const shrineY = 850 - state.cameraY;
  ctx.fillStyle = state.shrineActivated ? "#97e9ff" : "#e8c76a";
  ctx.beginPath();
  ctx.arc(shrineX, shrineY, 32, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fef4c7";
  ctx.fillRect(shrineX - 5, shrineY - 52, 10, 52);
}

function drawParticles() {
  for (const p of state.particles) {
    ctx.fillStyle = p.color + "cc";
    ctx.beginPath();
    ctx.arc(p.x - state.cameraX, p.y - state.cameraY, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawProjectiles() {
  for (const p of state.projectiles) {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x - state.cameraX, p.y - state.cameraY, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEnemy(enemy) {
  const sx = enemy.x - state.cameraX;
  const sy = enemy.y - state.cameraY;
  ctx.fillStyle = enemy.hitFlash > 0 ? "#fff0a9" : enemy.color;
  ctx.beginPath();
  ctx.arc(sx, sy, enemy.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(sx - 18, sy - 26, 36, 6);
  ctx.fillStyle = "#9ef5b4";
  ctx.fillRect(sx - 18, sy - 26, (enemy.hp / enemy.maxHp) * 36, 6);
}

function drawCharacterFigure(x, y, member, isPlayer) {
  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath();
  ctx.ellipse(0, member.radius + 9, 18, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(member.facing || 0) * 22, Math.sin(member.facing || 0) * 22);
  ctx.stroke();

  ctx.fillStyle = member.color;
  ctx.beginPath();
  ctx.arc(0, -10, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f9e1d5";
  ctx.beginPath();
  ctx.arc(0, -14, 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = member.color;
  ctx.fillRect(-5, 2, 10, 18);
  ctx.fillRect(-18, 12, 10, 25);
  ctx.fillRect(8, 12, 10, 25);

  if (isPlayer) {
    ctx.strokeStyle = "rgba(255, 225, 150, 0.9)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, 0, 40, member.facing - 0.9, member.facing + 0.9);
    ctx.stroke();
  }

  ctx.restore();
}

function drawPlayer() {
  const active = getActive();
  if (!active || !active.alive) return;
  const sx = player.x - state.cameraX;
  const sy = player.y - state.cameraY;
  drawCharacterFigure(sx, sy, active, true);

  if (player.dashPulse > 0) {
    ctx.strokeStyle = `rgba(136, 216, 255, ${player.dashPulse * 2.8})`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(sx, sy, 36 + player.dashPulse * 50, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawOverlay() {
  if (state.gameOver) {
    ctx.fillStyle = "rgba(4,8,14,0.72)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ff6477";
    ctx.font = "bold 62px Segoe UI";
    ctx.textAlign = "center";
    ctx.fillText("Defeat", canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = "28px Segoe UI";
    ctx.fillStyle = "#eef4ff";
    ctx.fillText("Press F5 to restart", canvas.width / 2, canvas.height / 2 + 32);
  } else if (state.victory) {
    ctx.fillStyle = "rgba(5, 12, 18, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#9fe9ff";
    ctx.font = "bold 62px Segoe UI";
    ctx.fillText("Victory", canvas.width / 2, canvas.height / 2 - 18);
    ctx.font = "28px Segoe UI";
    ctx.fillStyle = "#f0f7ff";
    ctx.fillText("The frontier is secure and the shrines are safe.", canvas.width / 2, canvas.height / 2 + 30);
  }
}

function render() {
  state.cameraX = clamp(player.x - canvas.width / 2, 0, world.width - canvas.width);
  state.cameraY = clamp(player.y - canvas.height / 2, 0, world.height - canvas.height);

  drawBackground();
  drawProjectiles();
  drawParticles();
  for (const enemy of state.enemies) drawEnemy(enemy);
  drawPlayer();
  drawOverlay();

  if (state.damageFlash > 0) {
    ctx.fillStyle = `rgba(255, 90, 90, ${state.damageFlash * 0.5})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    state.damageFlash = Math.max(0, state.damageFlash - 0.03);
  }
}

function tick(timestamp) {
  const dt = Math.min((timestamp - state.lastTime) / 1000 || 0.016, 0.033);
  state.lastTime = timestamp;

  if (!state.gameOver && !state.victory) {
    updatePlayer(dt);
    updateEnemies(dt);
    updateProjectiles(dt);
    updateParticles(dt);
  }

  updateHUD();
  render();
  requestAnimationFrame(tick);
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  keys[key] = true;

  if (key === "j") performAttack();
  if (key === "k") performSkill();
  if (key === "l") performDash();
  if (key >= "1" && key <= "6") {
    const idx = Number(key) - 1;
    if (party[idx] && party[idx].alive) switchCharacter(idx);
  }
});

window.addEventListener("keyup", (event) => {
  keys[event.key.toLowerCase()] = false;
});

window.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  const px = ((event.clientX - rect.left) / rect.width) * canvas.width;
  const py = ((event.clientY - rect.top) / rect.height) * canvas.height;
  const worldX = state.cameraX + px;
  const worldY = state.cameraY + py;
  player.facing = Math.atan2(worldY - player.y, worldX - player.x);
  getActive().facing = player.facing;
});

party.forEach((member) => {
  member.x = player.x;
  member.y = player.y;
  member.facing = 0;
});

spawnWave();
checkQuestProgress();
updateHUD();
requestAnimationFrame(tick);
