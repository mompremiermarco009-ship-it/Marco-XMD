export default function initFlappy(container, controlsContainer) {
    container.innerHTML = `
        <canvas id="flappyCanvas" style="width:100%; max-width:380px; height:480px; display:block; margin:0 auto; border-radius:14px; touch-action:none;"></canvas>
        <div id="flappyScore" style="text-align:center; margin-top:10px; font-family:'JetBrains Mono',monospace; font-size:14px; color:var(--text-soft);">Score: 0 · Meilleur: 0</div>
    `;
    controlsContainer.innerHTML = `
        <button id="flappyFlyBtn" style="margin-top:12px; padding:18px; width:100%; border-radius:12px; background:linear-gradient(135deg, var(--primary), var(--primary-dark)); color:#fff; border:none; font-weight:800; font-size:1.1rem; cursor:pointer; user-select:none; box-shadow:0 6px 20px rgba(13,110,253,0.3);">
            🐦 APPUIE POUR VOLER
        </button>
        <button id="flappyRestart" style="margin-top:10px; padding:10px; width:100%; border-radius:10px; background:var(--surface-alt); color:var(--text); border:1px solid var(--border); font-weight:700; cursor:pointer;">🔄 Recommencer</button>
    `;

    const canvas = document.getElementById('flappyCanvas');
    const ctx = canvas.getContext('2d');
    const W = 380, H = 480;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * DPR; canvas.height = H * DPR;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    const GRAVITY = 0.55;
    const JUMP = -8.5;
    const PIPE_W = 60;
    const PIPE_GAP = 150;

    let bird, pipes, score, gameover, started, rafId, lastTime, frame;
    let best = parseInt(localStorage.getItem('flappy_best') || '0');

    function reset() {
        bird = { x: 90, y: H / 2, vy: 0, rot: 0, wingPhase: 0 };
        pipes = [];
        score = 0;
        gameover = false;
        started = false;
        frame = 0;
        updateScore();
    }

    function updateScore() {
        document.getElementById('flappyScore').textContent = `Score: ${score} · Meilleur: ${best}`;
    }

    function spawnPipe() {
        const minTop = 60;
        const maxTop = H - PIPE_GAP - 100;
        const top = minTop + Math.random() * (maxTop - minTop);
        pipes.push({ x: W, top, passed: false });
    }

    function flap() {
        if (gameover) return;
        if (!started) started = true;
        bird.vy = JUMP;
    }

    function update() {
        if (!started || gameover) return;

        frame++;
        bird.vy += GRAVITY;
        bird.y += bird.vy;
        bird.rot = Math.max(-0.5, Math.min(1.2, bird.vy * 0.06));
        bird.wingPhase += 0.4;

        // Collision sol / plafond
        if (bird.y < 0) { bird.y = 0; bird.vy = 0; }
        if (bird.y > H - 30) {
            gameover = true;
            if (score > best) { best = score; localStorage.setItem('flappy_best', best); updateScore(); }
            return;
        }

        // Pipes
        if (pipes.length === 0 || pipes[pipes.length - 1].x < W - 220) spawnPipe();

        for (let i = pipes.length - 1; i >= 0; i--) {
            const p = pipes[i];
            p.x -= 2.4;

            if (!p.passed && p.x + PIPE_W < bird.x) {
                p.passed = true;
                score++;
                updateScore();
            }

            // Collision
            const bx = bird.x, by = bird.y, br = 14;
            if (bx + br > p.x && bx - br < p.x + PIPE_W) {
                if (by - br < p.top || by + br > p.top + PIPE_GAP) {
                    gameover = true;
                    if (score > best) { best = score; localStorage.setItem('flappy_best', best); updateScore(); }
                    return;
                }
            }

            if (p.x + PIPE_W < -10) pipes.splice(i, 1);
        }
    }

    function drawBird() {
        const { x, y, rot, wingPhase } = bird;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);

        // Ombre
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(0, 18, 16, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Corps (jaune)
        ctx.fillStyle = '#ffd93d';
        ctx.beginPath();
        ctx.ellipse(0, 0, 16, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Contour corps
        ctx.strokeStyle = '#e6b800';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Aile (animation)
        const wingY = Math.sin(wingPhase) * 5;
        ctx.fillStyle = '#ff9f1c';
        ctx.beginPath();
        ctx.ellipse(-3, wingY, 9, 6, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Œil blanc
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(7, -4, 5, 0, Math.PI * 2);
        ctx.fill();

        // Pupille noire
        ctx.fillStyle = '#111827';
        ctx.beginPath();
        ctx.arc(8.5, -4, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Reflet œil
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(9.2, -4.8, 0.9, 0, Math.PI * 2);
        ctx.fill();

        // Bec (orange)
        ctx.fillStyle = '#ff9f1c';
        ctx.beginPath();
        ctx.moveTo(13, 0);
        ctx.lineTo(23, 2);
        ctx.lineTo(13, 6);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
    }

    function drawPipe(x, top) {
        // Corps du tuyau
        const grad = ctx.createLinearGradient(x, 0, x + PIPE_W, 0);
        grad.addColorStop(0, '#2ecc71');
        grad.addColorStop(0.5, '#27ae60');
        grad.addColorStop(1, '#1e8449');

        ctx.fillStyle = grad;
        ctx.fillRect(x, 0, PIPE_W, top);
        ctx.fillRect(x, top + PIPE_GAP, PIPE_W, H - (top + PIPE_GAP));

        // Chapeaux (haut et bas)
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(x - 4, top - 22, PIPE_W + 8, 22);
        ctx.fillRect(x - 4, top + PIPE_GAP, PIPE_W + 8, 22);

        // Bordures
        ctx.strokeStyle = '#1e8449';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, 0, PIPE_W, top);
        ctx.strokeRect(x, top + PIPE_GAP, PIPE_W, H - (top + PIPE_GAP));
        ctx.strokeRect(x - 4, top - 22, PIPE_W + 8, 22);
        ctx.strokeRect(x - 4, top + PIPE_GAP, PIPE_W + 8, 22);
    }

    function drawBackground() {
        // Ciel dégradé
        const sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#4dc9f6');
        sky.addColorStop(0.6, '#87ceeb');
        sky.addColorStop(1, '#c5e8ff');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, H);

        // Nuages (parallaxe)
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        const cloudOffset = (frame * 0.3) % (W + 100);
        for (let i = 0; i < 3; i++) {
            const cx = (i * 150 - cloudOffset + W) % (W + 200) - 50;
            const cy = 60 + i * 40;
            ctx.beginPath();
            ctx.ellipse(cx, cy, 30, 14, 0, 0, Math.PI * 2);
            ctx.ellipse(cx + 20, cy + 4, 22, 12, 0, 0, Math.PI * 2);
            ctx.ellipse(cx - 20, cy + 4, 18, 10, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Sol
        ctx.fillStyle = '#8B5A2B';
        ctx.fillRect(0, H - 30, W, 30);
        ctx.fillStyle = '#6f4520';
        ctx.fillRect(0, H - 30, W, 3);
    }

    function draw() {
        drawBackground();
        pipes.forEach(p => drawPipe(p.x, p.top));
        drawBird();

        if (!started && !gameover) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(0, H / 2 - 60, W, 120);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 20px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('🐦 Flappy Bird', W / 2, H / 2 - 20);
            ctx.font = '14px Inter, sans-serif';
            ctx.fillStyle = '#e2e8f0';
            ctx.fillText('Appuie pour voler', W / 2, H / 2 + 10);
            ctx.font = '12px Inter, sans-serif';
            ctx.fillStyle = '#94a3b8';
            ctx.fillText('Évite les tuyaux verts', W / 2, H / 2 + 32);
            ctx.textAlign = 'left';
        }

        if (gameover) {
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(0, H / 2 - 70, W, 140);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 26px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('💥 Game Over', W / 2, H / 2 - 20);
            ctx.font = '15px Inter, sans-serif';
            ctx.fillStyle = '#e2e8f0';
            ctx.fillText(`Score: ${score}`, W / 2, H / 2 + 12);
            ctx.fillStyle = '#94a3b8';
            ctx.font = '13px Inter, sans-serif';
            ctx.fillText(`Meilleur: ${best}`, W / 2, H / 2 + 36);
            ctx.textAlign = 'left';
        }
    }

    function loop(ts) {
        if (!lastTime) lastTime = ts;
        lastTime = ts;
        update();
        draw();
        rafId = requestAnimationFrame(loop);
    }

    // Contrôles
    const flyBtn = document.getElementById('flappyFlyBtn');
    flyBtn.addEventListener('click', flap);
    flyBtn.addEventListener('touchstart', (e) => { e.preventDefault(); flap(); }, { passive: false });

    canvas.addEventListener('click', flap);
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); flap(); }, { passive: false });

    document.getElementById('flappyRestart').addEventListener('click', reset);

    function onKey(e) {
        if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); flap(); }
    }
    document.addEventListener('keydown', onKey);

    reset();
    rafId = requestAnimationFrame(loop);

    return {
        stop() {
            cancelAnimationFrame(rafId);
            document.removeEventListener('keydown', onKey);
        }
    };
}
