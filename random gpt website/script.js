// script.js - Full clean game + master volume
document.addEventListener("DOMContentLoaded", () => {
  // ===== DOM =====
  const startScreen = document.getElementById("start-screen");
  const gameContainer = document.querySelector(".game-container");
  const gameOverScreen = document.getElementById("game-over-screen");
  const startBtn = document.getElementById("start-btn");
  const restartBtn = document.getElementById("restart-btn");
  const scoreDisplay = document.getElementById("score");
  const pauseBtn = document.getElementById("pause-btn");
  const finalScore = document.getElementById("final-score");
  const playerNameInput = document.getElementById("player-name");
  const difficultySelect = document.getElementById("difficulty");

  const startVolumeSlider = document.getElementById("start-volume"); // start screen
  const gameVolumeSlider = document.getElementById("game-volume");   // in-game

  const dino = document.getElementById("dino");

  // ===== Master volume & sounds =====
  let masterVolume = 0.5; // default

  const bgMusic = new Audio("sounds/background.mp3");
  bgMusic.loop = true;

  const jumpSound = new Audio("sounds/jump.mp3");
  const pointSound = new Audio("sounds/point.mp3");
  const gameOverSound = new Audio("sounds/gameover.mp3");
  const wahModiSound = new Audio("sounds/wahmodiji.mp3");

  function applyVolumeToAll(vol) {
    masterVolume = Number(vol);
    bgMusic.volume = masterVolume;
    jumpSound.volume = masterVolume * 0.9;
    pointSound.volume = masterVolume * 0.8;
    gameOverSound.volume = masterVolume;
    wahModiSound.volume = masterVolume * 0.9;

    if (startVolumeSlider) startVolumeSlider.value = masterVolume;
    if (gameVolumeSlider) gameVolumeSlider.value = masterVolume;
  }

  if (startVolumeSlider) {
    startVolumeSlider.addEventListener("input", (e) => {
      applyVolumeToAll(e.target.value);
    });
  }
  if (gameVolumeSlider) {
    gameVolumeSlider.addEventListener("input", (e) => {
      applyVolumeToAll(e.target.value);
    });
  }

  applyVolumeToAll(masterVolume);

  // ===== Game state & physics =====
  let playerName = "";
  let isPaused = false;
  let score = 0;

  let baseSpeed = 5;
  let speed = baseSpeed;
  const maxSpeed = 18;
  let baseSpawnInterval = 1500;
  let spawnInterval = baseSpawnInterval;

  let lastTime = 0;
  let spawnTimer = 0;
  let obstacles = [];

  let gravity = -0.5;
  let velocity = 0;
  let dinoY = 0;
  const groundY = 0;
  const normalDinoHeight = 80;
  const duckDinoHeight = 40;

  let lastDuckTime = 0;
  const DUCK_GRACE_MS = 140;

  let isJumping = false;
  let isDucking = false;

  function applyDifficulty(diff) {
    if (diff === "easy") {
      baseSpeed = 4;
      baseSpawnInterval = 2000;
    } else if (diff === "hard") {
      baseSpeed = 6.5;
      baseSpawnInterval = 1200;
    } else {
      baseSpeed = 5.2;
      baseSpawnInterval = 1500;
    }
    speed = baseSpeed;
    spawnInterval = baseSpawnInterval;
  }

  function jump() {
    if (isPaused || isJumping) return;
    isJumping = true;
    velocity = 14;
    jumpSound.currentTime = 0;
    jumpSound.play();
  }

  function duckStart() {
    if (isPaused || isDucking) return;
    isDucking = true;
    lastDuckTime = performance.now();
    dino.style.height = duckDinoHeight + "px";
    dino.style.bottom = "0px";
  }
  function duckEnd() {
    if (!isDucking) return;
    isDucking = false;
    dino.style.height = normalDinoHeight + "px";
  }

  function createObstacle() {
    const el = document.createElement("div");
    el.classList.add("obstacle");

    const flyingChance = Math.min(0.22 + score / 200, 0.6);
    const isFlying = Math.random() < flyingChance;
    let meta;

    if (isFlying) {
  // Increased bird size
  meta = { img: "images/bird.png", w: 96, h: 82, baseY: 90, flying: true };
} else {
  const groundTypes = [
    { img: "images/tree.png", w: 42, h: 60 },
    { img: "images/tower.png", w: 34, h: 90 },
    { img: "images/building.png", w: 56, h: 72 }
  ];
  const g = groundTypes[Math.floor(Math.random() * groundTypes.length)];
  meta = { img: g.img, w: g.w, h: g.h, baseY: 0, flying: false };
}


    Object.assign(el.style, {
      width: meta.w + "px",
      height: meta.h + "px",
      backgroundImage: `url(${meta.img})`,
      backgroundSize: "cover",
      position: "absolute",
      left: gameContainer.offsetWidth + "px",
      bottom: meta.baseY + "px"
    });

    gameContainer.appendChild(el);

    obstacles.push({
      el,
      x: gameContainer.offsetWidth,
      w: meta.w,
      h: meta.h,
      baseY: meta.baseY,
      flying: meta.flying,
      oscStep: Math.random() * Math.PI * 2
    });
  }

  function updateDifficultyByScore() {
    speed = Math.min(maxSpeed, baseSpeed + Math.floor(score / 6) * 0.4);
    spawnInterval = Math.max(700, baseSpawnInterval - Math.floor(score / 8) * 80);
  }

  function gameLoopFrame(timestamp) {
    if (lastTime === 0) lastTime = timestamp;
    const delta = timestamp - lastTime;
    lastTime = timestamp;

    if (!isPaused) {
      spawnTimer += delta;
      if (spawnTimer >= spawnInterval) {
        createObstacle();
        spawnTimer = 0;
      }

      dinoY += velocity * (delta / 16);
      velocity += gravity * (delta / 16);
      if (dinoY <= groundY) {
        dinoY = groundY;
        velocity = 0;
        isJumping = false;
      }
      dino.style.bottom = Math.max(0, Math.round(dinoY)) + "px";

      for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i];

        if (o.flying) {
          o.oscStep += 0.02 * (delta / 16) * (1 + score / 200);
          o.el.style.bottom = Math.round(o.baseY + Math.sin(o.oscStep * 3) * 20) + "px";
        }

        o.x -= speed * (delta / 16);
        o.el.style.left = Math.round(o.x) + "px";

        if (o.x + o.w < 0) {
          o.el.remove();
          obstacles.splice(i, 1);
          score++;
          scoreDisplay.textContent = `Votes: ${score}`;
          pointSound.currentTime = 0;
          pointSound.play();

          if (score > 0 && score % 50 === 0) {
            wahModiSound.currentTime = 0;
            wahModiSound.play();
          }
          updateDifficultyByScore();
          continue;
        }

        const dinoRect = dino.getBoundingClientRect();
        const obsRect = o.el.getBoundingClientRect();

        if (o.flying) {
          const duckRecently = performance.now() - lastDuckTime < DUCK_GRACE_MS;
          if (
            dinoRect.right > obsRect.left &&
            dinoRect.left < obsRect.right &&
            !isDucking &&
            !duckRecently
          ) {
            endGame();
            return;
          }
        } else {
          if (
            dinoRect.right > obsRect.left &&
            dinoRect.left < obsRect.right &&
            dinoRect.bottom > obsRect.top + 6
          ) {
            endGame();
            return;
          }
        }
      }
    }
    requestAnimationFrame(gameLoopFrame);
  }

  function startGame() {
    playerName = playerNameInput.value || "Player";
    applyDifficulty(difficultySelect.value);

    score = 0;
    scoreDisplay.textContent = `Votes: ${score}`;
    obstacles.forEach(o => o.el.remove());
    obstacles = [];
    isPaused = false;
    pauseBtn.textContent = "Pause";
    dinoY = 0;
    velocity = 0;
    lastTime = 0;
    spawnTimer = 0;
    isJumping = false;
    isDucking = false;
    dino.style.height = normalDinoHeight + "px";
    dino.style.bottom = "0px";

    bgMusic.currentTime = 0;
    bgMusic.play();

    requestAnimationFrame(gameLoopFrame);
  }

  function endGame() {
    isPaused = true;
    gameOverSound.currentTime = 0;
    gameOverSound.play();
    gameContainer.classList.add("hidden");
    gameOverScreen.classList.remove("hidden");
    finalScore.textContent = `${playerName || "Player"}, your votes: ${score}`;
  }

  function togglePause() {
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? "Resume" : "Pause";
    if (isPaused) {
      bgMusic.pause();
    } else {
      bgMusic.play();
    }
  }

  document.addEventListener("keydown", (e) => {
    if (["Space", "ArrowUp", "w"].includes(e.code) || e.key === "w") {
      e.preventDefault();
      jump();
    }
    if (["ArrowDown", "s"].includes(e.code) || e.key === "s") {
      e.preventDefault();
      duckStart();
    }
  });

  document.addEventListener("keyup", (e) => {
    if (["ArrowDown", "s"].includes(e.code) || e.key === "s") {
      duckEnd();
    }
  });

  pauseBtn.addEventListener("click", togglePause);
  startBtn.addEventListener("click", () => {
    startScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");
    gameContainer.classList.remove("hidden");
    startGame();
  });
  restartBtn.addEventListener("click", () => {
    gameOverScreen.classList.add("hidden");
    startScreen.classList.remove("hidden");
    bgMusic.pause();
  });
});


