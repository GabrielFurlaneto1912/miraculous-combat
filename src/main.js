import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ======================================================
// MIRACULOUS KOMBAT — G PRODUÇÕES
// Sistema de combate, especiais, morte, recompensa e restart
// ======================================================

// ========================================
// ELEMENTOS DO MENU E DOM
// ========================================

const menu = document.querySelector('#main-menu');
const container = document.querySelector('#game-container');

const playButton = document.querySelector('#play-button');
const optionsButton = document.querySelector('#options-button');
const creditsButton = document.querySelector('#credits-button');

const instructionsButton = document.querySelector('#instructions-button');
const instructionsModal = document.querySelector('#instructions-modal');
const closeInstructions = document.querySelector('#close-instructions');

const modal = document.querySelector('#modal');
const modalTitle = document.querySelector('#modal-title');
const modalBody = document.querySelector('#modal-body');
const closeModal = document.querySelector('#close-modal');

if (!menu || !container || !playButton) {
  throw new Error('Elementos principais do jogo não encontrados.');
}

// ========================================
// CONFIGURAÇÕES
// ========================================

const MAX_HP = 300;

const NORMAL_DAMAGE = 30;
const SPECIAL_DAMAGE = 75;

const NORMAL_RANGE = 2.2;
const SPECIAL_RANGE = 4.2;

const NORMAL_DURATION = 0.35;
const SPECIAL_DURATION = 0.8;
const SPECIAL_COOLDOWN = 4;

const DEATH_DURATION = 1.5;

// ========================================
// HUD
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
        <div style="color: #a855f7; font-weight: bold; font-size: 16px; margin-bottom: 5px; text-shadow: 0 0 5px #000;">
            PURPLEFLY (P1)
        </div>
        <div style="width: 100%; height: 20px; background: rgba(0,0,0,.6); border: 2px solid #a855f7; border-radius: 10px; overflow: hidden;">
            <div id="hp-bar-p1" style="width: 100%; height: 100%; background: linear-gradient(90deg,#a855f7,#c084fc); transition: width .3s;"></div>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 5px;">
            <div id="special-status-p1" style="color: #c084fc; font-size: 11px;">ESPECIAL DISPONÍVEL</div>
            <div style="color: #aaa; font-size: 11px;">A/D: Mover | Espaço: Pulo | J: Ataque | K: Especial</div>
        </div>
    </div>

    <div style="width: 40%; text-align: right;">
        <div style="color: #38bdf8; font-weight: bold; font-size: 16px; margin-bottom: 5px; text-shadow: 0 0 5px #000;">
            ETERNAL (P2)
        </div>
        <div style="width: 100%; height: 20px; background: rgba(0,0,0,.6); border: 2px solid #38bdf8; border-radius: 10px; overflow: hidden;">
            <div id="hp-bar-p2" style="width: 100%; height: 100%; background: linear-gradient(90deg,#38bdf8,#818cf8); float: right; transition: width .3s;"></div>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 5px;">
            <div style="color: #aaa; font-size: 11px;">Setas: Mover/Pulo | L: Ataque | O: Especial</div>
            <div id="special-status-p2" style="color: #38bdf8; font-size: 11px;">ESPECIAL DISPONÍVEL</div>
        </div>
    </div>
