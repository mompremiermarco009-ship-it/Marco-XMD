// script/snake.js
export default function initSnake(container, controlsContainer) {
    container.innerHTML = '<canvas id="snakeCanvas" width="300" height="300" class="game-canvas"></canvas>';
    controlsContainer.innerHTML = `
        <div class="d-pad" style="display:grid;grid-template-columns:repeat(3,70px);grid-template-rows:repeat(3,70px);gap:6px;justify-content:center;margin-top:10px;">
            <div></div>
            <button id="btnUp" style="width:70px;height:70px;font-size:2rem;background:rgba(0,255,204,0.15);border:1px solid var(--primary);color:var(--primary);border-radius:10px;cursor:pointer;">▲</button>
            <div></div>
            <button id="btnLeft" style="width:70px;height:70px;font-size:2rem;background:rgba(0,255,204,0.15);border:1px solid var(--primary);color:var(--primary);border-radius:10px;cursor:pointer;">◀</button>
            <div></div>
            <button id="btnRight" style="width:70px;height:70px;font-size:2rem;background:rgba(0,255,204,0.15);border:1px solid var(--primary);color:var(--primary);border-radius:10px;cursor:pointer;">▶</button>
            <div></div>
            <button id="btnDown" style="width:70px;height:70px;font-size:2rem;background:rgba(0,255,204,0.15);border:1px solid var(--primary);color:var(--primary);border-radius:10px;cursor:pointer;">▼</button>
            <div></div>
        </div>
        <button id="restartSnake" style="margin-top:15px;padding:10px 20px;font-size:1rem;">🔄 Rejouer</button>
    `;

    const canvas = document.getElementById('snakeCanvas');
    const ctx = canvas.getContext('2d');
    const box = 15;
    let snake = [{x: 10*box, y: 10*box}];
    let direction = 'RIGHT';
    let nextDirection = 'RIGHT';
    let food = randomFood();
    let score = 0;
    let highScore = 0;
    let gameover = false;
    let gameInterval;
    let speed = 120; // ms

    function randomFood() {
        return {
            x: Math.floor(Math.random()*20)*box,
            y: Math.floor(Math.random()*20)*box
        };
    }

    function changeDirection(newDir) {
        const opposites = { 'LEFT': 'RIGHT', 'RIGHT': 'LEFT', 'UP': 'DOWN', 'DOWN': 'UP' };
        if (newDir !== opposites[direction]) {
            nextDirection = newDir;
        }
    }

    function keyHandler(e) {
        if (gameover) return;
        const key = e.key;
        if (key === 'ArrowLeft') changeDirection('LEFT');
        if (key === 'ArrowUp') changeDirection('UP');
        if (key === 'ArrowRight') changeDirection('RIGHT');
        if (key === 'ArrowDown') changeDirection('DOWN');
    }
    document.addEventListener('keydown', keyHandler);

    document.getElementById('btnUp').addEventListener('click', () => changeDirection('UP'));
    document.getElementById('btnLeft').addEventListener('click', () => changeDirection('LEFT'));
    document.getElementById('btnRight').addEventListener('click', () => changeDirection('RIGHT'));
    document.getElementById('btnDown').addEventListener('click', () => changeDirection('DOWN'));
    document.getElementById('restartSnake').addEventListener('click', restart);

    function drawGrid() {
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 20; i++) {
            ctx.beginPath();
            ctx.moveTo(i*box, 0);
            ctx.lineTo(i*box, 300);
            ctx.stroke();
            ctx.moveTo(0, i*box);
            ctx.lineTo(300, i*box);
            ctx.stroke();
        }
    }

    function draw() {
        if (gameover) return;
        direction = nextDirection;
        ctx.clearRect(0,0,300,300);

        // Fond
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0,0,300,300);
        drawGrid();

        // Pomme (avec effet de brillance)
        ctx.fillStyle = '#ff3366';
        ctx.beginPath();
        ctx.arc(food.x + box/2, food.y + box/2, box/2.2, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#ff99bb';
        ctx.beginPath();
        ctx.arc(food.x + box/3, food.y + box/3, box/8, 0, Math.PI*2);
        ctx.fill();

        // Serpent
        for (let i=0; i<snake.length; i++) {
            const seg = snake[i];
            const radius = box/2.2;
            if (i === 0) {
                // Tête
                ctx.fillStyle = '#00ffcc';
                ctx.beginPath();
                ctx.arc(seg.x + box/2, seg.y + box/2, radius, 0, Math.PI*2);
                ctx.fill();
                // Yeux
                ctx.fillStyle = '#000';
                let eyeX1, eyeY1, eyeX2, eyeY2;
                if (direction === 'RIGHT') { eyeX1 = seg.x + box*0.7; eyeY1 = seg.y + box*0.3; eyeX2 = seg.x + box*0.7; eyeY2 = seg.y + box*0.7; }
                else if (direction === 'LEFT') { eyeX1 = seg.x + box*0.3; eyeY1 = seg.y + box*0.3; eyeX2 = seg.x + box*0.3; eyeY2 = seg.y + box*0.7; }
                else if (direction === 'UP') { eyeX1 = seg.x + box*0.3; eyeY1 = seg.y + box*0.3; eyeX2 = seg.x + box*0.7; eyeY2 = seg.y + box*0.3; }
                else { eyeX1 = seg.x + box*0.3; eyeY1 = seg.y + box*0.7; eyeX2 = seg.x + box*0.7; eyeY2 = seg.y + box*0.7; }
                ctx.beginPath();
                ctx.arc(eyeX1, eyeY1, box*0.12, 0, Math.PI*2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(eyeX2, eyeY2, box*0.12, 0, Math.PI*2);
                ctx.fill();
            } else {
                // Corps avec dégradé
                const gradient = ctx.createLinearGradient(seg.x, seg.y, seg.x+box, seg.y+box);
                gradient.addColorStop(0, '#00ffcc');
                gradient.addColorStop(1, '#00ccaa');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(seg.x + box/2, seg.y + box/2, radius, 0, Math.PI*2);
                ctx.fill();
            }
        }

        // Score
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.fillText('Score: ' + score, 10, 20);

        // Déplacement
        let head = {...snake[0]};
        if (direction === 'LEFT') head.x -= box;
        if (direction === 'UP') head.y -= box;
        if (direction === 'RIGHT') head.x += box;
        if (direction === 'DOWN') head.y += box;

        // Collision mur
        if (head.x < 0 || head.x >= 300 || head.y < 0 || head.y >= 300) {
            endGame();
            return;
        }
        // Collision soi‑même
        if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
            endGame();
            return;
        }

        snake.unshift(head);
        if (head.x === food.x && head.y === food.y) {
            score++;
            food = randomFood();
            // Accélération progressive
            if (score % 5 === 0 && speed > 80) {
                speed -= 5;
                clearInterval(gameInterval);
                gameInterval = setInterval(draw, speed);
            }
        } else {
            snake.pop();
        }
    }

    function endGame() {
        gameover = true;
        clearInterval(gameInterval);
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0,80,300,80);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px Inter, sans-serif';
        ctx.fillText('Game Over!', 70, 130);
        ctx.font = '14px Inter, sans-serif';
        ctx.fillText('Score: ' + score, 120, 155);
        if (score > highScore) highScore = score;
    }

    function restart() {
        clearInterval(gameInterval);
        snake = [{x: 10*box, y: 10*box}];
        direction = 'RIGHT';
        nextDirection = 'RIGHT';
        food = randomFood();
        score = 0;
        gameover = false;
        speed = 120;
        gameInterval = setInterval(draw, speed);
    }

    gameInterval = setInterval(draw, speed);

    return {
        stop() {
            clearInterval(gameInterval);
            document.removeEventListener('keydown', keyHandler);
        }
    };
}
