export default function initSnake(container, controlsContainer) {
    container.innerHTML = `
        <canvas id="snakeCanvas" style="width:100%; max-width:340px; height:340px; display:block; margin:0 auto; border-radius:14px; background:#0a0e1a; touch-action:none;"></canvas>
        <div id="snakeInfo" style="text-align:center; margin-top:10px; font-family:'JetBrains Mono',monospace; color:var(--text-soft); font-size:14px;">Score: 0 · Meilleur: 0</div>
    `;
    controlsContainer.innerHTML = `
        <div style="display:grid; grid-template-columns:repeat(3,58px); grid-template-rows:repeat(3,58px); gap:6px; justify-content:center; margin-top:12px;">
            <div></div>
            <button data-dir="UP" style="background:var(--primary); color:#fff; border:none; border-radius:12px; font-size:1.3rem; cursor:pointer;">▲</button>
            <div></div>
            <button data-dir="LEFT" style="background:var(--primary); color:#fff; border:none; border-radius:12px; font-size:1.3rem; cursor:pointer;">◀</button>
            <button id="snakePause" style="background:var(--surface-alt); color:var(--text); border:1px solid var(--border); border-radius:12px; font-size:1.2rem; cursor:pointer;">⏸</button>
            <button data-dir="RIGHT" style="background:var(--primary); color:#fff; border:none; border-radius:12px; font-size:1.3rem; cursor:pointer;">▶</button>
            <div></div>
            <button data-dir="DOWN" style="background:var(--primary); color:#fff; border:none; border-radius:12px; font-size:1.3rem; cursor:pointer;">▼</button>
            <div></div>
        </div>
        <button id="snakeRestart" style="margin-top:12px; padding:10px; width:100%; border-radius:10px; background:var(--surface-alt); color:var(--text); border:1px solid var(--border); font-weight:700; cursor:pointer;">🔄 Recommencer</button>
    `;

    const canvas = document.getElementById('snakeCanvas');
    const ctx = canvas.getContext('2d');
    const CSS = 340, DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = CSS * DPR; canvas.height = CSS * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    const GRID = 17, BOX = CSS / GRID;
    let snake, dir, nextDir, food, score, best = parseInt(localStorage.getItem('snake_best') || '0');
    let tickMs, tickTimer, rafId, lastTime, gameover, paused;

    function reset() {
        snake = [{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }];
        dir = 'RIGHT'; nextDir = 'RIGHT';
        food = randomFood();
        score = 0; gameover = false; paused = false;
        tickMs = 130;
        updateInfo();
    }

    function randomFood() {
        let pos;
        do { pos = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) }; }
        while (snake.some(s => s.x === pos.x && s.y === pos.y));
        return pos;
    }

    function updateInfo() {
        document.getElementById('snakeInfo').textContent = `Score: ${score} · Meilleur: ${best}`;
    }

    function changeDir(newDir) {
        const opp = { LEFT: 'RIGHT', RIGHT: 'LEFT', UP: 'DOWN', DOWN: 'UP' };
        if (newDir !== opp[dir]) nextDir = newDir;
    }

    function step() {
        if (gameover || paused) return;
        dir = nextDir;
        const head = { ...snake[0] };
        if (dir === 'LEFT') head.x--;
        if (dir === 'RIGHT') head.x++;
        if (dir === 'UP') head.y--;
        if (dir === 'DOWN') head.y++;

        if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID || snake.some(s => s.x === head.x && s.y === head.y)) {
            gameover = true;
            if (score > best) { best = score; localStorage.setItem('snake_best', best); }
            updateInfo();
            return;
        }

        snake.unshift(head);
        if (head.x === food.x && head.y === food.y) {
            score++;
            food = randomFood();
            if (score % 5 === 0 && tickMs > 70) {
                tickMs -= 8;
                clearInterval(tickTimer);
                tickTimer = setInterval(step, tickMs);
            }
        } else {
            snake.pop();
        }
        updateInfo();
    }

    function draw() {
        // Fond
        ctx.fillStyle = '#0a0e1a';
        ctx.fillRect(0, 0, CSS, CSS);

        // Grille subtile
        ctx.strokeStyle = 'rgba(0,170,255,0.06)';
        ctx.lineWidth = 1;
        for (let i = 1; i < GRID; i++) {
            ctx.beginPath(); ctx.moveTo(i * BOX, 0); ctx.lineTo(i * BOX, CSS); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i * BOX); ctx.lineTo(CSS, i * BOX); ctx.stroke();
        }

        // Food
        ctx.fillStyle = '#ff4757';
        ctx.shadowColor = '#ff4757';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(food.x * BOX + BOX / 2, food.y * BOX + BOX / 2, BOX / 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Snake
        for (let i = 0; i < snake.length; i++) {
            const s = snake[i];
            const t = i / snake.length;
            if (i === 0) {
                ctx.fillStyle = '#00d4ff';
                ctx.shadowColor = '#00d4ff';
                ctx.shadowBlur = 12;
            } else {
                const g = Math.floor(100 + (1 - t) * 100);
                ctx.fillStyle = `rgb(13, 110, ${g})`;
                ctx.shadowBlur = 0;
            }
            ctx.beginPath();
            ctx.roundRect(s.x * BOX + 2, s.y * BOX + 2, BOX - 4, BOX - 4, 5);
            ctx.fill();
        }
        ctx.shadowBlur = 0;

        if (gameover) {
            ctx.fillStyle = 'rgba(0,0,0,0.75)';
            ctx.fillRect(0, CSS / 2 - 50, CSS, 100);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 22px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('💀 Game Over', CSS / 2, CSS / 2 - 5);
            ctx.font = '13px Inter, sans-serif';
            ctx.fillStyle = '#94a3b8';
            ctx.fillText(`Score: ${score} · Meilleur: ${best}`, CSS / 2, CSS / 2 + 22);
            ctx.textAlign = 'left';
        }

        if (paused && !gameover) {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, 0, CSS, CSS);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 24px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('⏸ Pause', CSS / 2, CSS / 2);
            ctx.textAlign = 'left';
        }
    }

    function loop(ts) {
        if (!lastTime) lastTime = ts;
        lastTime = ts;
        draw();
        rafId = requestAnimationFrame(loop);
    }

    function start() {
        reset();
        if (tickTimer) clearInterval(tickTimer);
        tickTimer = setInterval(step, tickMs);
        if (rafId) cancelAnimationFrame(rafId);
        lastTime = 0;
        rafId = requestAnimationFrame(loop);
    }

    // Controls
    document.querySelectorAll('[data-dir]').forEach(btn => {
        btn.addEventListener('click', () => changeDir(btn.dataset.dir));
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); changeDir(btn.dataset.dir); }, { passive: false });
    });

    document.getElementById('snakeRestart').addEventListener('click', start);

    document.getElementById('snakePause').addEventListener('click', () => {
        paused = !paused;
        document.getElementById('snakePause').textContent = paused ? '▶' : '⏸';
    });

    // Swipe
    let tsX = 0, tsY = 0;
    canvas.addEventListener('touchstart', (e) => { tsX = e.touches[0].clientX; tsY = e.touches[0].clientY; }, { passive: true });
    canvas.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].clientX - tsX;
        const dy = e.changedTouches[0].clientY - tsY;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 25) return;
        if (Math.abs(dx) > Math.abs(dy)) changeDir(dx > 0 ? 'RIGHT' : 'LEFT');
        else changeDir(dy > 0 ? 'DOWN' : 'UP');
    }, { passive: true });

    function onKey(e) {
        if (e.key === 'ArrowLeft') changeDir('LEFT');
        else if (e.key === 'ArrowRight') changeDir('RIGHT');
        else if (e.key === 'ArrowUp') changeDir('UP');
        else if (e.key === 'ArrowDown') changeDir('DOWN');
        else if (e.key === ' ') { e.preventDefault(); paused = !paused; document.getElementById('snakePause').textContent = paused ? '▶' : '⏸'; }
    }
    document.addEventListener('keydown', onKey);

    start();

    return {
        stop() {
            if (tickTimer) clearInterval(tickTimer);
            if (rafId) cancelAnimationFrame(rafId);
            document.removeEventListener('keydown', onKey);
        }
    };
}
