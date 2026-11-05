import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ========================================
// ELEMENTOS DO MENU E DOM
// ========================================

const menu = document.querySelector('#main-menu');
const container = document.querySelector('#game-container');

const playAiButton = document.querySelector('#play-ai-button');
const playPvpButton = document.querySelector('#play-pvp-button');
const optionsButton = document.querySelector('#options-button');
const creditsButton = document.querySelector('#credits-button');

const instructionsButton = document.querySelector('#instructions-button');
const instructionsModal = document.querySelector('#instructions-modal');
const closeInstructions = document.querySelector('#close-instructions');

const modal = document.querySelector('#modal');
const modalTitle = document.querySelector('#modal-title');
const modalBody = document.querySelector('#modal-body');
const closeModal = document.querySelector('#close-modal');

if (!menu || !container) {
  throw new Error('Elementos principais do jogo não encontrados.');
}

let isAiMode = true;
let gameStarted = false;

// ========================================
// INTERFACE DE USUÁRIO (HUD & CONTAGEM)
// ========================================

const uiContainer = document.createElement('div');
uiContainer.id = 'hud-container';
uiContainer.style.cssText = `
  position: absolute;
  top: 20px;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 0 40px;
  box-sizing: border-box;
  z-index: 10;
  pointer-events: none;
  font-family: Orbitron, sans-serif;
`;

uiContainer.innerHTML = `
  <div style="width: 40%;">
    <div style="color: #a855f7; font-weight: bold; font-size: 16px; margin-bottom: 5px; text-shadow: 0 0 5px #000;">PURPLEFLY (P1)</div>
    <div style="width: 100%; height: 20px; background: rgba(0, 0, 0, 0.6); border: 2px solid #a855f7; border-radius: 10px; overflow: hidden;">
      <div id="hp-bar-p1" style="width: 100%; height: 100%; background: linear-gradient(90deg, #a855f7, #c084fc); transition: width 0.3s ease;"></div>
    </div>
  </div>

  <div style="width: 40%; text-align: right;">
    <div id="p2-label" style="color: #38bdf8; font-weight: bold; font-size: 16px; margin-bottom: 5px; text-shadow: 0 0 5px #000;">Eternal (IA)</div>
    <div style="width: 100%; height: 20px; background: rgba(0, 0, 0, 0.6); border: 2px solid #38bdf8; border-radius: 10px; overflow: hidden;">
      <div id="hp-bar-p2" style="width: 100%; height: 100%; background: linear-gradient(90deg, #38bdf8, #818cf8); float: right; transition: width 0.3s ease;"></div>
    </div>
  </div>
`;

container.appendChild(uiContainer);

const countdownOverlay = document.createElement('div');
countdownOverlay.id = 'countdown-overlay';
countdownOverlay.style.cssText = `
  position: absolute;
  top: 40%;
  width: 100%;
  text-align: center;
  color: #a855f7;
  font-size: 90px;
  font-weight: 900;
  font-family: Orbitron, sans-serif;
  text-shadow: 0 0 25px #a855f7, 0 0 10px #000;
  display: none;
  z-index: 20;
  pointer-events: none;
`;
container.appendChild(countdownOverlay);

const victoryOverlay = document.createElement('div');
victoryOverlay.id = 'victory-overlay';
victoryOverlay.style.cssText = `
  position: absolute;
  top: 30%;
  width: 100%;
  text-align: center;
  color: #fbbf24;
  font-size: 32px;
  font-weight: bold;
  font-family: Orbitron, sans-serif;
  text-shadow: 0 0 15px rgba(251, 191, 36, 0.8), 0 0 5px #000;
  display: none;
  z-index: 20;
`;
victoryOverlay.innerHTML = `
  <div id="victory-title">VOCÊ GANHOU!</div>
  <div id="victory-subtitle" style="font-size: 18px; color: #fff; margin-top: 10px; text-shadow: 0 0 10px #a855f7;">A caixa foi recuperada.</div>
`;
container.appendChild(victoryOverlay);

// ========================================
// EVENTOS DE MODAIS
// ========================================

