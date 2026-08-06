// script/snake.js
// Version améliorée : mouvement interpolé (rendu fluide entre deux cases,
// au lieu d'un saut sec case par case), pomme "pulsante", particules à la
// dégustation, contrôles tactiles par glissement (swipe), petits sons.
export default function initSnake(container, controlsContainer) {
    container.innerHTML = '<canvas id="snakeCanvas" width="300" height="300" class="game-canvas" style="border-radius:10px; display:block; margin:0 auto; touch-action:none;"></canvas>';
    controlsContainer.innerHTML = `
        <div class="d-pad" style="display:grid;grid-template-columns:repeat(3,64px);grid-template-rows:repeat(3,64px);gap:6px;justify-content:center;margin-top:10px;">
            <div></div>
            <button id="btnUp" style="width:64px;height:64px;font-size:1.6rem;background:rgba(59,130,246,0.12);border:1px solid #3b82f6;color:#3b82f6;border-radius:10px;cursor:pointer;">▲</button>
            <div></div>
            <button id="btnLeft" style="width:64px;height:64px;font-size:1.6rem;background:rgba(59,130,246,0.12);border:1px solid #3b82f6;color:#3b82f6;border-radius:10px;cursor:pointer;">◀</button>
            <div></div>
            <button id="btnRight" style="width:64px;height:64px;font-size:1.6rem;background:rgba(59,130,246,0.12);border:1px solid #3b82f6;color:#3b82f6;border-radius:10px;cursor:pointer;">▶</button>
            <div></div>
            <button id="btnDown" style="width:64px;height:64px;font-size:1.6rem;background:rgba(59,130,246,0.12);border:1px solid #3b82f6;color:#3b82f6;border-radius:10px;cursor:pointer;">▼</button>
            <div></div>
        </div>
        <p style="text-align:center; font-size:12px; color:#6b7280; margin-top:8px;">Glisse le doigt sur l'écran ou utilise les flèches</p>
        <button id="restartSnake" style="margin-top:12px;padding:10px 20px;font-size:1rem;width:100%;">🔄 Rejouer</button>
    `;

    const canvas = document.getElementById('snakeCanvas');
    const ctx = canvas.getContext('2d');
    const SIZE = 300, GRID = 20, box = SIZE / GRID;

    let snake, prevSnake, direction, nextDirection, food, foodPulse, score, gameover;
    let tickMs = 130, tickTimer, rafId, lastTick, particles, audioCtx;

    function beep(freq, duration, type = 'sine', gain = 0.05) {
        try {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            osc.type = type; osc.frequency.value = freq; g.gain.value = gain;
            osc.connect(g); g.connect(audioCtx.destination);
            osc.start();
            g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
            osc.stop(audioCtx.currentTime + duration);
        } catch {}
    }

    function randomFood() {
        let pos;
        do {
            pos = { x: Math.floor(Math.random() * GRID) * box, y: Math.floor(Math.random() * GRID) * box };
        } while (snake.some(s => s.x === pos.x && s.y === pos.y));
        return pos;
    }

    function spawnBurst(x, y, color) {
        for (let i = 0; i < 14; i++) {
            const a = Math.random() * Math.PI * 2;
            const sp = 40 + Math.random() * 90;
            particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.5, color });
        }
    }

    function changeDirection(newDir) {
        const opposites = { LEFT: 'RIGHT', RIGHT: 'LEFT', UP: 'DOWN', DOWN: 'UP' };
        if (newDir !== opposites[direction]) nextDirection = newDir;
    }

    function keyHandler(e) {
        if (gameover) return;
        if (e.key === 'ArrowLeft') changeDirection('LEFT');
        if (e.key === 'ArrowUp') changeDirection('UP');
        if (e.key === 'ArrowRight') changeDirection('RIGHT');
        if (e.key === 'ArrowDown') changeDirection('DOWN');
    }
    document.addEventListener('keydown', keyHandler);

    document.getElementById('btnUp').addEventListener('click', () => changeDirection('UP'));
    document.getElementById('btnLeft').addEventListener('click', () => changeDirection('LEFT'));
    document.getElementById('btnRight').addEventListener('click', () => changeDirection('RIGHT'));
    document.getElementById('btnDown').addEventListener('click', () => changeDirection('DOWN'));
    document.getElementById('restartSnake').addEventListener('click', restart);

    // Swipe tactile
    let touchStartX = 0, touchStartY = 0;
    function touchStart(e) { const t = e.touches[0]; touchStartX = t.clientX; touchStartY = t.clientY; }
    function touchEnd(e) {
        const t = e.changedTouches[0];
        const dx = t.clientX - touchStartX, dy = t.clientY - touchStartY;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
        if (Math.abs(dx) > Math.abs(dy)) changeDirection(dx > 0 ? 'RIGHT' : 'LEFT');
        else changeDirection(dy > 0 ? 'DOWN' : 'UP');
    }
    canvas.addEventListener('touchstart', touchStart, { passive: true });
    canvas.addEventListener('touchend', touchEnd, { passive: true });

    function tick() {
        if (gameover) return;
        direction = nextDirection;
        prevSnake = snake.map(s => ({ ...s }));

        const head = { ...snake[0] };
        if (direction === 'LEFT') head.x -= box;
        if (direction === 'UP') head.y -= box;
        if (direction === 'RIGHT') head.x += box;
        if (direction === 'DOWN') head.y += box;

        if (head.x < 0 || head.x >= SIZE || head.y < 0 || head.y >= SIZE || snake.some(s => s.x === head.x && s.y === head.y)) {
            endGame();
            return;
        }

        snake.unshift(head);
        if (head.x === food.x && head.y === food.y) {
            score++;
            spawnBurst(food.x + box / 2, food.y + box / 2, '#ff3366');
            beep(880, 0.08, 'square', 0.04);
            food = randomFood();
            if (score % 5 === 0 && tickMs > 70) {
                tickMs -= 6;
                clearInterval(tickTimer);
                tickTimer = setInterval(tick, tickMs);
            }
        } else {
            snake.pop();
            prevSnake.pop();
        }
        lastTick = performance.now();
    }

    function endGame() {
        gameover = true;
        clearInterval(tickTimer);
        spawnBurst(snake[0].x + box / 2, snake[0].y + box / 2, '#ef4444');
        beep(120, 0.3, 'sawtooth', 0.08);
    }

    function drawGrid() {
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= GRID; i++) {
            ctx.beginPath(); ctx.moveTo(i * box, 0); ctx.lineTo(i * box, SIZE); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i * box); ctx.lineTo(SIZE, i * box); ctx.stroke();
        }
    }

    function lerp(a, b, t) { return a + (b - a) * t; }

    function render(ts) {
        const alpha = gameover ? 1 : Math.min((ts - lastTick) / tickMs, 1);

        ctx.clearRect(0, 0, SIZE, SIZE);
        ctx.fillStyle = '#14181f';
        ctx.fillRect(0, 0, SIZE, SIZE);
        drawGrid();

        // Pomme avec pulsation + brillance
        foodPulse += 0.12;
        const pulse = 1 + Math.sin(foodPulse) * 0.08;
        ctx.fillStyle = '#ff3366';
        ctx.beginPath();
        ctx.arc(food.x + box / 2, food.y + box / 2, (box / 2.2) * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff99bb';
        ctx.beginPath();
        ctx.arc(food.x + box / 3, food.y + box / 3, box / 8, 0, Math.PI * 2);
        ctx.fill();

        // Serpent (positions interpolées entre l'ancienne et la nouvelle case)
        for (let i = 0; i < snake.length; i++) {
            const cur = snake[i];
            const prev = prevSnake[i] || cur;
            const x = lerp(prev.x, cur.x, alpha) + box / 2;
            const y = lerp(prev.y, cur.y, alpha) + box / 2;
            const radius = box / 2.15;

            if (i === 0) {
                ctx.fillStyle = '#3b82f6';
                ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#0b1220';
                let e1, e2;
                const d = box * 0.22;
                if (direction === 'RIGHT') { e1 = [x + d, y - d]; e2 = [x + d, y + d]; }
                else if (direction === 'LEFT') { e1 = [x - d, y - d]; e2 = [x - d, y + d]; }
                else if (direction === 'UP') { e1 = [x - d, y - d]; e2 = [x + d, y - d]; }
                else { e1 = [x - d, y + d]; e2 = [x + d, y + d]; }
                ctx.beginPath(); ctx.arc(e1[0], e1[1], box * 0.11, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(e2[0], e2[1], box * 0.11, 0, Math.PI * 2); ctx.fill();
            } else {
                const t = i / snake.length;
                const g = ctx.createRadialGradient(x, y, 1, x, y, radius);
                g.addColorStop(0, `rgba(96,165,250,${1 - t * 0.4})`);
                g.addColorStop(1, `rgba(37,99,235,${1 - t * 0.4})`);
                ctx.fillStyle = g;
                ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
            }
        }

        // Particules
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.life -= 1 / 60; p.x += p.vx / 60; p.y += p.vy / 60; p.vy += 200 / 60;
            if (p.life <= 0) { particles.splice(i, 1); continue; }
            ctx.globalAlpha = Math.max(p.life / 0.5, 0);
            ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;
        }

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.fillText('Score: ' + score, 10, 20);

        if (gameover) {
            ctx.fillStyle = 'rgba(0,0,0,0.75)';
            ctx.fillRect(0, 110, SIZE, 80);
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.font = 'bold 20px Inter, sans-serif';
            ctx.fillText('💀 Perdu !', SIZE / 2, 145);
            ctx.font = '14px Inter, sans-serif';
            ctx.fillText('Score : ' + score + ' — Rejoue !', SIZE / 2, 170);
            ctx.textAlign = 'left';
        }

        rafId = requestAnimationFrame(render);
    }

    function restart() {
        clearInterval(tickTimer);
        snake = [{ x: 10 * box, y: 10 * box }, { x: 9 * box, y: 10 * box }, { x: 8 * box, y: 10 * box }];
        prevSnake = snake.map(s => ({ ...s }));
        direction = 'RIGHT'; nextDirection = 'RIGHT';
        score = 0; gameover = false; tickMs = 130; particles = []; foodPulse = 0;
        food = randomFood();
        lastTick = performance.now();
        tickTimer = setInterval(tick, tickMs);
    }

    restart();
    rafId = requestAnimationFrame(render);

    return {
        stop() {
            clearInterval(tickTimer);
            if (rafId) cancelAnimationFrame(rafId);
            document.removeEventListener('keydown', keyHandler);
            if (audioCtx) { try { audioCtx.close(); } catch {} }
        }
    };
}
