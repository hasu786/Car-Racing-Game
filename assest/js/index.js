// Game elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const scoreValue = document.getElementById('scoreValue');
const livesValue = document.getElementById('livesValue');
const speedValue = document.getElementById('speedValue');
const finalScore = document.getElementById('finalScore');
const highScoreMessage = document.getElementById('highScoreMessage');
const soundToggle = document.getElementById('soundToggle');

// Audio elements
const crashSound = document.getElementById('crashSound');
const explosionSound = document.getElementById('explosionSound');
const gameOverSound = document.getElementById('gameOverSound');
const boostSound = document.getElementById('boostSound');
const speedUpSound = document.getElementById('speedUpSound');

// Car images
const playerCarImg = document.getElementById('playerCarImg');
const enemyCarImages = [
    document.getElementById('enemyCar1Img'),
    document.getElementById('enemyCar2Img'),
    document.getElementById('enemyCar3Img'),
    document.getElementById('enemyCar4Img')
];

// Explosion images
const explosionImages = [
    document.getElementById('explosion1Img'),
    document.getElementById('explosion2Img'),
    document.getElementById('explosion3Img')
];

// Game variables
let gameRunning = false;
let score = 0;
let lives = 3;
let gameSpeed = 1;
let enemyBaseSpeed = 2;
let highScore = localStorage.getItem('carRacingHighScore') || 0;
let lastTime = 0;
let boost = 100;
let boostActive = false;
let gameStarted = false;
let imagesLoaded = false;
let speedIncreaseInterval = 900;
let nextSpeedIncrease = speedIncreaseInterval;
let soundEnabled = true;

// Explosion effects array
let explosions = [];

// Function to check if all images are loaded
function checkImagesLoaded() {
    const allImages = [playerCarImg, ...enemyCarImages, ...explosionImages];
    if (allImages.every(img => img.complete)) {
        imagesLoaded = true;
    } else {
        setTimeout(checkImagesLoaded, 100);
    }
}

checkImagesLoaded();

// Audio initialization and fallback
function initializeAudio() {
    // Set audio volume
    crashSound.volume = 0.6;
    explosionSound.volume = 0.7;
    gameOverSound.volume = 0.5;
    boostSound.volume = 0.4;
    speedUpSound.volume = 0.5;

    // Try to preload audio
    try {
        crashSound.load();
        explosionSound.load();
        gameOverSound.load();
        boostSound.load();
        speedUpSound.load();
    } catch (e) {
        console.log("Audio preload error:", e);
    }
}

initializeAudio();

// Play sound function with fallback
function playSound(soundElement, useFallback = false) {
    if (!soundEnabled) return;

    try {
        // Reset and play
        soundElement.currentTime = 0;
        soundElement.play().catch(e => {
            console.log("Audio play error:", e);
            // Fallback to Web Audio API if HTML5 audio fails
            if (useFallback) {
                playFallbackSound(soundElement.id);
            }
        });
    } catch (e) {
        console.log("Audio error:", e);
        if (useFallback) {
            playFallbackSound(soundElement.id);
        }
    }
}

// Fallback sound generation using Web Audio API
function playFallbackSound(soundType) {
    if (!soundEnabled) return;

    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        switch (soundType) {
            case 'crashSound':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.3);
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.4);
                break;

            case 'explosionSound':
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(100, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(30, audioContext.currentTime + 0.5);
                gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.5);
                break;

            case 'gameOverSound':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
                oscillator.frequency.linearRampToValueAtTime(150, audioContext.currentTime + 0.5);
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.5);
                break;

            case 'boostSound':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
                oscillator.frequency.linearRampToValueAtTime(600, audioContext.currentTime + 0.2);
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
                break;

            case 'speedUpSound':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(500, audioContext.currentTime);
                oscillator.frequency.linearRampToValueAtTime(800, audioContext.currentTime + 0.2);
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
                break;
        }
    } catch (e) {
        console.log("Web Audio API not supported:", e);
    }
}

