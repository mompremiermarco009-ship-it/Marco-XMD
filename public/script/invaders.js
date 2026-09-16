export default function initInvaders(container, controlsContainer) {
    container.innerHTML = `
        <canvas id="invCanvas" style="width:100%; max-width:400px; height:400px; display:block; margin:0 auto; border-radius:14px; touch-action:none; background:#05070f;"></canvas>
        <div style="display:flex; justify-content:space-around; max-width:400px; margin:10px auto 0; font-family:'JetBrains Mono',monospace; font-size:13px; color:var(--text-soft);">
            <span>🏆 Score: <span id="invScore" style="color:var(--primary); font-weight:700;">0</span></span>
            <span>❤️ Vie: <span id="invLives" style="color:var(--danger); font-weight:700;">3</span></span>
            <span>🌊 Vague: <span id="invWave" style="color:var(--warning); font-weight:700;">1</span></span>
        </div>
    `;
    controlsContainer.innerHTML = `
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-top:12px; max-width:400px; margin-left:auto; margin-right:auto;">
            <button id="invLeft" style="padding:16px; background:var(--primary); color:#fff; border:none; border-radius:12px; font-size:1.3rem; font-weight:700; cursor:pointer; user-select:none;">◀</button>
            <button id="invFire" style="padding:16px; background:var(--danger); color:#fff; border:none; border-radius:12px; font-size:1.3rem; font-weight:700; cursor:pointer; user-select:none;">🔥</button>
            <button id="invRight" style="padding:16px; background:var(--primary); color:#fff; border:none; border-radius:12px; font-size:1.3rem; font-weight:700; cursor:pointer; user-select:none;">▶</button>
        </div>
        <button id="invRestart" style="margin-top:10px; padding:10px; width:100%; border-radius:10px; background:var(--surface-alt); color:var(--text); border:1px solid var(--border); font-weight:700; cursor:pointer;">🔄 Recommencer</button>
    `;

    const canvas = document.getElementById('invCanvas');
    const ctx = canvas.getContext('2d');
    const W = 400, H = 400;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * DPR; canvas.height = H * DPR;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    let player, bullets, enemies, enemyBullets, particles, stars;
    let score, lives, wave, rafId, lastTime, keys, audioCtx, fireCooldown, waveTimer;
    const ENEMY_COLS = 7, ENEMY_ROWS = 4;

    function beep(freq, dur, type = 'square', gain = 0.04) {
        try {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            osc.type = type;
            osc.frequency.value = freq;
            g.gain.value = gain;
            osc.connect(g); g.connect(audioCtx.destination);
            osc.start();
            g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
            osc.stop(audioCtx.currentTime + dur);
        } catch {}
    }

    function spawnWave() {
        enemies = [];
        const startY = 40 + wave * 10;
        for (let r = 0; r < ENEMY_ROWS; r++) {
            for (let c = 0; c < ENEMY_COLS; c++) {
                enemies.push({
                    x: 40 + c * 45,
                    y: startY + r * 30,
                    w: 28, h: 22,
                    alive: true,
                    type: r === 0 ? 'boss' : r === 1 ? 'mid' : 'small',
                    hp: r === 0 ? 2 : 1,
                    phase: Math.random() * Math.PI * 2
                });
            }
        }
        document.getElementById('invWave').textContent = wave;
    }

    function reset() {
        player = { x: W / 2 - 18, y: H - 40, w: 36, h: 20, speed: 280 };
        bullets = [];
        enemyBullets = [];
        particles = [];
        stars = Array.from({ length: 60 }, () => ({
            x: Math.random() * W,
            y: Math.random() * H,
            s: Math.random() * 2 + 0.5,
            speed: 20 + Math.random() * 40
        }));
        score = 0;
        lives = 3;
        wave = 1;
        keys = { left: false, right: false };
        fireCooldown = 0;
        spawnWave();
        updateUI();
    }

    function updateUI() {
        document.getElementById('invScore').textContent = score;
        document.getElementById('invLives').textContent = lives;
    }

    function fire() {
        if (fireCooldown > 0) return;
        bullets.push({ x: player.x + player.w / 2 - 2, y: player.y - 4, w: 4, h: 12, vy: -600 });
        beep(800, 0.05, 'square', 0.03);
        fireCooldown = 0.2;
    }

    function spawnParticles(x, y, color, n = 10) {
        for (let i = 0; i < n; i++) {
            const a = Math.random() * Math.PI * 2;
            const sp = 50 + Math.random() * 150;
            particles.push({
                x, y,
                vx: Math.cos(a) * sp,
                vy: Math.sin(a) * sp,
                life: 0.5 + Math.random() * 0.3,
                maxLife: 0.8,
                color,
                size: 2 + Math.random() * 2
            });
        }
    }

    function update(dt) {
        // Fire cooldown
        if (fireCooldown > 0) fireCooldown -= dt;

        // Player
        const move = (keys.left ? -1 : 0) + (keys.right ? 1 : 0);
        player.x += move * player.speed * dt;
        player.x = Math.max(0, Math.min(W - player.w, player.x));

        // Bullets
        for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];
            b.y += b.vy * dt;
            if (b.y + b.h < 0) bullets.splice(i, 1);
        }

        // Enemy bullets
        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            const b = enemyBullets[i];
            b.y += b.vy * dt;
            if (b.y > H) { enemyBullets.splice(i, 1); continue; }
            // Collision joueur
            if (b.x > player.x && b.x < player.x + player.w && b.y > player.y && b.y < player.y + player.h) {
                enemyBullets.splice(i, 1);
                lives--;
                spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#ff4757', 20);
                beep(150, 0.3, 'sawtooth', 0.08);
                updateUI();
                if (lives <= 0) { beep(80, 0.5, 'sawtooth', 0.1); }
            }
        }

        // Enemies
        const alive = enemies.filter(e => e.alive);
        if (alive.length === 0) {
            wave++;
            setTimeout(() => spawnWave(), 500);
            return;
        }

        const minX = Math.min(...alive.map(e => e.x));
        const maxX = Math.max(...alive.map(e => e.x + e.w));
        const speed = (50 + wave * 15) * (1 + (1 - alive.length / (ENEMY_COLS * ENEMY_ROWS)) * 0.8);

        let dirChange = false;
        alive.forEach(e => {
            e.x += speed * dt * (window._invDir || 1);
            e.phase += dt * 4;
        });
        if (maxX > W - 20 && !window._invDir) { window._invDir = 1; alive.forEach(e => e.y += 20); }
        else if (minX < 20 && window._invDir) { window._invDir = -1; alive.forEach(e => e.y += 20); }
        if (window._invDir === undefined) window._invDir = 1;

        // Enemy shots
        alive.forEach(e => {
            if (Math.random() < 0.0008 * (1 + wave * 0.3)) {
                enemyBullets.push({ x: e.x + e.w / 2, y: e.y + e.h, vy: 200 + wave * 30 });
            }
        });

        // Bullet-enemy collision
        for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];
            for (const e of enemies) {
                if (!e.alive) continue;
                if (b.x > e.x && b.x < e.x + e.w && b.y > e.y && b.y < e.y + e.h) {
                    bullets.splice(i, 1);
                    e.hp--;
                    if (e.hp <= 0) {
                        e.alive = false;
                        const pts = e.type === 'boss' ? 30 : e.type === 'mid' ? 20 : 10;
                        score += pts;
                        spawnParticles(e.x + e.w / 2, e.y + e.h / 2, e.type === 'boss' ? '#ff8800' : '#00d4ff', 15);
                        beep(500 + Math.random() * 400, 0.08, 'square', 0.04);
                        updateUI();
                    } else {
                        spawnParticles(e.x + e.w / 2, e.y + e.h / 2, '#fff', 6);
                    }
                    break;
                }
            }
        }

        // Enemies reach bottom
        if (alive.some(e => e.y + e.h >= player.y)) {
            lives = 0;
            updateUI();
        }

        // Particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.life -= dt;
            if (p.life <= 0) { particles.splice(i, 1); continue; }
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 200 * dt;
        }

        // Stars
        stars.forEach(s => {
            s.y += s.speed * dt;
            if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
        });
    }

    function drawPlayer() {
        const { x, y, w, h } = player;
        // Canon
        ctx.fillStyle = '#00d4ff';
        ctx.shadowColor = '#00d4ff';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y - 4);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x, y + h);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        // Cockpit
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawEnemy(e) {
        const bob = Math.sin(e.phase) * 2;
        const colors = { boss: '#ff8800', mid: '#ff00ff', small: '#00ff88' };
        const col = colors[e.type];

        ctx.fillStyle = col;
        ctx.shadowColor = col;
        ctx.shadowBlur = 10;

        if (e.type === 'boss') {
            ctx.beginPath();
            ctx.moveTo(e.x + e.w / 2, e.y + bob);
            ctx.lineTo(e.x + e.w, e.y + e.h / 2 + bob);
            ctx.lineTo(e.x + e.w * 0.75, e.y + e.h + bob);
            ctx.lineTo(e.x + e.w * 0.25, e.y + e.h + bob);
            ctx.lineTo(e.x, e.y + e.h / 2 + bob);
            ctx.closePath();
            ctx.fill();
        } else if (e.type === 'mid') {
            ctx.fillRect(e.x, e.y + bob, e.w, e.h);
            ctx.fillStyle = '#000';
            ctx.fillRect(e.x + 6, e.y + 6 + bob, 4, 4);
            ctx.fillRect(e.x + e.w - 10, e.y + 6 + bob, 4, 4);
        } else {
            ctx.beginPath();
            ctx.arc(e.x + e.w / 2, e.y + e.h / 2 + bob, e.w / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(e.x + e.w / 2 - 5, e.y + e.h / 2 + bob, 2, 0, Math.PI * 2);
            ctx.arc(e.x + e.w / 2 + 5, e.y + e.h / 2 + bob, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;
    }

    function draw() {
        ctx.fillStyle = '#05070f';
        ctx.fillRect(0, 0, W, H);

        // Stars
        stars.forEach(s => {
            ctx.fillStyle = `rgba(255,255,255,${s.s / 3})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.s / 2, 0, Math.PI * 2);
            ctx.fill();
        });

        // Enemies
        enemies.forEach(e => { if (e.alive) drawEnemy(e); });

        // Bullets
        ctx.fillStyle = '#00ffaa';
        ctx.shadowColor = '#00ffaa';
        ctx.shadowBlur = 10;
        bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));

        // Enemy bullets
        ctx.fillStyle = '#ff4757';
        ctx.shadowColor = '#ff4757';
        enemyBullets.forEach(b => ctx.fillRect(b.x - 2, b.y, 4, 10));

        ctx.shadowBlur = 0;

        // Player
        drawPlayer();

        // Particles
        particles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // Game Over
        if (lives <= 0) {
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(0, H / 2 - 60, W, 120);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 26px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('💀 Game Over', W / 2, H / 2 - 10);
            ctx.font = '14px Inter, sans-serif';
            ctx.fillStyle = '#e2e8f0';
            ctx.fillText(`Score: ${score} · Vague: ${wave}`, W / 2, H / 2 + 25);
            ctx.textAlign = 'left';
        }
    }

    function loop(ts) {
        if (!lastTime) lastTime = ts;
        const dt = Math.min((ts - lastTime) / 1000, 1 / 30);
        lastTime = ts;
        if (lives > 0) update(dt);
        draw();
        rafId = requestAnimationFrame(loop);
    }

    function bindHold(id, key) {
        const btn = document.getElementById(id);
        const start = (e) => { e.preventDefault(); keys[key] = true; };
        const stop = (e) => { e.preventDefault(); keys[key] = false; };
        btn.addEventListener('mousedown', start);
        btn.addEventListener('mouseup', stop);
        btn.addEventListener('mouseleave', stop);
        btn.addEventListener('touchstart', start, { passive: false });
        btn.addEventListener('touchend', stop, { passive: false });
    }

    bindHold('invLeft', 'left');
    bindHold('invRight', 'right');
    document.getElementById('invFire').addEventListener('click', fire);
    document.getElementById('invFire').addEventListener('touchstart', (e) => { e.preventDefault(); fire(); }, { passive: false });
    document.getElementById('invRestart').addEventListener('click', reset);

    function onKey(e) {
        if (e.key === 'ArrowLeft') { e.preventDefault(); keys.left = true; }
        if (e.key === 'ArrowRight') { e.preventDefault(); keys.right = true; }
        if (e.key === ' ') { e.preventDefault(); fire(); }
    }
    function onKeyUp(e) {
        if (e.key === 'ArrowLeft') keys.left = false;
        if (e.key === 'ArrowRight') keys.right = false;
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('keyup', onKeyUp);

    reset();
    rafId = requestAnimationFrame(loop);

    return {
        stop() { cancelAnimationFrame(rafId); document.removeEventListener('keydown', onKey); document.removeEventListener('keyup', onKeyUp); }
    };
}
