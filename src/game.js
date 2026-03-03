// Game constants
const GRID_SIZE = 20;
const BASE_SPEED = 150;
const SPEED_INCREASE = 10;
const POINTS_PER_FOOD = 10;
const LEVEL_UP_SCORE = 50;

// Game state
let canvas, ctx;
let cellSize;
let snake = [];
let food = { x: 0, y: 0 };
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let score = 0;
let highScore = 0;
let level = 1;
let gameLoop = null;
let isRunning = false;
let showGrid = false;
let wrapMode = false;

// DOM elements
let scoreEl, highScoreEl, levelEl;
let overlay, overlayTitle, overlayMessage;
let gridToggle, wrapToggle;

// Initialize game
function init() {
  canvas = document.getElementById('game-canvas');
  ctx = canvas.getContext('2d');

  scoreEl = document.getElementById('score');
  highScoreEl = document.getElementById('high-score');
  levelEl = document.getElementById('level');
  overlay = document.getElementById('overlay');
  overlayTitle = document.getElementById('overlay-title');
  overlayMessage = document.getElementById('overlay-message');
  gridToggle = document.getElementById('grid-toggle');
  wrapToggle = document.getElementById('wrap-toggle');

  // Load high score from localStorage
  highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
  highScoreEl.textContent = highScore;

  // Set canvas size
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Event listeners
  document.addEventListener('keydown', handleKeydown);
  canvas.addEventListener('click', handleStart);
  overlay.addEventListener('click', handleStart);

  // Toggle controls
  gridToggle.addEventListener('change', (e) => {
    showGrid = e.target.checked;
    if (!isRunning) draw();
  });

  wrapToggle.addEventListener('change', (e) => {
    wrapMode = e.target.checked;
  });

  // Mobile controls
  document.querySelectorAll('.control-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const dir = btn.dataset.direction;
      changeDirection(dir);
      if (!isRunning) startGame();
    });
  });

  // Initial draw
  resetGame();
  draw();
}

function resizeCanvas() {
  const wrapper = canvas.parentElement;
  const size = Math.min(wrapper.clientWidth, wrapper.clientHeight);
  canvas.width = size;
  canvas.height = size;
  cellSize = size / GRID_SIZE;

  if (!isRunning) draw();
}

function resetGame() {
  // Initialize snake at center
  const centerX = Math.floor(GRID_SIZE / 2);
  const centerY = Math.floor(GRID_SIZE / 2);
  snake = [
    { x: centerX, y: centerY },
    { x: centerX - 1, y: centerY },
    { x: centerX - 2, y: centerY }
  ];

  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  level = 1;

  updateScore();
  updateLevel();
  spawnFood();
}

function startGame() {
  if (isRunning) return;

  isRunning = true;
  overlay.classList.add('hidden');

  const speed = Math.max(50, BASE_SPEED - (level - 1) * SPEED_INCREASE);
  gameLoop = setInterval(update, speed);
}

function gameOver() {
  isRunning = false;
  clearInterval(gameLoop);
  gameLoop = null;

  // Update high score
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('snakeHighScore', highScore);
    highScoreEl.textContent = highScore;
  }

  overlayTitle.textContent = 'Game Over';
  overlayMessage.textContent = `Score: ${score} | Press SPACE to restart`;
  overlay.classList.remove('hidden');
}

function update() {
  // Apply next direction
  direction = { ...nextDirection };

  // Calculate new head position
  let newHead = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y
  };

  // Handle wrap mode or collision
  if (wrapMode) {
    newHead.x = (newHead.x + GRID_SIZE) % GRID_SIZE;
    newHead.y = (newHead.y + GRID_SIZE) % GRID_SIZE;
  } else {
    // Check wall collision
    if (newHead.x < 0 || newHead.x >= GRID_SIZE ||
        newHead.y < 0 || newHead.y >= GRID_SIZE) {
      gameOver();
      return;
    }
  }

  // Check self collision
  if (snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
    gameOver();
    return;
  }

  // Move snake
  snake.unshift(newHead);

  // Check food collision
  if (newHead.x === food.x && newHead.y === food.y) {
    score += POINTS_PER_FOOD;
    updateScore();

    // Level up
    const newLevel = Math.floor(score / LEVEL_UP_SCORE) + 1;
    if (newLevel > level) {
      level = newLevel;
      updateLevel();
      // Restart game loop with new speed
      clearInterval(gameLoop);
      const speed = Math.max(50, BASE_SPEED - (level - 1) * SPEED_INCREASE);
      gameLoop = setInterval(update, speed);
    }

    spawnFood();
  } else {
    snake.pop();
  }

  draw();
}