// Sound toggle functionality
soundToggle.addEventListener('click', function () {
    soundEnabled = !soundEnabled;
    if (soundEnabled) {
        this.textContent = '🔊';
        this.classList.remove('muted');
    } else {
        this.textContent = '🔇';
        this.classList.add('muted');
    }
});

// Player car
const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 100,
    width: 50,
    height: 80,
    speed: 7,
    draw: function () {
        if (imagesLoaded) {
            ctx.drawImage(playerCarImg, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        // Boost effect
        if (boostActive) {
            ctx.fillStyle = '#f1c40f';
            ctx.fillRect(this.x + this.width / 2 - 5, this.y + this.height, 10, 20);
        }
    },
    move: function (direction) {
        if (direction === 'left' && this.x > 0) {
            this.x -= this.speed;
        }
        if (direction === 'right' && this.x < canvas.width - this.width) {
            this.x += this.speed;
        }
    }
};

// Enemy cars array
let enemies = [];

// Road markings
let roadMarkings = [];
for (let i = 0; i < 10; i++) {
    roadMarkings.push({
        x: canvas.width / 2 - 2,
        y: i * 60,
        width: 4,
        height: 30
    });
}

// Initialize game
function initGame() {
    score = 0;
    lives = 3;
    gameSpeed = 1;
    enemyBaseSpeed = 2;
    nextSpeedIncrease = speedIncreaseInterval;
    boost = 100;
    boostActive = false;
    gameStarted = true;
    enemies = [];
    explosions = [];
    scoreValue.textContent = score;
    livesValue.textContent = lives;
    speedValue.textContent = gameSpeed.toFixed(1);

    player.x = canvas.width / 2 - 25;
    player.y = canvas.height - 100;

    roadMarkings = [];
    for (let i = 0; i < 10; i++) {
        roadMarkings.push({
            x: canvas.width / 2 - 2,
            y: i * 60,
            width: 4,
            height: 30
        });
    }
}

// Draw road
function drawRoad() {
    ctx.fillStyle = '#34495e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#7f8c8d';
    ctx.fillRect(0, 0, 30, canvas.height);
    ctx.fillRect(canvas.width - 30, 0, 30, canvas.height);

    ctx.fillStyle = '#f1c40f';
    roadMarkings.forEach(mark => {
        ctx.fillRect(mark.x, mark.y, mark.width, mark.height);
    });
}

// Create explosion effect
function createExplosion(x, y) {
    const explosion = {
        x: x - 50,
        y: y - 50,
        width: 100,
        height: 100,
        frame: 0,
        maxFrames: 3,
        frameDelay: 5,
        currentDelay: 0,
        active: true
    };
    explosions.push(explosion);

    // Screen shake effect
    canvas.style.transform = 'translate(5px, 5px)';
    setTimeout(() => {
        canvas.style.transform = 'translate(-5px, -5px)';
    }, 50);
    setTimeout(() => {
        canvas.style.transform = 'translate(0, 0)';
    }, 100);

    // Play explosion sound
    playSound(explosionSound, true);
}

// Draw explosion effect
function drawExplosion(explosion) {
    if (!explosion.active) return;

    if (imagesLoaded && explosionImages.length > 0) {
        const img = explosionImages[explosion.frame];
        if (img && img.complete) {
            ctx.drawImage(img, explosion.x, explosion.y, explosion.width, explosion.height);
        }
    } else {
        // Fallback explosion effect with particles
        ctx.fillStyle = `rgba(255, ${Math.random() * 100 + 100}, 0, 0.8)`;
        ctx.beginPath();
        ctx.arc(
            explosion.x + explosion.width / 2,
            explosion.y + explosion.height / 2,
            explosion.width / 2,
            0,
            Math.PI * 2
        );
        ctx.fill();

        // Draw explosion particles
        for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 30;
            ctx.fillStyle = `rgba(255, ${Math.random() * 155}, 0, 0.7)`;
            ctx.fillRect(
                explosion.x + explosion.width / 2 + Math.cos(angle) * distance - 5,
                explosion.y + explosion.height / 2 + Math.sin(angle) * distance - 5,
                10,
                10
            );
        }
    }

    // Update explosion frame
    explosion.currentDelay++;
    if (explosion.currentDelay >= explosion.frameDelay) {
        explosion.currentDelay = 0;
        explosion.frame++;
        if (explosion.frame >= explosion.maxFrames) {
            explosion.active = false;
        }
    }
}

