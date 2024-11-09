let score = 0;
let isGameOver = false;
let isPaused = false;
let timeRemaining = 30;
let lastTime = performance.now();
let isTimeFrozen = false;
let activeElements = 0;
const maxElements = 15;

// Grid configuration for organized spawning
const grid = {
  columns: 5,
  rows: 3,
  spacing: {
    x: window.innerWidth / 6,
    y: window.innerHeight / 4
  }
};

const gameContainer = document.getElementById('game-container');
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');
const pauseBtn = document.getElementById('pause-btn');
const menuOverlay = document.querySelector('.menu-overlay');
const finalScoreSpan = document.getElementById('final-score');
const playAgainBtn = document.getElementById('play-again');
const exitGameBtn = document.getElementById('exit-game');

// Get grid position for spawning
function getGridPosition(index) {
  const column = index % grid.columns;
  const row = Math.floor(index / grid.columns);
  
  return {
    x: (column + 1) * grid.spacing.x - 25,
    y: (row + 1) * grid.spacing.y
  };
}

function getRandomVelocity() {
  const baseSpeed = 0.3; // Lower speed for smoother movement
  return {
      x: (Math.random() - 0.5) * baseSpeed,
      y: Math.random() * baseSpeed + 0.3
  };
}


function createGameElement(type, index) {
  if (isGameOver || isPaused || activeElements >= maxElements) return;

  const element = document.createElement('div');
  element.className = 'game-element';
  
  if (type === 'dolphin') {
    element.innerHTML = '🐬';
    element.classList.add('dolphin');
    element.dataset.points = '2';
  } else if (type === 'bomb') {
    element.innerHTML = '💣';
    element.classList.add('bomb');
    element.dataset.points = '-3';
  } else if (type === 'special') {
    element.innerHTML = '⭐';
    element.classList.add('special');
    element.dataset.points = '5';
  }

  // Use grid position for initial placement
  const position = getGridPosition(index);
  element.style.left = `${position.x}px`;
  element.style.top = `${position.y}px`;

  element.velocity = getRandomVelocity();

  element.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isGameOver && !isPaused) {
      if (type === 'special') {
        activateFreeze();
        score += parseInt(element.dataset.points);
        playSound('special');
        element.remove();
      } else if (isTimeFrozen) {
        // During freeze time, make elements more valuable
        const points = parseInt(element.dataset.points);
        score += points * 2; // Double points during freeze
        element.classList.add(type === 'dolphin' ? 'caught' : 'exploded');
        playSound(type);
        setTimeout(() => element.remove(), 200);
      }
      
      scoreElement.textContent = `Score: ${score}`;
      activeElements--;
    }
  });

  activeElements++;
  gameContainer.appendChild(element);
  return element;
}

function spawnWave() {
  const totalSpots = grid.columns * grid.rows;
  const availableSpots = Math.min(totalSpots, maxElements - activeElements);

  const positions = Array.from({ length: availableSpots }, (_, i) => i);
  positions.sort(() => Math.random() - 0.5);

  let index = 0;
  if (availableSpots > 0) {
      createGameElement('special', positions[index++]);  // 1 special element

      // Remaining elements as dolphins and bombs
      const dolphinCount = Math.floor((availableSpots - 1) * 0.6);
      for (let i = 0; i < dolphinCount && index < availableSpots; i++) {
          createGameElement('dolphin', positions[index++]);
      }
      while (index < availableSpots) {
          createGameElement('bomb', positions[index++]);
      }
  }
}

function activateFreeze() {
  isTimeFrozen = true;
  document.querySelectorAll('.game-element').forEach(el => {
      el.classList.add('clickable');
      el.velocity = { x: 0, y: 0 };
  });

  let freezeTime = 5;
  const freezeTimer = setInterval(() => {
      if (--freezeTime <= 0) {
          clearInterval(freezeTimer);
          endFreeze();
      }
  }, 1000);
}


function endFreeze() {
  isTimeFrozen = false;
  gameContainer.classList.remove('frozen');
  
  document.querySelectorAll('.game-element').forEach(el => {
    el.classList.remove('clickable');
    el.velocity = getRandomVelocity();
  });
}