function openModal(title, content) {
  if (!modal || !modalTitle || !modalBody) return;
  modalTitle.textContent = title;
  modalBody.innerHTML = content;
  modal.classList.remove('hidden');
}

function hideModal() {
  if (modal) modal.classList.add('hidden');
}

if (optionsButton) {
  optionsButton.addEventListener('click', () => {
    openModal('CONTROLES DE COMBATE', `
      <p><b>P1 (PurpleFly):</b><br>
      A/D: Mover | Espaço: Pular<br>
      J: Ataque Normal | K: Defesa | <b>U: Especial Mágico</b></p>
      <br>
      <p><b>P2 (Eternal):</b><br>
      Seta Esquerda/Direita: Mover | Seta Cima: Pular<br>
      L: Ataque Normal | I: Defesa | <b>O: Especial Mágico</b></p>
    `);
  });
}

if (creditsButton) {
  creditsButton.addEventListener('click', () => {
    openModal('CRÉDITOS', '<p>MIRACULOUS KOMBAT</p><p>Desenvolvimento: G Produções</p><p>Tecnologia: Three.js & JavaScript</p><p>Ano: 2026</p>');
  });
}

if (closeModal) closeModal.addEventListener('click', hideModal);
if (modal) {
  modal.addEventListener('click', (event) => {
    if (event.target === modal) hideModal();
  });
}

if (instructionsButton && instructionsModal) {
  instructionsButton.addEventListener('click', () => instructionsModal.classList.remove('hidden'));
}

if (closeInstructions && instructionsModal) {
  closeInstructions.addEventListener('click', () => instructionsModal.classList.add('hidden'));
}

if (instructionsModal) {
  instructionsModal.addEventListener('click', (event) => {
    if (event.target === instructionsModal) instructionsModal.classList.add('hidden');
  });
}