`;

container.appendChild(uiContainer);

// Estilo comum para botões de fim de jogo
const btnRestartStyle = `
    margin-top: 20px;
    padding: 12px 28px;
    font-size: 18px;
    font-weight: bold;
    font-family: Orbitron, sans-serif;
    color: #fff;
    background: linear-gradient(135deg, #a855f7, #6b21a8);
    border: 2px solid #c084fc;
    border-radius: 8px;
    cursor: pointer;
    box-shadow: 0 0 15px rgba(168, 85, 247, 0.6);
    transition: all 0.2s ease;
    pointer-events: auto;
`;

// ========================================
// TELA DE VITÓRIA
// ========================================

const victoryOverlay = document.createElement('div');
victoryOverlay.id = 'victory-overlay';
victoryOverlay.style.cssText = `
    position: absolute;
    top: 25%;
    width: 100%;
    text-align: center;
    color: #fbbf24;
    font-size: 32px;
    font-weight: bold;
    font-family: Orbitron, sans-serif;
    text-shadow: 0 0 15px rgba(251,191,36,.8), 0 0 5px #000;
    display: none;
    z-index: 20;
    pointer-events: none;
`;
victoryOverlay.innerHTML = `
    <div>VOCÊ GANHOU!</div>
    <div style="font-size: 18px; color: white; margin-top: 10px;">
        A caixa foi recuperada.
    </div>
    <button id="restart-btn-victory" style="${btnRestartStyle}">JOGAR NOVAMENTE</button>
`;
container.appendChild(victoryOverlay);

// ========================================
// TELA DE DERROTA
// ========================================

const defeatOverlay = document.createElement('div');
defeatOverlay.id = 'defeat-overlay';
defeatOverlay.style.cssText = `
    position: absolute;
    top: 25%;
    left: 0;
    width: 100%;
    text-align: center;
    color: #ef4444;
    font-size: 32px;
    font-weight: bold;
    font-family: Orbitron, sans-serif;
    text-shadow: 0 0 15px rgba(239, 68, 68, 0.8), 0 0 5px #000;
    display: none;
    z-index: 20;
    pointer-events: none;
`;
defeatOverlay.innerHTML = `
    <div>VOCÊ PERDEU!</div>
    <div style="font-size: 18px; color: #fff; margin-top: 10px; text-shadow: 0 0 10px #ef4444;">
        Os Miraculous não foram recuperados.
    </div>
    <button id="restart-btn-defeat" style="${btnRestartStyle}">TENTAR NOVAMENTE</button>
`;
container.appendChild(defeatOverlay);

// ========================================
// PARTÍCULAS DO MENU
// ========================================

const particleContainer = document.querySelector('#particles');
if (particleContainer) {
  for (let i = 0; i < 45; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDuration = (4 + Math.random() * 8) + 's';
    particle.style.animationDelay = Math.random() * 8 + 's';

    const size = 2 + Math.random() * 4;
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';

    particleContainer.appendChild(particle);
  }
}

// ========================================
// MODAIS
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
    openModal(
      'OPÇÕES',
      '<p>Configurações de Áudio, Vídeo e Combate em breve.</p>'
    );
  });
}

if (creditsButton) {
  creditsButton.addEventListener('click', () => {
    openModal(
      'CRÉDITOS',
      '<p>MIRACULOUS KOMBAT</p><p>Desenvolvimento: G Produções</p><p>Tecnologia: Three.js & JavaScript</p><p>Ano: 2026</p>'
    );
  });
}

if (closeModal) closeModal.addEventListener('click', hideModal);
if (modal) {
  modal.addEventListener('click', (event) => {
    if (event.target === modal) hideModal();
  });
}

if (instructionsButton && instructionsModal) {
  instructionsButton.addEventListener('click', () => {
    instructionsModal.classList.remove('hidden');
  });
}

if (closeInstructions && instructionsModal) {
  closeInstructions.addEventListener('click', () => {
    instructionsModal.classList.add('hidden');
  });
}

if (instructionsModal) {
  instructionsModal.addEventListener('click', (event) => {
    if (event.target === instructionsModal) {
      instructionsModal.classList.add('hidden');
    }
  });
}

// ========================================
// CENA THREE.JS
// ========================================

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x10091c, 18, 45);

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 3.5, 12);
camera.lookAt(0, 2, 0);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true
});

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
  new THREE.MeshStandardMaterial({
    color: 0x32164c,
    roughness: 0.65,
    metalness: 0.25
  })
);
floor.position.y = -0.25;
floor.receiveShadow = true;
scene.add(floor);

// ========================================
// GRUPOS E VARIÁVEIS DOS PERSONAGENS
// ========================================

const purpleFlyGroup = new THREE.Group();
const rabbitGroup = new THREE.Group();
scene.add(purpleFlyGroup);
scene.add(rabbitGroup);

// PURPLEFLY (P1)
let purpleFlyModel = null;
let purpleFlyMixer = null;
let groundYP1 = 0;
let facingP1 = 1;
let p1Hp = MAX_HP;
let p1JumpVel = 0;
let p1JumpHeight = 0;
let p1IsJumping = false;
let p1AttackTimer = 0;
let p1SpecialTimer = 0;
let p1SpecialCooldown = 0;
let p1HasHit = false;
let p1Dead = false;
let p1DeathTimer = 0;

// ETERNAL (P2)
let rabbitModel = null;
let rabbitMixer = null;
let groundYP2 = 0;
let facingP2 = -1;
let p2Hp = MAX_HP;
let p2JumpVel = 0;
let p2JumpHeight = 0;
let p2IsJumping = false;
let p2AttackTimer = 0;
let p2SpecialTimer = 0;
let p2SpecialCooldown = 0;
let p2HasHit = false;
let p2Dead = false;
let p2DeathTimer = 0;

// CAIXA DOS MIRACULOUS
const prizeGroup = new THREE.Group();
scene.add(prizeGroup);
let prizeModel = null;
let prizeMixer = null;
let isVictorySequence = false;
let prizeAnimTime = 0;
let prizeInitialY = 10;
const prizeTargetY = 1.5;

// ========================================
// EFEITOS ESPECIAIS
// ========================================

function createSpecialEffect(color) {
  const group = new THREE.Group();

  const ringGeometry = new THREE.TorusGeometry(0.8, 0.08, 12, 48);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.9
  });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  const innerRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.5, 0.035, 8, 48),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8
    })
  );
  innerRing.rotation.x = Math.PI / 2;
  group.add(innerRing);

  const light = new THREE.PointLight(color, 15, 6);
  light.position.y = 1;
  group.add(light);

  group.visible = false;
  scene.add(group);

  return group;
}

const purpleSpecialEffect = createSpecialEffect(0xb44aff);
const rabbitSpecialEffect = createSpecialEffect(0x38bdf8);

// ========================================
// CARREGAMENTO DOS MODELOS GLB
// ========================================

const loader = new GLTFLoader();

// PURPLEFLY
loader.load('/models/purplefly_cartoon_3d.glb', (gltf) => {
  purpleFlyModel = gltf.scene;
  purpleFlyModel.rotation.set(-Math.PI / 2, 0, 0);

  purpleFlyModel.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  purpleFlyGroup.add(purpleFlyModel);
  purpleFlyGroup.updateMatrixWorld(true);

  const bounds = new THREE.Box3().setFromObject(purpleFlyGroup);
  const size = new THREE.Vector3();
  bounds.getSize(size);

  if (size.y > 0) {
    purpleFlyModel.scale.setScalar(3.5 / size.y);
  }

  const scaledBounds = new THREE.Box3().setFromObject(purpleFlyGroup);
  groundYP1 = -scaledBounds.min.y;
  purpleFlyGroup.position.set(-2.5, groundYP1, 0);

  if (gltf.animations.length > 0) {
    purpleFlyMixer = new THREE.AnimationMixer(purpleFlyModel);
    purpleFlyMixer.clipAction(gltf.animations[0]).play();
  }
});

// ETERNAL
loader.load('/models/coelho_mago_3d (1).glb', (gltf) => {
  rabbitModel = gltf.scene;
  rabbitModel.rotation.set(-Math.PI / 2, 0, 0);

  rabbitModel.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  rabbitGroup.add(rabbitModel);
  rabbitGroup.updateMatrixWorld(true);

  const bounds = new THREE.Box3().setFromObject(rabbitGroup);
  const size = new THREE.Vector3();
  bounds.getSize(size);

  if (size.y > 0) {
    rabbitModel.scale.setScalar(3.5 / size.y);
  }

  const scaledBounds = new THREE.Box3().setFromObject(rabbitGroup);
  groundYP2 = -scaledBounds.min.y;
  rabbitGroup.position.set(2.5, groundYP2, 0);

  if (gltf.animations.length > 0) {
    rabbitMixer = new THREE.AnimationMixer(rabbitModel);
    rabbitMixer.clipAction(gltf.animations[0]).play();
  }
});

// CAIXA DOS MIRACULOUS
loader.load('/models/miraculous_ladybug__cat_noir_-_miracle_box.glb', (gltf) => {
  prizeModel = gltf.scene;
  prizeModel.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  prizeGroup.add(prizeModel);
  prizeGroup.scale.setScalar(0.3);
  prizeGroup.position.set(0, prizeInitialY, 0);
  prizeGroup.visible = false;

  if (gltf.animations.length > 0) {
    prizeMixer = new THREE.AnimationMixer(prizeModel);
    prizeMixer.timeScale = 0;
  }
});

// ========================================
// CONTROLES E TECLADO
// ========================================

const keys = {};

window.addEventListener('keydown', (event) => {
  if (keys[event.code]) return;
  keys[event.code] = true;

  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
    event.preventDefault();
  }

  if (isVictorySequence) return;

  // CONTROLES P1
  if (event.code === 'Space' && !p1IsJumping && !p1Dead) {
    p1JumpVel = 7;
    p1IsJumping = true;
  }
  if (event.code === 'KeyJ' && !p1Dead && p1AttackTimer <= 0 && p1SpecialTimer <= 0) {
    p1AttackTimer = NORMAL_DURATION;
    p1HasHit = false;
  }
  if (event.code === 'KeyK' && !p1Dead && p1SpecialCooldown <= 0 && p1SpecialTimer <= 0) {
    p1SpecialTimer = SPECIAL_DURATION;
    p1SpecialCooldown = SPECIAL_COOLDOWN;
    p1HasHit = false;
  }

  // CONTROLES P2
  if (event.code === 'ArrowUp' && !p2IsJumping && !p2Dead) {
    p2JumpVel = 7;
    p2IsJumping = true;
  }
  if (event.code === 'KeyL' && !p2Dead && p2AttackTimer <= 0 && p2SpecialTimer <= 0) {
    p2AttackTimer = NORMAL_DURATION;
    p2HasHit = false;
  }
  if (event.code === 'KeyO' && !p2Dead && p2SpecialCooldown <= 0 && p2SpecialTimer <= 0) {
    p2SpecialTimer = SPECIAL_DURATION;
    p2SpecialCooldown = SPECIAL_COOLDOWN;
    p2HasHit = false;
  }
});

window.addEventListener('keyup', (event) => {
  keys[event.code] = false;
});

window.addEventListener('blur', () => {
  Object.keys(keys).forEach((key) => {
    keys[key] = false;
  });
});

// ========================================
// REINICIAR PARTIDA (RESTART)
// ========================================

function restartGame() {
  // Esconde overlays
  if (victoryOverlay) victoryOverlay.style.display = 'none';
  if (defeatOverlay) defeatOverlay.style.display = 'none';

  // Reseta estado do combate
  isVictorySequence = false;
  p1Hp = MAX_HP;
  p2Hp = MAX_HP;

  // Reseta P1
  p1Dead = false;
  p1DeathTimer = 0;
  p1IsJumping = false;
  p1JumpHeight = 0;
  p1JumpVel = 0;
  p1AttackTimer = 0;
  p1SpecialTimer = 0;
  p1SpecialCooldown = 0;
  facingP1 = 1;

  if (purpleFlyGroup) {
    purpleFlyGroup.position.set(-2.5, groundYP1, 0);
    purpleFlyGroup.rotation.set(0, Math.PI / 2, 0);
    purpleFlyGroup.visible = true;
  }
  if (purpleFlyModel) {
    purpleFlyModel.position.set(0, 0, 0);
    purpleFlyModel.rotation.set(-Math.PI / 2, 0, 0);
  }
  if (purpleFlyMixer) {
    purpleFlyMixer.stopAllAction();
    if (purpleFlyMixer._actions && purpleFlyMixer._actions[0]) {
      purpleFlyMixer._actions[0].play();
    }
  }

  // Reseta P2
  p2Dead = false;
  p2DeathTimer = 0;
  p2IsJumping = false;
  p2JumpHeight = 0;
  p2JumpVel = 0;
  p2AttackTimer = 0;
  p2SpecialTimer = 0;
  p2SpecialCooldown = 0;
  facingP2 = -1;

  if (rabbitGroup) {
    rabbitGroup.position.set(2.5, groundYP2, 0);
    rabbitGroup.rotation.set(0, -Math.PI / 2, 0);
    rabbitGroup.visible = true;
  }
  if (rabbitModel) {
    rabbitModel.position.set(0, 0, 0);
    rabbitModel.rotation.set(-Math.PI / 2, 0, 0);
  }
  if (rabbitMixer) {
    rabbitMixer.stopAllAction();
    if (rabbitMixer._actions && rabbitMixer._actions[0]) {
      rabbitMixer._actions[0].play();
    }
  }

  // Reseta Caixa
  prizeGroup.visible = false;
  prizeGroup.position.set(0, prizeInitialY, 0);
  prizeGroup.rotation.set(0, 0, 0);
  prizeAnimTime = 0;

  // Reseta Efeitos
  purpleSpecialEffect.visible = false;
  rabbitSpecialEffect.visible = false;

  // Atualiza HUD
  updateHealthBars();
}

// Eventos de clique nos botões de Restart
document.querySelector('#restart-btn-victory')?.addEventListener('click', restartGame);
document.querySelector('#restart-btn-defeat')?.addEventListener('click', restartGame);

// ========================================
// HUD E COMBATE
// ========================================

function updateHealthBars() {
  const hpP1 = document.querySelector('#hp-bar-p1');
  const hpP2 = document.querySelector('#hp-bar-p2');

  if (hpP1) hpP1.style.width = Math.max(0, (p1Hp / MAX_HP) * 100) + '%';
  if (hpP2) hpP2.style.width = Math.max(0, (p2Hp / MAX_HP) * 100) + '%';
}

function updateSpecialStatus(delta) {
  if (p1SpecialCooldown > 0) p1SpecialCooldown = Math.max(0, p1SpecialCooldown - delta);
  if (p2SpecialCooldown > 0) p2SpecialCooldown = Math.max(0, p2SpecialCooldown - delta);

  const statusP1 = document.querySelector('#special-status-p1');
  const statusP2 = document.querySelector('#special-status-p2');

  if (statusP1) {
    statusP1.textContent = p1SpecialCooldown <= 0
      ? 'ESPECIAL (K) PRONTO'
      : `ESPECIAL: ${p1SpecialCooldown.toFixed(1)}s`;
  }

  if (statusP2) {
    statusP2.textContent = p2SpecialCooldown <= 0
      ? 'ESPECIAL (O) PRONTO'
      : `ESPECIAL: ${p2SpecialCooldown.toFixed(1)}s`;
  }
}

function startDefeatSequence() {
  if (isVictorySequence) return;
  isVictorySequence = true;
  purpleSpecialEffect.visible = false;
  rabbitSpecialEffect.visible = false;

  if (defeatOverlay) defeatOverlay.style.display = 'block';
}

function startVictorySequence() {
  if (isVictorySequence) return;
  isVictorySequence = true;

  rabbitGroup.visible = false;
  prizeGroup.visible = true;
  prizeGroup.position.set(0, prizeInitialY, 0);
  prizeGroup.rotation.set(0, 0, 0);
  prizeAnimTime = 0;

  if (victoryOverlay) victoryOverlay.style.display = 'block';
}

function startDeathSequence(player) {
  if (player === 1) {
    if (p1Dead) return;
    p1Dead = true;
    p1DeathTimer = 0;
    p1IsJumping = false;
    p1JumpHeight = 0;
    p1JumpVel = 0;
    p1AttackTimer = 0;
    p1SpecialTimer = 0;
    purpleSpecialEffect.visible = false;

    if (purpleFlyMixer) purpleFlyMixer.stopAllAction();
    startDefeatSequence();
  } else {
    if (p2Dead) return;
    p2Dead = true;
    p2DeathTimer = 0;
    p2IsJumping = false;
    p2JumpHeight = 0;
    p2JumpVel = 0;
    p2AttackTimer = 0;
    p2SpecialTimer = 0;
    rabbitSpecialEffect.visible = false;

    if (rabbitMixer) rabbitMixer.stopAllAction();
    startVictorySequence();
  }
}

function checkHit(attackerId, special = false) {
  if (isVictorySequence) return;

  const attacker = attackerId === 1 ? purpleFlyGroup : rabbitGroup;
  const defender = attackerId === 1 ? rabbitGroup : purpleFlyGroup;
  const defenderDead = attackerId === 1 ? p2Dead : p1Dead;
  const defenderHp = attackerId === 1 ? p2Hp : p1Hp;

  if (defenderDead || defenderHp <= 0) return;

  const distance = Math.abs(attacker.position.x - defender.position.x);
  const direction = attackerId === 1 ? facingP1 : facingP2;
  const difference = defender.position.x - attacker.position.x;

  if (difference * direction < -0.15) return;

  const range = special ? SPECIAL_RANGE : NORMAL_RANGE;
  if (distance > range) return;

  const damage = special ? SPECIAL_DAMAGE : NORMAL_DAMAGE;

  if (attackerId === 1) {
    p2Hp = Math.max(0, p2Hp - damage);
    updateHealthBars();
    if (p2Hp <= 0) startDeathSequence(2);
  } else {
    p1Hp = Math.max(0, p1Hp - damage);
    updateHealthBars();
    if (p1Hp <= 0) startDeathSequence(1);
  }
}

// ========================================
// ANIMAÇÕES PROCEDURAIS E ATUALIZAÇÕES
// ========================================

function updateDeathAnimation(player, delta) {
  if (player === 1) {
    p1DeathTimer += delta;
    const progress = THREE.MathUtils.clamp(p1DeathTimer / DEATH_DURATION, 0, 1);
    const eased = THREE.MathUtils.smoothstep(progress, 0, 1);

    purpleFlyGroup.rotation.z = THREE.MathUtils.lerp(0, -Math.PI / 2, eased);
    purpleFlyGroup.position.y = THREE.MathUtils.lerp(groundYP1, groundYP1 - 0.65, eased);
    purpleFlyModel.position.z = 0;
  } else {
    p2DeathTimer += delta;
    const progress = THREE.MathUtils.clamp(p2DeathTimer / DEATH_DURATION, 0, 1);
    const eased = THREE.MathUtils.smoothstep(progress, 0, 1);

    rabbitGroup.rotation.z = THREE.MathUtils.lerp(0, Math.PI / 2, eased);
    rabbitGroup.position.y = THREE.MathUtils.lerp(groundYP2, groundYP2 - 0.65, eased);
    rabbitModel.position.z = 0;
  }
}

function updatePurpleFly(delta, time) {
  if (!purpleFlyModel) return;

  if (p1Dead) {
    updateDeathAnimation(1, delta);
    return;
  }

  let movement = 0;
  if (!isVictorySequence) {
    if (keys['KeyA']) { movement = -1; facingP1 = -1; }
    if (keys['KeyD']) { movement = 1; facingP1 = 1; }
  }

  purpleFlyGroup.position.x += movement * 4.5 * delta;
  purpleFlyGroup.position.x = THREE.MathUtils.clamp(purpleFlyGroup.position.x, -8, 8);
  purpleFlyGroup.rotation.y = facingP1 < 0 ? -Math.PI / 2 : Math.PI / 2;

  if (p1IsJumping) {
    p1JumpHeight += p1JumpVel * delta;
    p1JumpVel -= 18 * delta;
    if (p1JumpHeight <= 0) {
      p1JumpHeight = 0;
      p1JumpVel = 0;
      p1IsJumping = false;
    }
  }

  if (p1AttackTimer > 0) {
    p1AttackTimer -= delta;
    const progress = THREE.MathUtils.clamp(1 - p1AttackTimer / NORMAL_DURATION, 0, 1);
    purpleFlyModel.position.z = Math.sin(progress * Math.PI) * 0.55;
    purpleFlyModel.rotation.z = -facingP1 * Math.sin(progress * Math.PI) * 0.25;

    if (progress >= 0.3 && !p1HasHit) {
      checkHit(1, false);
      p1HasHit = true;
    }
  } else {
    purpleFlyModel.position.z = THREE.MathUtils.damp(purpleFlyModel.position.z, 0, 12, delta);
    purpleFlyModel.rotation.z = THREE.MathUtils.damp(purpleFlyModel.rotation.z, 0, 12, delta);
  }

  if (p1SpecialTimer > 0) {
    p1SpecialTimer -= delta;
    const progress = THREE.MathUtils.clamp(1 - p1SpecialTimer / SPECIAL_DURATION, 0, 1);

    purpleFlyModel.position.z = Math.sin(progress * Math.PI) * 1.1;
    purpleFlyModel.rotation.z = -facingP1 * Math.sin(progress * Math.PI) * 0.55;

    purpleSpecialEffect.visible = true;
    purpleSpecialEffect.position.set(
      purpleFlyGroup.position.x + facingP1 * 1.3,
      purpleFlyGroup.position.y + 1.5,
      0.5
    );
    purpleSpecialEffect.scale.setScalar(0.5 + Math.sin(progress * Math.PI) * 1.8);

    if (progress >= 0.35 && !p1HasHit) {
      checkHit(1, true);
      p1HasHit = true;
    }

    if (p1SpecialTimer <= 0) {
      purpleSpecialEffect.visible = false;
    }
  } else {
    purpleSpecialEffect.visible = false;
  }

  const idle = !p1IsJumping
    ? movement !== 0 ? Math.abs(Math.sin(time * 10)) * 0.05 : Math.sin(time * 2) * 0.02
    : 0;

  purpleFlyGroup.position.y = groundYP1 + p1JumpHeight + idle;
}

function updateEternal(delta, time) {
  if (!rabbitModel || isVictorySequence) return;

  if (p2Dead) {
    updateDeathAnimation(2, delta);
    return;
  }

  let movement = 0;
  if (keys['ArrowLeft']) { movement = -1; facingP2 = -1; }
  if (keys['ArrowRight']) { movement = 1; facingP2 = 1; }

  rabbitGroup.position.x += movement * 4.5 * delta;
  rabbitGroup.position.x = THREE.MathUtils.clamp(rabbitGroup.position.x, -8, 8);
  rabbitGroup.rotation.y = facingP2 < 0 ? -Math.PI / 2 : Math.PI / 2;

  if (p2IsJumping) {
    p2JumpHeight += p2JumpVel * delta;
    p2JumpVel -= 18 * delta;
    if (p2JumpHeight <= 0) {
      p2JumpHeight = 0;
      p2JumpVel = 0;
      p2IsJumping = false;
    }
  }

  if (p2AttackTimer > 0) {
    p2AttackTimer -= delta;
    const progress = THREE.MathUtils.clamp(1 - p2AttackTimer / NORMAL_DURATION, 0, 1);
    rabbitModel.position.z = Math.sin(progress * Math.PI) * 0.55;
    rabbitModel.rotation.z = facingP2 * Math.sin(progress * Math.PI) * 0.25;

    if (progress >= 0.3 && !p2HasHit) {
      checkHit(2, false);
      p2HasHit = true;
    }
  } else {
    rabbitModel.position.z = THREE.MathUtils.damp(rabbitModel.position.z, 0, 12, delta);
    rabbitModel.rotation.z = THREE.MathUtils.damp(rabbitModel.rotation.z, 0, 12, delta);
  }

  if (p2SpecialTimer > 0) {
    p2SpecialTimer -= delta;
    const progress = THREE.MathUtils.clamp(1 - p2SpecialTimer / SPECIAL_DURATION, 0, 1);

    rabbitModel.position.z = Math.sin(progress * Math.PI) * 1.1;
    rabbitModel.rotation.z = facingP2 * Math.sin(progress * Math.PI) * 0.55;

    rabbitSpecialEffect.visible = true;
    rabbitSpecialEffect.position.set(
      rabbitGroup.position.x + facingP2 * 1.3,
      rabbitGroup.position.y + 1.5,
      0.5
    );
    rabbitSpecialEffect.scale.setScalar(0.5 + Math.sin(progress * Math.PI) * 1.8);

    if (progress >= 0.35 && !p2HasHit) {
      checkHit(2, true);
      p2HasHit = true;
    }

    if (p2SpecialTimer <= 0) {
      rabbitSpecialEffect.visible = false;
    }
  } else {
    rabbitSpecialEffect.visible = false;
  }

  const idle = !p2IsJumping
    ? movement !== 0 ? Math.abs(Math.sin(time * 10)) * 0.05 : Math.sin(time * 2) * 0.02
    : 0;

  rabbitGroup.position.y = groundYP2 + p2JumpHeight + idle;
}

function updatePrize(delta) {
  if (!isVictorySequence || !prizeModel) return;

  prizeAnimTime += delta;
  const travelProgress = THREE.MathUtils.clamp(prizeAnimTime / 2.5, 0, 1);
  const eased = THREE.MathUtils.smoothstep(travelProgress, 0, 1);
  const baseY = THREE.MathUtils.lerp(prizeInitialY, prizeTargetY, eased);

  const floatOffset = travelProgress >= 1 ? Math.sin(prizeAnimTime * 1.5) * 0.06 : 0;
  prizeGroup.position.y = baseY + floatOffset;
  prizeGroup.rotation.y += 0.45 * delta;
}

// ========================================
// LOOP DO JOGO E EVENTOS
// ========================================

const clock = new THREE.Clock();

function updateGame(delta) {
  const time = clock.elapsedTime;

  updatePurpleFly(delta, time);
  updateEternal(delta, time);
  updatePrize(delta);
  updateSpecialStatus(delta);
}

let gameStarted = false;

playButton.addEventListener('click', () => {
  menu.style.display = 'none';
  container.style.display = 'block';
  gameStarted = true;

  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;

  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.05);

  if (gameStarted) {
    if (purpleFlyMixer && !p1Dead) purpleFlyMixer.update(delta);
    if (rabbitMixer && !p2Dead && !isVictorySequence) rabbitMixer.update(delta);
    updateGame(delta);
  }

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