export default function initPong(container, controlsContainer) {
    container.innerHTML = `
        <div style="display:flex; justify-content:space-around; max-width:400px; margin:0 auto 10px; font-family:'JetBrains Mono',monospace;">
            <div style="text-align:center;">
                <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase;">Joueur</div>
                <div id="pongScoreP1" style="font-size:1.5rem; font-weight:800; color:var(--primary);">0</div>
            </div>
            <div style="text-align:center;">
                <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase;" id="pongModeLabel">IA</div>
                <div id="pongScoreP2" style="font-size:1.5rem; font-weight:800; color:var(--danger);">0</div>
            </div>
        </div>
        <canvas id="pongCanvas" style="width:100%; max-width:400px; height:280px; display:block; margin:0 auto; border-radius:12px; touch-action:none;"></canvas>
    `;
    controlsContainer.innerHTML = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:14px; max-width:400px; margin-left:auto; margin-right:auto;">
            <div style="text-align:center;">
                <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:6px; font-weight:600;">JOUEUR 1</div>
                <button id="pongP1Up" style="width:100%; padding:14px; margin-bottom:6px; background:var(--primary); color:#fff; border:none; border-radius:10px; font-size:1.2rem; cursor:pointer;">▲</button>
                <button id="pongP1Down" style="width:100%; padding:14px; background:var(--primary); color:#fff; border:none; border-radius:10px; font-size:1.2rem; cursor:pointer;">▼</button>
            </div>
            <div style="text-align:center;">
                <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:6px; font-weight:600;" id="pongP2Label">IA</div>
                <button id="pongP2Up" style="width:100%; padding:14px; margin-bottom:6px; background:var(--danger); color:#fff; border:none; border-radius:10px; font-size:1.2rem; cursor:pointer;">▲</button>
                <button id="pongP2Down" style="width:100%; padding:14px; background:var(--danger); color:#fff; border:none; border-radius:10px; font-size:1.2rem; cursor:pointer;">▼</button>
            </div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:10px; max-width:400px; margin-left:auto; margin-right:auto;">
            <button id="pongMode" style="padding:10px; border-radius:10px; background:var(--warning); color:#fff; border:none; font-weight:700; cursor:pointer;">🤖 vs IA</button>
            <button id="pongRestart" style="padding:10px; border-radius:10px; background:var(--surface-alt); color:var(--text); border:1px solid var(--border); font-weight:700; cursor:pointer;">🔄 Restart</button>
        </div>
    `;

    const canvas = document.getElementById('pongCanvas');
    const ctx = canvas.getContext('2d');
    const W = 400, H = 280;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * DPR; canvas.height = H * DPR;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    let ball, p1, p2, keys, rafId, mode = 'ai', lastTime;

    function reset() {
        ball = { x: W / 2, y: H / 2, vx: (Math.random() > 0.5 ? 1 : -1) * 4, vy: (Math.random() - 0.5) * 4, size: 8 };
        p1 = { x: 15, y: H / 2 - 35, w: 8, h: 70, score: 0 };
        p2 = { x: W - 23, y: H / 2 - 35, w: 8, h: 70, score: 0 };
        keys = { p1Up: false, p1Down: false, p2Up: false, p2Down: false };
        updateScore();
    }

    function updateScore() {
        document.getElementById('pongScoreP1').textContent = p1.score;
        document.getElementById('pongScoreP2').textContent = p2.score;
    }

    function update(dt) {
        // Vitesse adaptée au framerate (dt en secondes * 60 = facteur)
        const speed = 5 * (dt * 60);

        // P1
        if (keys.p1Up) p1.y = Math.max(0, p1.y - speed);
        if (keys.p1Down) p1.y = Math.min(H - p1.h, p1.y + speed);

        // P2 (IA ou joueur)
        if (mode === 'ai') {
            const target = ball.y + (ball.vy > 0 ? 20 : -20);
            p2.y += (target - (p2.y + p2.h / 2)) * 0.12 * (dt * 60);
            p2.y = Math.max(0, Math.min(H - p2.h, p2.y));
        } else {
            if (keys.p2Up) p2.y = Math.max(0, p2.y - speed);
            if (keys.p2Down) p2.y = Math.min(H - p2.h, p2.y + speed);
        }

        // Ball
        ball.x += ball.vx * (dt * 60);
        ball.y += ball.vy * (dt * 60);

        // Rebond haut/bas
        if (ball.y <= 0 || ball.y + ball.size >= H) ball.vy *= -1;

        // Collision P1
        if (ball.x <= p1.x + p1.w && ball.y + ball.size >= p1.y && ball.y <= p1.y + p1.h && ball.vx < 0) {
            ball.vx = Math.abs(ball.vx) * 1.05;
            ball.x = p1.x + p1.w + 1;
        }
        // Collision P2
        if (ball.x + ball.size >= p2.x && ball.y + ball.size >= p2.y && ball.y <= p2.y + p2.h && ball.vx > 0) {
            ball.vx = -Math.abs(ball.vx) * 1.05;
            ball.x = p2.x - ball.size - 1;
        }

        // Points
        if (ball.x < -ball.size) {
            p2.score++;
            updateScore();
            resetBall(1);
        }
        if (ball.x > W) {
            p1.score++;
            updateScore();
            resetBall(-1);
        }

        // Vitesse max
        ball.vx = Math.max(-12, Math.min(12, ball.vx));
        ball.vy = Math.max(-9, Math.min(9, ball.vy));
    }

    function resetBall(dir) {
        ball = { x: W / 2, y: H / 2, vx: dir * 4, vy: (Math.random() - 0.5) * 4, size: 8 };
    }

    function draw() {
        // Fond
        ctx.fillStyle = '#0a0e1a';
        ctx.fillRect(0, 0, W, H);

        // Ligne médiane
        ctx.setLineDash([8, 8]);
        ctx.strokeStyle = 'rgba(0,170,255,0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(W / 2, 0);
        ctx.lineTo(W / 2, H);
        ctx.stroke();
        ctx.setLineDash([]);

        // P1 (bleu)
        ctx.fillStyle = 'var(--primary)';
        ctx.shadowColor = '#0d6efd';
        ctx.shadowBlur = 10;
        ctx.fillRect(p1.x, p1.y, p1.w, p1.h);

        // P2 (rouge ou magenta)
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 10;
        ctx.fillRect(p2.x, p2.y, p2.w, p2.h);

        // Ball
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(ball.x + ball.size / 2, ball.y + ball.size / 2, ball.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    function loop(ts) {
        if (!lastTime) lastTime = ts;
        const dt = Math.min((ts - lastTime) / 1000, 1 / 30);
        lastTime = ts;
        update(dt);
        draw();
        rafId = requestAnimationFrame(loop);
    }

    function bindButton(id, key) {
        const btn = document.getElementById(id);
        const start = (e) => { e.preventDefault(); keys[key] = true; };
        const stop = (e) => { e.preventDefault(); keys[key] = false; };
        btn.addEventListener('mousedown', start);
        btn.addEventListener('mouseup', stop);
        btn.addEventListener('mouseleave', stop);
        btn.addEventListener('touchstart', start, { passive: false });
        btn.addEventListener('touchend', stop, { passive: false });
    }

    bindButton('pongP1Up', 'p1Up');
    bindButton('pongP1Down', 'p1Down');
    bindButton('pongP2Up', 'p2Up');
    bindButton('pongP2Down', 'p2Down');

    document.getElementById('pongRestart').addEventListener('click', reset);
    document.getElementById('pongMode').addEventListener('click', () => {
        mode = mode === 'ai' ? 'duo' : 'ai';
        document.getElementById('pongMode').textContent = mode === 'ai' ? '🤖 vs IA' : '👥 2 Joueurs';
        document.getElementById('pongMode').style.background = mode === 'ai' ? 'var(--warning)' : 'var(--success)';
        document.getElementById('pongP2Label').textContent = mode === 'ai' ? 'IA' : 'JOUEUR 2';
        document.getElementById('pongModeLabel').textContent = mode === 'ai' ? 'IA' : 'Joueur 2';
        reset();
    });

    function onKey(e) {
        if (e.key === 'w' || e.key === 'W') keys.p1Up = true;
        if (e.key === 's' || e.key === 'S') keys.p1Down = true;
        if (e.key === 'ArrowUp') { e.preventDefault(); keys.p2Up = true; }
        if (e.key === 'ArrowDown') { e.preventDefault(); keys.p2Down = true; }
    }
    function onKeyUp(e) {
        if (e.key === 'w' || e.key === 'W') keys.p1Up = false;
        if (e.key === 's' || e.key === 'S') keys.p1Down = false;
        if (e.key === 'ArrowUp') keys.p2Up = false;
        if (e.key === 'ArrowDown') keys.p2Down = false;
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('keyup', onKeyUp);

    reset();
    rafId = requestAnimationFrame(loop);

    return {
        stop() {
            cancelAnimationFrame(rafId);
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('keyup', onKeyUp);
        }
    };
}
