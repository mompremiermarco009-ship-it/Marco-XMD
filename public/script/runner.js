// script/runner.js
export default function initRunner(container, controlsContainer) {
    container.innerHTML = '<canvas id="runnerCanvas" width="360" height="180" class="game-canvas"></canvas>';
    controlsContainer.innerHTML = `
        <div style="display:flex; justify-content:center; gap:20px; margin-top:10px;">
            <button id="btnJump" style="padding:15px 30px; font-size:1.2rem; background:var(--primary); color:#000; border:none; border-radius:10px; font-weight:bold;">⬆️ Sauter</button>
            <button id="btnSlide" style="padding:15px 30px; font-size:1.2rem; background:var(--primary); color:#000; border:none; border-radius:10px; font-weight:bold;">⬇️ Glisser</button>
        </div>
        <button id="restartRunner" style="margin-top:10px; padding:10px 20px; font-size:1rem;">🔄 Recommencer</button>
    `;

    const canvas = document.getElementById('runnerCanvas');
    const ctx = canvas.getContext('2d');
    const groundY = 150;
    const playerNormalHeight = 30;
    const playerSlideHeight = 15;
    const gravity = 0.4;
    const jumpPower = -10;

    let player = { x: 50, y: groundY - playerNormalHeight, width: 30, height: playerNormalHeight, vy: 0, jumping: false, sliding: false };
    let obstacles = [];
    let frame = 0;
    let speed = 3;
    let gameover = false;
    let score = 0;
    let gameInterval;

    function randomObstacle() {
        const type = Math.random() < 0.5 ? 'high' : 'low';
        const width = 20 + Math.floor(Math.random() * 10);
        const height = type === 'high' ? 25 : 15;
        const y = groundY - height;
        obstacles.push({ x: canvas.width, y, width, height, type });
    }

    function update() {
        if (gameover) return;
        frame++;

        // Physique du saut
        if (player.jumping) {
            player.vy += gravity;
            player.y += player.vy;
            // Atterrissage
            if (player.y >= groundY - playerNormalHeight) {
                player.y = groundY - playerNormalHeight;
                player.jumping = false;
                player.vy = 0;
            }
        }

        // Gestion du glissement
        if (player.sliding) {
            player.height = playerSlideHeight;
            player.y = groundY - playerSlideHeight;
        } else if (!player.jumping) {
            // Si on ne saute pas et qu'on ne glisse pas, on est debout normalement au sol
            player.height = playerNormalHeight;
            player.y = groundY - playerNormalHeight;
        }

        // Mouvement des obstacles
        for (let i = obstacles.length - 1; i >= 0; i--) {
            obstacles[i].x -= speed;
            if (obstacles[i].x + obstacles[i].width < 0) {
                obstacles.splice(i, 1);
                score++;
            }
        }

        // Génération d'obstacles
        if (frame % 80 === 0) randomObstacle();

        // Collision
        for (let obs of obstacles) {
            if (player.x < obs.x + obs.width &&
                player.x + player.width > obs.x &&
                player.y < obs.y + obs.height &&
                player.y + player.height > obs.y) {
                gameover = true;
                clearInterval(gameInterval);
                return;
            }
        }

        // Augmentation progressive de la vitesse
        if (score % 10 === 0 && score > 0) {
            speed = 3 + score / 10;
        }
    }

    function draw() {
        // Fond
        ctx.clearRect(0, 0, 360, 180);
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(0, 0, 360, groundY);
        ctx.fillStyle = '#8B5A2B';
        ctx.fillRect(0, groundY, 360, 30);

        // Joueur
        ctx.fillStyle = '#FFA500';
        ctx.fillRect(player.x, player.y, player.width, player.height);

        // Obstacles
        ctx.fillStyle = '#555';
        for (let obs of obstacles) {
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        }

        // Score
        ctx.fillStyle = '#000';
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.fillText('Score: ' + score, 10, 20);

        if (gameover) {
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(0, 60, 360, 60);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 20px Inter, sans-serif';
            ctx.fillText('Game Over!', 100, 95);
        }
    }

    function gameLoop() {
        update();
        draw();
    }

    function start() {
        player = { x: 50, y: groundY - playerNormalHeight, width: 30, height: playerNormalHeight, vy: 0, jumping: false, sliding: false };
        obstacles = [];
        frame = 0;
        speed = 3;
        gameover = false;
        score = 0;
        if (gameInterval) clearInterval(gameInterval);
        gameInterval = setInterval(gameLoop, 1000 / 60);
    }

    function jump() {
        if (!player.jumping && !gameover && !player.sliding) {
            player.jumping = true;
            player.vy = jumpPower;
        }
    }

    function slideStart() {
        if (!gameover && !player.jumping) {
            player.sliding = true;
        }
    }

    function slideEnd() {
        player.sliding = false;
    }

    // Contrôles boutons
    document.getElementById('btnJump').addEventListener('mousedown', jump);
    document.getElementById('btnJump').addEventListener('touchstart', jump);
    document.getElementById('btnSlide').addEventListener('mousedown', slideStart);
    document.getElementById('btnSlide').addEventListener('touchstart', slideStart);
    document.getElementById('btnSlide').addEventListener('mouseup', slideEnd);
    document.getElementById('btnSlide').addEventListener('touchend', slideEnd);
    document.getElementById('restartRunner').addEventListener('click', start);

    // Contrôles clavier (Espace ou Flèche Haut pour sauter)
    function keyHandler(e) {
        if (e.key === 'ArrowUp' || e.key === ' ' || e.code === 'Space') {
            e.preventDefault();
            jump();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            slideStart();
        }
    }
    function keyUpHandler(e) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            slideEnd();
        }
    }
    document.addEventListener('keydown', keyHandler);
    document.addEventListener('keyup', keyUpHandler);

    start();

    return {
        stop() {
            clearInterval(gameInterval);
            document.removeEventListener('keydown', keyHandler);
            document.removeEventListener('keyup', keyUpHandler);
        }
    };
}