function draw() {
  // Clear canvas
  ctx.fillStyle = '#0f0f23';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw grid
  if (showGrid) {
    ctx.strokeStyle = 'rgba(78, 204, 163, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvas.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvas.width, i * cellSize);
      ctx.stroke();
    }
  }

  // Draw food
  ctx.fillStyle = '#ff6b6b';
  ctx.beginPath();
  ctx.arc(
    food.x * cellSize + cellSize / 2,
    food.y * cellSize + cellSize / 2,
    cellSize / 2 - 2,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Draw snake
  snake.forEach((segment, index) => {
    const isHead = index === 0;

    // Body gradient from head to tail
    const ratio = index / snake.length;
    const green = Math.floor(204 - ratio * 80);
    ctx.fillStyle = isHead ? '#4ecca3' : `rgb(78, ${green}, 130)`;

    // Draw rounded rectangle for each segment
    const padding = 1;
    const x = segment.x * cellSize + padding;
    const y = segment.y * cellSize + padding;
    const size = cellSize - padding * 2;
    const radius = isHead ? size / 3 : size / 4;

    ctx.beginPath();
    ctx.roundRect(x, y, size, size, radius);
    ctx.fill();

    // Draw eyes on head
    if (isHead) {
      ctx.fillStyle = '#0f0f23';
      const eyeSize = cellSize / 8;
      const eyeOffset = cellSize / 4;

      // Position eyes based on direction
      let eye1X, eye1Y, eye2X, eye2Y;

      if (direction.x === 1) { // Right
        eye1X = segment.x * cellSize + cellSize * 0.7;
        eye1Y = segment.y * cellSize + cellSize * 0.3;
        eye2X = eye1X;
        eye2Y = segment.y * cellSize + cellSize * 0.7;
      } else if (direction.x === -1) { // Left
        eye1X = segment.x * cellSize + cellSize * 0.3;
        eye1Y = segment.y * cellSize + cellSize * 0.3;
        eye2X = eye1X;
        eye2Y = segment.y * cellSize + cellSize * 0.7;
      } else if (direction.y === -1) { // Up
        eye1X = segment.x * cellSize + cellSize * 0.3;
        eye1Y = segment.y * cellSize + cellSize * 0.3;
        eye2X = segment.x * cellSize + cellSize * 0.7;
        eye2Y = eye1Y;
      } else { // Down
        eye1X = segment.x * cellSize + cellSize * 0.3;
        eye1Y = segment.y * cellSize + cellSize * 0.7;
        eye2X = segment.x * cellSize + cellSize * 0.7;
        eye2Y = eye1Y;
      }

      ctx.beginPath();
      ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2);
      ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function spawnFood() {
  let validPosition = false;

  while (!validPosition) {
    food.x = Math.floor(Math.random() * GRID_SIZE);
    food.y = Math.floor(Math.random() * GRID_SIZE);

    // Make sure food doesn't spawn on snake
    validPosition = !snake.some(
      segment => segment.x === food.x && segment.y === food.y
    );
  }
}

function changeDirection(dir) {
  const directions = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 }
  };

  const newDir = directions[dir];
  if (!newDir) return;

  // Prevent 180 degree turns
  if (newDir.x !== -direction.x || newDir.y !== -direction.y) {
    nextDirection = newDir;
  }
}

function handleKeydown(e) {
  const keyMap = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    KeyW: 'up',
    KeyS: 'down',
    KeyA: 'left',
    KeyD: 'right'
  };

  if (e.code === 'Space') {
    e.preventDefault();
    if (!isRunning) {
      if (overlay.classList.contains('hidden') === false) {
        resetGame();
      }
      startGame();
    }
    return;
  }

  const dir = keyMap[e.code];
  if (dir) {
    e.preventDefault();
    changeDirection(dir);
  }
}

function handleStart(e) {
  if (!isRunning) {
    resetGame();
    startGame();
  }
}

function updateScore() {
  scoreEl.textContent = score;
}

function updateLevel() {
  levelEl.textContent = level;
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);