// ========================================
// CENA THREE.JS
// ========================================

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x10091c, 18, 45);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 3.5, 12);
camera.lookAt(0, 2, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setClearColor(0x000000, 0);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

container.appendChild(renderer.domElement);

// ILUMINAÇÃO
const ambientLight = new THREE.AmbientLight(0xffffff, 2);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
directionalLight.position.set(5, 10, 7);
directionalLight.castShadow = true;
scene.add(directionalLight);

const purpleLight = new THREE.PointLight(0x9b35ff, 30, 15);
purpleLight.position.set(-3, 4, 2);
scene.add(purpleLight);

// CHÃO DA ARENA
const floor = new THREE.Mesh(
  new THREE.BoxGeometry(20, 0.5, 8),
  new THREE.MeshStandardMaterial({ color: 0x32164c, roughness: 0.65, metalness: 0.25 })
);
floor.position.y = -0.25;
floor.receiveShadow = true;
scene.add(floor);

// ========================================
// LÓGICA DE COMBATE, MODELOS E PROJÉTEIS
// ========================================

const loader = new GLTFLoader();
const MAX_HP = 300;

// SISTEMA DE PROJÉTEIS (ESPECIAIS)
const projectiles = [];

function createSpecialProjectile(ownerId, xPos, direction, colorHex) {
  const geo = new THREE.SphereGeometry(0.35, 16, 16);
  const mat = new THREE.MeshBasicMaterial({ color: colorHex });
  const mesh = new THREE.Mesh(geo, mat);

  const light = new THREE.PointLight(colorHex, 10, 5);
  mesh.add(light);

  mesh.position.set(xPos, 1.8, 0);
  scene.add(mesh);

  projectiles.push({
    mesh: mesh,
    ownerId: ownerId,
    direction: direction,
    speed: 12
  });
}

// PLAYER 1: PURPLEFLY
const purpleFlyGroup = new THREE.Group();
scene.add(purpleFlyGroup);

let purpleFlyModel = null;
let groundYP1 = 0;
let purpleFlyMixer = null;
let facingP1 = 1;
let p1Hp = MAX_HP;
let p1JumpVel = 0;
let p1JumpHeight = 0;
let p1IsJumping = false;
let p1AttackTimer = 0;
let p1SpecialCooldown = 0;
let p1IsDefending = false;

// PLAYER 2: MAGO COELHO
const rabbitGroup = new THREE.Group();
scene.add(rabbitGroup);

let rabbitModel = null;
let groundYP2 = 0;
let rabbitMixer = null;
let facingP2 = -1;
let p2Hp = MAX_HP;
let p2JumpVel = 0;
let p2JumpHeight = 0;
let p2IsJumping = false;
let p2AttackTimer = 0;
let p2SpecialCooldown = 0;
let p2IsDefending = false;

// PRÊMIO: CAIXA DOS MIRACULOUS
const prizeGroup = new THREE.Group();
scene.add(prizeGroup);
let prizeModel = null;
let prizeMixer = null;
let isVictorySequence = false;
let prizeAnimTime = 0;

// CARREGAMENTO DOS MODELOS
loader.load('/models/purplefly_cartoon_3d.glb', (gltf) => {
  purpleFlyModel = gltf.scene;
  purpleFlyModel.rotation.set(-Math.PI / 2, 0, 0);

  purpleFlyModel.traverse((obj) => { if (obj.isMesh) { obj.castShadow = true; obj.receiveShadow = true; } });
  purpleFlyGroup.add(purpleFlyModel);
  purpleFlyGroup.updateMatrixWorld(true);

  const bounds = new THREE.Box3().setFromObject(purpleFlyGroup);
  const size = new THREE.Vector3();
  bounds.getSize(size);
  if (size.y > 0) purpleFlyModel.scale.setScalar(3.5 / size.y);

  const scaledBounds = new THREE.Box3().setFromObject(purpleFlyGroup);
  groundYP1 = -scaledBounds.min.y;
  purpleFlyGroup.position.set(-2.5, groundYP1, 0);

  if (gltf.animations.length > 0) {
    purpleFlyMixer = new THREE.AnimationMixer(purpleFlyModel);
    gltf.animations.forEach((clip) => purpleFlyMixer.clipAction(clip).play());
  }
});

loader.load('/models/coelho_mago_3d (1).glb', (gltf) => {
  rabbitModel = gltf.scene;
  rabbitModel.rotation.set(-Math.PI / 2, 0, 0);

  rabbitModel.traverse((obj) => { if (obj.isMesh) { obj.castShadow = true; obj.receiveShadow = true; } });
  rabbitGroup.add(rabbitModel);
  rabbitGroup.updateMatrixWorld(true);

  const bounds = new THREE.Box3().setFromObject(rabbitGroup);
  const size = new THREE.Vector3();
  bounds.getSize(size);
  if (size.y > 0) rabbitModel.scale.setScalar(3.5 / size.y);

  const scaledBounds = new THREE.Box3().setFromObject(rabbitGroup);
  groundYP2 = -scaledBounds.min.y;
  rabbitGroup.position.set(2.5, groundYP2, 0);

  if (gltf.animations.length > 0) {
    rabbitMixer = new THREE.AnimationMixer(rabbitModel);
    gltf.animations.forEach((clip) => rabbitMixer.clipAction(clip).play());
  }
});

loader.load('/models/miraculous_ladybug__cat_noir_-_miracle_box.glb', (gltf) => {
  prizeModel = gltf.scene;
  prizeModel.traverse((obj) => { if (obj.isMesh) { obj.castShadow = true; obj.receiveShadow = true; } });
  prizeGroup.add(prizeModel);
  prizeGroup.scale.setScalar(0.3);
  prizeGroup.position.set(0, 10, 0);
  prizeGroup.visible = false;

  if (gltf.animations.length > 0) {
    prizeMixer = new THREE.AnimationMixer(prizeModel);
    gltf.animations.forEach((clip) => prizeMixer.clipAction(clip).play());
  }
});

// CONTROLES DE TECLADO
const keys = {};

window.addEventListener('keydown', (event) => {
  keys[event.code] = true;

  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
    event.preventDefault();
  }

  if (!gameStarted || isVictorySequence) return;

  // P1 CONTROLES
  if (event.code === 'Space' && purpleFlyGroup && !p1IsJumping) {
    p1JumpVel = 7;
    p1IsJumping = true;
  }
  if (event.code === 'KeyJ' && purpleFlyGroup && p1AttackTimer <= 0) {
    p1AttackTimer = 0.25;
    checkHit(1, 30);
  }
  if (event.code === 'KeyU' && purpleFlyGroup && p1SpecialCooldown <= 0) {
    p1SpecialCooldown = 3.5; // Cooldown de 3.5s
    p1AttackTimer = 0.4;
    createSpecialProjectile(1, purpleFlyGroup.position.x, facingP1, 0xa855f7);
  }
  if (event.code === 'KeyK') p1IsDefending = true;

  // P2 CONTROLES (Multiplayer)
  if (!isAiMode) {
    if (event.code === 'ArrowUp' && rabbitGroup && !p2IsJumping) {
      p2JumpVel = 7;
      p2IsJumping = true;
    }
    if (event.code === 'KeyL' && rabbitGroup && p2AttackTimer <= 0) {
      p2AttackTimer = 0.25;
      checkHit(2, 30);
    }
    if (event.code === 'KeyO' && rabbitGroup && p2SpecialCooldown <= 0) {
      p2SpecialCooldown = 3.5;
      p2AttackTimer = 0.4;
      createSpecialProjectile(2, rabbitGroup.position.x, facingP2, 0x38bdf8);
    }
    if (event.code === 'KeyI') p2IsDefending = true;
  }
});

