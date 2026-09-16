export default function initRunner(container, controlsContainer) {
    container.innerHTML = `
        <canvas id="runnerCanvas" style="width:100%; max-width:400px; height:220px; display:block; margin:0 auto; border-radius:12px; touch-action:none;"></canvas>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px; font-family:'JetBrains Mono',monospace; font-size:13px; color:var(--text-soft);">
            <span id="runnerScore">🏁 0 · 🪙 0</span>
            <span id="runnerSoundToggle" style="cursor:pointer;">🔊</span>
        </div>
    `;
    controlsContainer.innerHTML = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:12px;">
            <button id="runnerJump" style="padding:16px; background:var(--primary); color:#fff; border:none; border-radius:12px; font-weight:800; font-size:1rem; cursor:pointer; user-select:none;">⬆️ SAUTER</button>
            <button id="runnerSlide" style="padding:16px; background:var(--warning); color:#fff; border:none; border-radius:12px; font-weight:800; font-size:1rem; cursor:pointer; user-select:none;">⬇️ GLISSER</button>
        </div>
        <button id="runnerRestart" style="margin-top:10px; padding:10px; width:100%; border-radius:10px; background:var(--surface-alt); color:var(--text); border:1px solid var(--border); font-weight:700; cursor:pointer;">🔄 Recommencer</button>
    `;

    const canvas = document.getElementById('runnerCanvas');
    const ctx = canvas.getContext('2d');
    const W = 400, H = 220;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * DPR; canvas.height = H * DPR;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    const GROUND = H - 40;
    const GRAVITY = 1800;
    const JUMP_V = -620;

    let player, obstacles, coins, clouds, hills, distance, speed, score, coinsCollected, gameover;
    let rafId, lastTime, canDoubleJump, soundEnabled = true, audioCtx;
    let nextObstacle = 500, coinTimer = 300;

    function beep(freq, dur, type = 'sine', gain = 0.05) {
        if (!soundEnabled) return;
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

    function reset() {
        player = { x: 60, y: GROUND - 42, w: 28, h: 42, vy: 0, jumping: false, sliding: false, runPhase: 0, jumps: 0 };
        obstacles = [];
        coins = [];
        clouds = Array.from({ length: 4 }, () => ({ x: Math.random() * W, y: 20 + Math.random() * 50, s: 0.5 + Math.random() * 0.7 }));
        hills = Array.from({ length: 5 }, (_, i) => ({ x: i * 100, s: 0.6 + i * 0.05 }));
        distance = 0; speed = 220; score = 0; coinsCollected = 0; gameover = false;
        canDoubleJump = true;
        nextObstacle = 500;
        coinTimer = 300;
        updateScore();
    }

    function updateScore() {
        document.getElementById('runnerScore').textContent = `🏁 ${Math.floor(distance / 10)} · 🪙 ${coinsCollected}`;
    }

    function spawnObstacle() {
        const types = ['rock', 'spike', 'bird'];
        const type = types[Math.floor(Math.random() * types.length)];
        if (type === 'bird') {
            obstacles.push({ x: W + 20, y: GROUND - 70 - Math.random() * 30, w: 30, h: 20, type, wing: 0 });
        } else if (type === 'rock') {
            obstacles.push({ x: W + 20, y: GROUND - 28, w: 26, h: 28, type });
        } else {
            obstacles.push({ x: W + 20, y: GROUND - 32, w: 16, h: 32, type });
        }
    }

    function spawnCoin() {
        coins.push({ x: W + 20, y: GROUND - 60 - Math.random() * 60, size: 12, phase: 0 });
    }

    function jump() {
        if (gameover) return;
        if (!player.jumping) {
            player.vy = JUMP_V;
            player.jumping = true;
            player.jumps = 1;
            canDoubleJump = true;
            beep(700, 0.1, 'triangle', 0.04);
        } else if (canDoubleJump && player.jumps === 1) {
            player.vy = JUMP_V * 0.85;
            player.jumps = 2;
            canDoubleJump = false;
            beep(900, 0.1, 'triangle', 0.04);
        }
    }

    function slideStart() { if (!gameover && !player.jumping) player.sliding = true; }
    function slideEnd() { player.sliding = false; }

    function update(dt) {
        if (gameover) return;

        distance += speed * dt;
        speed = Math.min(220 + distance * 0.02, 480);

        // Physique joueur
        if (player.jumping) {
            player.vy += GRAVITY * dt;
            player.y += player.vy * dt;
            if (player.y >= GROUND - 42) {
                player.y = GROUND - 42;
                player.vy = 0;
                player.jumping = false;
                player.jumps = 0;
                canDoubleJump = true;
                beep(400, 0.06, 'triangle', 0.03);
            }
        }

        if (player.sliding && !player.jumping) {
            player.h = 22;
            player.y = GROUND - 22;
        } else if (!player.jumping) {
            player.h = 42;
            player.y = GROUND - 42;
        }

        player.runPhase += speed * dt * 0.05;

        // Parallaxe
        clouds.forEach(c => { c.x -= speed * 0.1 * c.s * dt; if (c.x < -60) c.x = W + 60; });
        hills.forEach(h => { h.x -= speed * 0.3 * h.s * dt; if (h.x < -100) h.x += 500; });

        // Obstacles
        nextObstacle -= speed * dt;
        if (nextObstacle <= 0) {
            spawnObstacle();
            nextObstacle = 300 + Math.random() * 200 - Math.min(speed - 220, 100);
        }

        for (let i = obstacles.length - 1; i >= 0; i--) {
            const o = obstacles[i];
            o.x -= speed * dt;
            if (o.type === 'bird') o.wing += dt * 12;
            if (o.x + o.w < 0) { obstacles.splice(i, 1); score++; updateScore(); }

            // Collision
            const m = 4;
            if (player.x + m < o.x + o.w && player.x + player.w - m > o.x &&
                player.y + m < o.y + o.h && player.y + player.h - m > o.y) {
                gameover = true;
                beep(100, 0.4, 'sawtooth', 0.1);
                return;
            }
        }

        // Coins
        coinTimer -= speed * dt;
        if (coinTimer <= 0) {
            spawnCoin();
            coinTimer = 250 + Math.random() * 200;
        }
        for (let i = coins.length - 1; i >= 0; i--) {
            const c = coins[i];
            c.x -= speed * dt;
            c.phase += dt * 6;
            if (c.x + c.size < 0) { coins.splice(i, 1); continue; }

            const cx = c.x + c.size / 2, cy = c.y + c.size / 2 + Math.sin(c.phase) * 4;
            const pcx = player.x + player.w / 2, pcy = player.y + player.h / 2;
            if (Math.hypot(cx - pcx, cy - pcy) < player.w / 2 + c.size / 2) {
                coins.splice(i, 1);
                coinsCollected++;
                score += 5;
                beep(1300, 0.1, 'sine', 0.05);
                updateScore();
            }
        }
    }

    function drawBackground() {
        // Ciel dégradé
        const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
        sky.addColorStop(0, '#87ceeb');
        sky.addColorStop(0.7, '#c9e7f7');
        sky.addColorStop(1, '#e6f3ff');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, GROUND);

        // Soleil
        ctx.fillStyle = 'rgba(255,230,150,0.7)';
        ctx.beginPath();
        ctx.arc(W - 70, 45, 30, 0, Math.PI * 2);
        ctx.fill();

        // Collines
        ctx.fillStyle = '#a7d8b0';
        hills.forEach(h => {
            ctx.beginPath();
            ctx.ellipse(h.x, GROUND, 80 * h.s, 30 * h.s, 0, Math.PI, 2 * Math.PI);
            ctx.fill();
        });

        // Nuages
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        clouds.forEach(c => {
            ctx.beginPath();
            ctx.ellipse(c.x, c.y, 20 * c.s, 10 * c.s, 0, 0, Math.PI * 2);
            ctx.ellipse(c.x + 15 * c.s, c.y + 4, 14 * c.s, 9 * c.s, 0, 0, Math.PI * 2);
            ctx.ellipse(c.x - 14 * c.s, c.y + 4, 12 * c.s, 8 * c.s, 0, 0, Math.PI * 2);
            ctx.fill();
        });

        // Sol
        ctx.fillStyle = '#8B5A2B';
        ctx.fillRect(0, GROUND, W, H - GROUND);
        ctx.fillStyle = '#6f4520';
        ctx.fillRect(0, GROUND, W, 3);

        // Lignes du sol
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        const offset = (distance * 0.5) % 40;
        for (let x = -offset; x < W; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, GROUND + 15);
            ctx.lineTo(x + 20, GROUND + 15);
            ctx.stroke();
        }
    }

    function drawPlayer() {
        const px = player.x, py = player.y, pw = player.w, ph = player.h;
        const cx = px + pw / 2;

        // Ombre
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(cx, GROUND + 2, pw * 0.6, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        if (player.sliding && !player.jumping) {
            // Position glissée
            ctx.fillStyle = '#0d6efd';
            ctx.beginPath();
            ctx.roundRect(px - 6, py + ph - 20, pw + 12, 20, 8);
            ctx.fill();
            // Tête
            ctx.fillStyle = '#fcd9a8';
            ctx.beginPath();
            ctx.arc(px + pw + 4, py + ph - 10, 8, 0, Math.PI * 2);
            ctx.fill();
            // Casquette
            ctx.fillStyle = '#ff4757';
            ctx.fillRect(px + pw - 3, py + ph - 18, 15, 6);
        } else {
            const legSwing = player.jumping ? 0 : Math.sin(player.runPhase) * 10;

            // Jambes
            ctx.strokeStyle = '#1e40af';
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(cx - 4, py + ph - 15);
            ctx.lineTo(cx - 4 + legSwing, py + ph);
            ctx.moveTo(cx + 4, py + ph - 15);
            ctx.lineTo(cx + 4 - legSwing, py + ph);
            ctx.stroke();

            // Corps (bleu)
            ctx.fillStyle = '#0d6efd';
            ctx.beginPath();
            ctx.roundRect(px + 3, py + 12, pw - 6, ph - 22, 6);
            ctx.fill();

            // Bras
            const armSwing = -legSwing * 0.7;
            ctx.strokeStyle = '#0a4db3';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(cx, py + 18);
            ctx.lineTo(cx - armSwing * 0.8, py + 30);
            ctx.stroke();

            // Tête
            ctx.fillStyle = '#fcd9a8';
            ctx.beginPath();
            ctx.arc(cx, py + 10, 10, 0, Math.PI * 2);
            ctx.fill();

            // Œil
            ctx.fillStyle = '#111827';
            ctx.beginPath();
            ctx.arc(cx + 3, py + 9, 1.8, 0, Math.PI * 2);
            ctx.fill();

            // Casquette
            ctx.fillStyle = '#ff4757';
            ctx.beginPath();
            ctx.ellipse(cx, py + 2, 11, 6, 0, Math.PI, 2 * Math.PI);
            ctx.fill();
            ctx.fillRect(cx - 3, py - 2, 6, 4);
        }
    }

    function drawObstacles() {
        obstacles.forEach(o => {
            if (o.type === 'rock') {
                ctx.fillStyle = '#6b7280';
                ctx.beginPath();
                ctx.moveTo(o.x, o.y + o.h);
                ctx.lineTo(o.x + 4, o.y + 6);
                ctx.lineTo(o.x + o.w * 0.5, o.y);
                ctx.lineTo(o.x + o.w - 4, o.y + 6);
                ctx.lineTo(o.x + o.w, o.y + o.h);
                ctx.closePath();
                ctx.fill();
            } else if (o.type === 'spike') {
                ctx.fillStyle = '#374151';
                ctx.beginPath();
                ctx.moveTo(o.x, o.y + o.h);
                ctx.lineTo(o.x + o.w / 2, o.y);
                ctx.lineTo(o.x + o.w, o.y + o.h);
                ctx.closePath();
                ctx.fill();
            } else if (o.type === 'bird') {
                const flap = Math.sin(o.wing) * 8;
                ctx.fillStyle = '#1f2937';
                ctx.beginPath();
                ctx.moveTo(o.x, o.y + 8);
                ctx.quadraticCurveTo(o.x + o.w / 2, o.y + 8 - flap, o.x + o.w, o.y + 8);
                ctx.quadraticCurveTo(o.x + o.w / 2, o.y + 8 + flap * 0.5, o.x, o.y + 8);
                ctx.fill();
                ctx.fillStyle = '#111827';
                ctx.beginPath();
                ctx.arc(o.x + o.w - 4, o.y + 6, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    function drawCoins() {
        coins.forEach(c => {
            const bob = Math.sin(c.phase) * 4;
            ctx.save();
            ctx.translate(c.x + c.size / 2, c.y + c.size / 2 + bob);
            const scaleX = 0.7 + Math.abs(Math.sin(c.phase * 0.7)) * 0.3;
            ctx.scale(scaleX, 1);
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(0, 0, c.size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffa500';
            ctx.beginPath();
            ctx.arc(0, 0, c.size / 2 - 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 9px Inter';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('$', 0, 0);
            ctx.restore();
        });
    }

    function draw() {
        drawBackground();
        drawCoins();
        drawObstacles();
        drawPlayer();

        if (gameover) {
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(0, H / 2 - 50, W, 100);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 22px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('💥 Game Over', W / 2, H / 2 - 5);
            ctx.font = '13px Inter, sans-serif';
            ctx.fillStyle = '#e2e8f0';
            ctx.fillText(`Score: ${score} · Distance: ${Math.floor(distance / 10)}m`, W / 2, H / 2 + 22);
            ctx.textAlign = 'left';
        }
    }

    function loop(ts) {
        if (!lastTime) lastTime = ts;
        const dt = Math.min((ts - lastTime) / 1000, 1 / 30);
        lastTime = ts;
        update(dt);
        draw();
        rafId = requestAnimationFrame(loop);
    }

    // Boutons
    const jumpBtn = document.getElementById('runnerJump');
    jumpBtn.addEventListener('mousedown', jump);
    jumpBtn.addEventListener('mouseup', jumpCut);
    jumpBtn.addEventListener('touchstart', (e) => { e.preventDefault(); jump(); }, { passive: false });
    jumpBtn.addEventListener('touchend', (e) => { e.preventDefault(); jumpCut(); }, { passive: false });

    const slideBtn = document.getElementById('runnerSlide');
    slideBtn.addEventListener('mousedown', slideStart);
    slideBtn.addEventListener('mouseup', slideEnd);
    slideBtn.addEventListener('touchstart', (e) => { e.preventDefault(); slideStart(); }, { passive: false });
    slideBtn.addEventListener('touchend', (e) => { e.preventDefault(); slideEnd(); }, { passive: false });

    function jumpCut() { if (player?.jumping && player.vy < -150) player.vy = -150; }

    document.getElementById('runnerRestart').addEventListener('click', reset);
    document.getElementById('runnerSoundToggle').addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        document.getElementById('runnerSoundToggle').textContent = soundEnabled ? '🔊' : '🔇';
    });

    function onKey(e) {
        if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') { e.preventDefault(); jump(); }
        else if (e.key === 'ArrowDown' || e.key === 's') { e.preventDefault(); slideStart(); }
    }
    function onKeyUp(e) {
        if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') jumpCut();
        else if (e.key === 'ArrowDown' || e.key === 's') slideEnd();
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