function updateElementPositions() {
  if (isPaused || isTimeFrozen) return;

  const elements = document.querySelectorAll('.game-element');
  const rect = gameContainer.getBoundingClientRect();

  elements.forEach(element => {
      const elementRect = element.getBoundingClientRect();
      let x = parseFloat(element.style.left) || 0;
      let y = parseFloat(element.style.top) || 0;

      x += element.velocity.x;
      y += element.velocity.y;

      if (x <= 0 || x + elementRect.width >= rect.width) {
          element.velocity.x *= -1;
          x = x <= 0 ? 0 : rect.width - elementRect.width;
      }

      element.style.left = `${x}px`;
      element.style.top = `${y}px`;

      if (y > rect.height) {
          activeElements--;
          element.remove();
      }
  });
}
 

// Sound effects
function playSound(type) {
  const sounds = {
    dolphin: new Audio('path/to/dolphin-sound.mp3'),
    bomb: new Audio('path/to/explosion-sound.mp3'),
    special: new Audio('path/to/powerup-sound.mp3')
  };
  
  const sound = sounds[type];
  if (sound) {
    sound.volume = 0.3;
    sound.play().catch(() => {});
  }
}

function gameLoop(currentTime) {
  if (!isGameOver && !isPaused) {
      const deltaTime = currentTime - lastTime;

      // Adjusting the spawn interval
      if (deltaTime >= 7000 && document.querySelectorAll('.game-element').length === 0) {
          spawnWave();
          lastTime = currentTime;
      }

      updateElementPositions();
      requestAnimationFrame(gameLoop);
  }
}


// Rest of the functions remain the same...
// (updateTimer, endGame, resetGame, togglePause, saveGameScore)

// Initialize game
window.addEventListener('resize', () => {
  grid.spacing = {
    x: window.innerWidth / 6,
    y: window.innerHeight / 4
  };
});



// Start game loop and timer
requestAnimationFrame(gameLoop);
setInterval(updateTimer, 1000);

// Event listeners
playAgainBtn.addEventListener('click', resetGame);
pauseBtn.addEventListener('click', togglePause);
exitGameBtn.addEventListener('click', () => {
  window.location.href = 'home.html';
});

function clearElements() {
  const elements = document.querySelectorAll('.game-element');
  elements.forEach(element => element.remove());
  activeElements = 0;
}

function updateTimer() {
  if (isPaused) return;
  
  if (timeRemaining > 0) {
    timeRemaining--;
    timerElement.textContent = `Time: ${timeRemaining}s`;
    
    if (timeRemaining <= 10) {
      timerElement.classList.add('warning');
    }
    
    if (timeRemaining === 0) {
      endGame();
    }
  }
}

function endGame() {
  isGameOver = true;
  clearElements();
  finalScoreSpan.textContent = score;
  menuOverlay.style.display = 'flex';
  saveGameScore(score);
}

function resetGame() {
  clearElements(); // Clear all game elements
  activeElements = 0;
  score = 0;
  isGameOver = false;
  isPaused = false;
  timeRemaining = 30;

  scoreElement.textContent = 'Score: 0';
  timerElement.textContent = 'Time: 30s';
  menuOverlay.style.display = 'none';

  requestAnimationFrame(gameLoop);
}


function togglePause() {
  isPaused = !isPaused;
  pauseBtn.classList.toggle('paused');
  
  if (!isPaused) {
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
  }
}

// Initialize game
const username = localStorage.getItem('username');
const token = localStorage.getItem('token');
if (!username || !token) {
    window.location.href = 'home.html';
}

async function saveGameScore(gameScore) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.error('Authentication token not found');
    return;
  }

  try {
    const response = await fetch('https://dolphins-ai6u.onrender.com/api/rewards/update-game-score', {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username,
        gameScore
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Server error');
    }

    localStorage.setItem('score', data.newScore.toString());
    return data.newScore;

  } catch (error) {
    console.error('Error saving score:', error);
    throw error;
  }
}