window.addEventListener('keyup', (event) => {
  keys[event.code] = false;
  if (event.code === 'KeyK') p1IsDefending = false;
  if (event.code === 'KeyI') p2IsDefending = false;
});

function updateHealthBars() {
  const hpP1 = document.querySelector('#hp-bar-p1');
  const hpP2 = document.querySelector('#hp-bar-p2');

  if (hpP1) hpP1.style.width = Math.max(0, (p1Hp / MAX_HP) * 100) + '%';
  if (hpP2) hpP2.style.width = Math.max(0, (p2Hp / MAX_HP) * 100) + '%';
}

function checkHit(attackerId, baseDamage) {
  const dist = Math.abs(purpleFlyGroup.position.x - rabbitGroup.position.x);

  if (dist < 2.5) {
    if (attackerId === 1 && p2Hp > 0) {
      const damage = p2IsDefending ? 5 : baseDamage;
      p2Hp -= damage;
      updateHealthBars();
      if (p2Hp <= 0) startVictorySequence(1);
    } else if (attackerId === 2 && p1Hp > 0) {
      const damage = p1IsDefending ? 5 : baseDamage;
      p1Hp -= damage;
      updateHealthBars();
      if (p1Hp <= 0) startVictorySequence(2);
    }
  }
}

function startVictorySequence(winnerId) {
  isVictorySequence = true;

  const victoryTitle = document.querySelector('#victory-title');
  const victorySubtitle = document.querySelector('#victory-subtitle');

  if (winnerId === 1) {
    if (victoryTitle) victoryTitle.textContent = "VOCÊ GANHOU!";
    if (victorySubtitle) victorySubtitle.textContent = "A caixa foi recuperada.";
    if (rabbitGroup) rabbitGroup.visible = false;
    prizeGroup.visible = true;
  } else {
    if (victoryTitle) victoryTitle.textContent = "DERROTA!";
    if (victorySubtitle) victorySubtitle.textContent = "O Eternal venceu a batalha.";
    if (purpleFlyGroup) purpleFlyGroup.visible = false;
  }

  if (victoryOverlay) victoryOverlay.style.display = 'block';
}

// ========================================
// INTELIGÊNCIA ARTIFICIAL DO VILÃO (IA)
// ========================================

let aiDecisionTimer = 0;
let aiMoveDir = 0;