// Create enemy car
function createEnemy() {
    const width = 50;
    const height = 90;
    const x = Math.random() * (canvas.width - width - 60) + 30;

    const speedBonus = Math.floor(score / 100) * 0.3;
    const minSpeed = enemyBaseSpeed + speedBonus;
    const speed = minSpeed + Math.random() * 2;

    let enemyImg;
    if (imagesLoaded && enemyCarImages.length > 0) {
        enemyImg = enemyCarImages[Math.floor(Math.random() * enemyCarImages.length)];
    }

    enemies.push({
        x: x,
        y: -height,
        width: width,
        height: height,
        speed: speed,
        image: enemyImg,
        baseSpeed: speed
    });
}

// Draw enemy car
function drawEnemy(enemy) {
    if (imagesLoaded && enemy.image && enemy.image.complete) {
        ctx.drawImage(enemy.image, enemy.x, enemy.y, enemy.width, enemy.height);
    } else {
        const colors = ['#2ecc71', '#9b59b6', '#3498db', '#e67e22'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        ctx.fillStyle = color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    }
}

// Update game state
function updateGame(timestamp) {
    if (!gameRunning) return;

    const deltaTime = timestamp - lastTime || 0;
    lastTime = timestamp;

    // Move road markings
    roadMarkings.forEach(mark => {
        mark.y += 5 * gameSpeed;
        if (mark.y > canvas.height) {
            mark.y = -30;
        }
    });

    // Create new enemies
    const spawnRate = 0.02 + (Math.floor(score / 500) * 0.005);
    if (Math.random() < spawnRate * gameSpeed) {
        createEnemy();
    }

    // Move enemies
    enemies.forEach(enemy => {
        enemy.y += enemy.speed * gameSpeed;
    });

    // Remove enemies that are off screen
    enemies = enemies.filter(enemy => enemy.y < canvas.height);

    // Check for collisions
    enemies.forEach(enemy => {
        if (
            player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y
        ) {
            // Play crash sound
            playSound(crashSound, true);

            // Create explosion at collision point
            const explosionX = (player.x + enemy.x + enemy.width / 2) / 2;
            const explosionY = (player.y + enemy.y + enemy.height / 2) / 2;
            createExplosion(explosionX, explosionY);

            // Create multiple smaller explosions
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    const offsetX = Math.random() * 40 - 20;
                    const offsetY = Math.random() * 40 - 20;
                    createExplosion(explosionX + offsetX, explosionY + offsetY);
                }, i * 50);
            }

            // Remove the enemy
            enemies = enemies.filter(e => e !== enemy);
            lives--;
            livesValue.textContent = lives;

            // Visual feedback for hit
            ctx.fillStyle = '#ff0000';
            ctx.font = 'bold 40px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('CRASH!', canvas.width / 2, canvas.height / 2 - 50);

            // Clear the message after 0.5 seconds
            setTimeout(() => {
                drawRoad();
                enemies.forEach(drawEnemy);
                player.draw();
                explosions.forEach(drawExplosion);
                drawBoostBar();
            }, 500);

            if (lives <= 0) {
                // Create final explosion for game over
                createExplosion(player.x + player.width / 2, player.y + player.height / 2);
                setTimeout(() => {
                    // Play game over sound
                    playSound(gameOverSound, true);
                    gameOver();
                }, 1000);
            }
        }
    });

    // Update explosions
    explosions.forEach((explosion, index) => {
        drawExplosion(explosion);
        if (!explosion.active) {
            explosions.splice(index, 1);
        }
    });

    // Increase score
    score += Math.floor(gameSpeed);
    scoreValue.textContent = score;

    // Increase game speed every 900 points
    if (score >= nextSpeedIncrease) {
        gameSpeed += 0.2;
        enemyBaseSpeed += 0.5;
        nextSpeedIncrease += speedIncreaseInterval;

        speedValue.textContent = gameSpeed.toFixed(1);

        // Play speed up sound
        playSound(speedUpSound, true);

        // Visual feedback for speed increase
        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('SPEED INCREASED!', canvas.width / 2, 100);

        setTimeout(() => {
            drawRoad();
            enemies.forEach(drawEnemy);
            player.draw();
            explosions.forEach(drawExplosion);
            drawBoostBar();
        }, 1000);
    }

    // Gradual enemy speed increase
    if (score % 100 === 0) {
        enemies.forEach(enemy => {
            enemy.speed += 0.05;
        });
    }

    // Recharge boost
    if (boost < 100 && !boostActive) {
        boost += 0.1;
        if (boost > 100) boost = 100;
    }

    // Apply boost if active
    if (boostActive) {
        boost -= 1;
        if (boost <= 0) {
            boostActive = false;
            boost = 0;
        }
    }

    // Draw everything
    drawRoad();
    enemies.forEach(drawEnemy);
    explosions.forEach(drawExplosion);
    player.draw();
    drawBoostBar();

    // Display game info
    const speedLevel = Math.floor((score / speedIncreaseInterval)) + 1;
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Speed Level: ${speedLevel}`, 20, canvas.height - 20);
    ctx.fillText(`Next Level: ${nextSpeedIncrease - score} pts`, 20, canvas.height - 40);

    requestAnimationFrame(updateGame);
}

// Draw boost bar
function drawBoostBar() {
    const barWidth = 200;
    const barHeight = 20;
    const x = canvas.width / 2 - barWidth / 2;
    const y = 20;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x, y, barWidth, barHeight);

    ctx.fillStyle = boostActive ? '#f1c40f' : '#2ecc71';
    ctx.fillRect(x, y, barWidth * (boost / 100), barHeight);

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, barWidth, barHeight);

    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('BOOST', canvas.width / 2, y + barHeight + 18);
}

// Start game function
function startGame() {
    if (gameRunning) return;

    initGame();
    gameRunning = true;
    gameStarted = true;
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    lastTime = performance.now();
    requestAnimationFrame(updateGame);
}

// Game over
function gameOver() {
    gameRunning = false;
    gameStarted = false;

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('carRacingHighScore', highScore);
        highScoreMessage.style.display = 'block';
    } else {
        highScoreMessage.style.display = 'none';
    }

    finalScore.textContent = score;
    gameOverScreen.style.display = 'flex';
}

// Event listeners
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

// Keyboard controls
const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.key] = true;

    if ((e.key === ' ' || e.key === 'Spacebar') && !gameRunning && gameStarted === false) {
        startGame();
        e.preventDefault();
        return;
    }

    if ((e.key === ' ' || e.key === 'Spacebar') && !gameRunning && gameOverScreen.style.display === 'flex') {
        startGame();
        e.preventDefault();
        return;
    }

    if ((e.key === ' ' || e.key === 'Spacebar') && boost >= 20 && !boostActive && gameRunning) {
        boostActive = true;
        playSound(boostSound, true); // Play boost sound
        e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Handle continuous key presses
function handleControls() {
    if (gameRunning) {
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
            player.move('left');
        }
        if (keys['ArrowRight'] || keys['d'] || keys['D']) {
            player.move('right');
        }
    }
}

// Control update loop
function controlLoop() {
    handleControls();
    requestAnimationFrame(controlLoop);
}

controlLoop();

// Initial game setup
initGame();
drawRoad();
player.draw();
gameRunning = false;
gameStarted = false;