function updateAI(delta) {
  if (!rabbitModel || p2Hp <= 0 || isVictorySequence || !gameStarted) return;

  aiDecisionTimer -= delta;

  if (aiDecisionTimer <= 0) {
    aiDecisionTimer = 0.2 + Math.random() * 0.1;

    const dist = purpleFlyGroup.position.x - rabbitGroup.position.x;
    const absDist = Math.abs(dist);

    if (absDist > 1.8) {
      aiMoveDir = dist > 0 ? 1 : -1;
      p2IsDefending = false;
    } else {
      aiMoveDir = 0;
    }

    // IA Lança o Especial Mágico se estiver no alcance
    if (p2SpecialCooldown <= 0 && absDist < 6.0) {
      p2SpecialCooldown = 4.0;
      p2AttackTimer = 0.4;
      createSpecialProjectile(2, rabbitGroup.position.x, facingP2, 0x38bdf8);
      p2IsDefending = false;
    } 
    // Ataque Normal ou Defesa
    else if (absDist <= 2.2) {
      if (Math.random() < 0.65 && p2AttackTimer <= 0) {
        p2AttackTimer = 0.25;
        p2IsDefending = false;
        checkHit(2, 30);
      } else {
        p2IsDefending = true;
      }
    }

    if (!p2IsJumping && (p1IsJumping || Math.random() < 0.15)) {
      p2JumpVel = 7;
      p2IsJumping = true;
    }
  }

  if (aiMoveDir !== 0) {
    facingP2 = aiMoveDir;
    rabbitGroup.position.x += aiMoveDir * 4.2 * delta;
  }
}

// ========================================
// CONTAGEM REGRESSIVA (5 SEGUNDOS)
// ========================================

function startCountdown(callback) {
  let count = 5;
  countdownOverlay.style.display = 'block';
  countdownOverlay.textContent = count;

  const timer = setInterval(() => {
    count--;
    if (count > 0) {
      countdownOverlay.textContent = count;
    } else if (count === 0) {
      countdownOverlay.textContent = "LUTEM!";
    } else {
      clearInterval(timer);
      countdownOverlay.style.display = 'none';
      gameStarted = true;
      if (callback) callback();
    }
  }, 1000);
}

// ========================================
// LOOP E ATUALIZAÇÃO DO JOGO
// ========================================

const clock = new THREE.Clock();

function updateGame(delta) {
  const time = clock.elapsedTime;

  // Atualizar Cooldowns dos Especiais
  if (p1SpecialCooldown > 0) p1SpecialCooldown -= delta;
  if (p2SpecialCooldown > 0) p2SpecialCooldown -= delta;

  // ATUALIZAÇÃO DOS PROJÉTEIS
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const proj = projectiles[i];
    proj.mesh.position.x += proj.direction * proj.speed * delta;

    // Colisão com os jogadores
    const targetGroup = proj.ownerId === 1 ? rabbitGroup : purpleFlyGroup;
    const targetHp = proj.ownerId === 1 ? p2Hp : p1Hp;
    const isDefending = proj.ownerId === 1 ? p2IsDefending : p1IsDefending;

    const hitDist = Math.abs(proj.mesh.position.x - targetGroup.position.x);

    if (hitDist < 1.0 && targetHp > 0) {
      const damage = isDefending ? 10 : 55; // Dano do Especial: 55 (ou 10 defendido)
      if (proj.ownerId === 1) {
        p2Hp -= damage;
        if (p2Hp <= 0) startVictorySequence(1);
      } else {
        p1Hp -= damage;
        if (p1Hp <= 0) startVictorySequence(2);
      }
      updateHealthBars();

      scene.remove(proj.mesh);
      projectiles.splice(i, 1);
      continue;
    }

    // Remove se sair da arena
    if (Math.abs(proj.mesh.position.x) > 12) {
      scene.remove(proj.mesh);
      projectiles.splice(i, 1);
    }
  }

  // MOVIMENTO P1
  if (purpleFlyModel && p1Hp > 0) {
    let p1Move = 0;
    if (gameStarted && !p1IsDefending) {
      if (keys['KeyA']) { p1Move = -1; facingP1 = -1; }
      if (keys['KeyD']) { p1Move = 1; facingP1 = 1; }
    }

    if (p1Move !== 0) purpleFlyGroup.position.x += p1Move * 4.5 * delta;
    purpleFlyGroup.position.x = THREE.MathUtils.clamp(purpleFlyGroup.position.x, -8, 8);
    purpleFlyGroup.rotation.y = facingP1 < 0 ? -Math.PI / 2 : Math.PI / 2;

    if (p1IsJumping) {
      p1JumpHeight += p1JumpVel * delta;
      p1JumpVel -= 18 * delta;
      if (p1JumpHeight <= 0) { p1JumpHeight = 0; p1JumpVel = 0; p1IsJumping = false; }
    }

    let p1Idle = !p1IsJumping ? (p1Move !== 0 ? Math.abs(Math.sin(time * 10)) * 0.05 : Math.sin(time * 2) * 0.02) : 0;
    let p1AttackOffset = 0;

    if (p1AttackTimer > 0) {
      p1AttackTimer -= delta;
      const prog = 1 - Math.max(p1AttackTimer, 0) / 0.25;
      p1AttackOffset = Math.sin(prog * Math.PI) * 0.45;
    }

    purpleFlyGroup.rotation.z = p1IsDefending ? -0.2 : 0;
    purpleFlyGroup.position.y = groundYP1 + p1JumpHeight + p1Idle;
    purpleFlyModel.position.z = p1AttackOffset;
  }

  // MOVIMENTO P2
  if (rabbitModel && p2Hp > 0 && !isVictorySequence) {
    if (isAiMode) {
      updateAI(delta);
    } else if (gameStarted && !p2IsDefending) {
      let p2Move = 0;
      if (keys['ArrowLeft']) { p2Move = -1; facingP2 = -1; }
      if (keys['ArrowRight']) { p2Move = 1; facingP2 = 1; }

      if (p2Move !== 0) rabbitGroup.position.x += p2Move * 4.5 * delta;
    }

    rabbitGroup.position.x = THREE.MathUtils.clamp(rabbitGroup.position.x, -8, 8);
    rabbitGroup.rotation.y = facingP2 < 0 ? -Math.PI / 2 : Math.PI / 2;

    if (p2IsJumping) {
      p2JumpHeight += p2JumpVel * delta;
      p2JumpVel -= 18 * delta;
      if (p2JumpHeight <= 0) { p2JumpHeight = 0; p2JumpVel = 0; p2IsJumping = false; }
    }

    let p2Idle = !p2IsJumping ? Math.sin(time * 2) * 0.02 : 0;
    let p2AttackOffset = 0;

    if (p2AttackTimer > 0) {
      p2AttackTimer -= delta;
      const prog = 1 - Math.max(p2AttackTimer, 0) / 0.25;
      p2AttackOffset = Math.sin(prog * Math.PI) * 0.45;
    }

    rabbitGroup.rotation.z = p2IsDefending ? 0.2 : 0;
    rabbitGroup.position.y = groundYP2 + p2JumpHeight + p2Idle;
    rabbitModel.position.z = p2AttackOffset;
  }

  // ANIMAÇÃO DA CAIXA NO FINAL
  if (isVictorySequence && prizeGroup && prizeGroup.visible) {
    prizeAnimTime += delta;
    if (prizeGroup.position.y > 1.2) {
      prizeGroup.position.y -= 3.5 * delta;
      if (prizeGroup.position.y < 1.2) prizeGroup.position.y = 1.2;
    } else {
      prizeGroup.position.y = 1.2 + Math.sin(prizeAnimTime * 3) * 0.15;
    }
    prizeGroup.rotation.y += 1.2 * delta;
  }
}

// INICIAR O JOGO
function startGame(vsAI) {
  isAiMode = vsAI;
  gameStarted = false;
  
  const p2Label = document.querySelector('#p2-label');
  if (p2Label) {
    p2Label.textContent = isAiMode ? 'Eternal (IA)' : 'Eternal (P2)';
  }

  menu.style.display = 'none';
  container.style.display = 'block';

  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;

  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  startCountdown();
}

if (playAiButton) playAiButton.addEventListener('click', () => startGame(true));
if (playPvpButton) playPvpButton.addEventListener('click', () => startGame(false));

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.05);

  if (purpleFlyMixer) purpleFlyMixer.update(delta);
  if (rabbitMixer) rabbitMixer.update(delta);
  if (prizeMixer) prizeMixer.update(delta);

  updateGame(delta);

  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});