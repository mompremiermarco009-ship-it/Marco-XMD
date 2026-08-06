// script/runner.js
// Version améliorée : parallax, animation de course, particules de poussière,
// physique de saut variable (jump-cut), squash & stretch à l'atterrissage,
// petits sons synthétisés, boucle en requestAnimationFrame (delta-time).
export default function initRunner(container, controlsContainer) {
    container.innerHTML = `
        <canvas id="runnerCanvas" class="game-canvas" style="width:100%; max-width:400px; height:200px; border-radius:10px; display:block; margin:0 auto; background:#87CEEB;"></canvas>
        <div id="runnerScoreLine" style="text-align:center; margin-top:6px; font-weight:700; color:var(--text, #111827); font-size:14px;"></div>
    `;
    controlsContainer.innerHTML = `
        <div style="display:flex; justify-content:center; gap:16px; margin-top:10px;">
            <button id="btnJump" style="padding:14px 26px; font-size:1.1rem; background:var(--primary,#3b82f6); color:#fff; border:none; border-radius:10px; font-weight:bold;">⬆️ Sauter</button>
            <button id="btnSlide" style="padding:14px 26px; font-size:1.1rem; background:var(--primary,#3b82f6); color:#fff; border:none; border-radius:10px; font-weight:bold;">⬇️ Glisser</button>
        </div>
        <button id="restartRunner" style="margin-top:10px; padding:8px 18px; font-size:0.9rem; width:100%;">🔄 Recommencer</button>
    `;

    const canvas = document.getElementById('runnerCanvas');
    const ctx = canvas.getContext('2d');

    // ---------- Résolution HiDPI (canvas net sur mobile) ----------
    const CSS_W = 380, CSS_H = 200;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = CSS_W * DPR;
    canvas.height = CSS_H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const W = CSS_W, H = CSS_H;

    const groundY = H - 40;
    const playerNormalHeight = 38;
    const playerSlideHeight = 20;
    const gravity = 1450;      // px/s²
    const jumpVelocity = -520; // px/s

    let player, obstacles, clouds, hills, dust, particles;
    let distance, speed, baseSpeed, gameover, score, lastTime, rafId, shake, flashTimer;
    let audioCtx = null;
    let nextObstacleAt = 700;

    function beep(freq, duration, type = 'sine', gain = 0.05) {
        try {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            osc.type = type;
            osc.frequency.value = freq;
            g.gain.value = gain;
            osc.connect(g); g.connect(audioCtx.destination);
            osc.start();
            g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
            osc.stop(audioCtx.currentTime + duration);
        } catch {}
    }

    function reset() {
        player = {
            x: 55, y: groundY - playerNormalHeight, width: 26, height: playerNormalHeight,
            vy: 0, jumping: false, sliding: false, squash: 1, runPhase: 0
        };
        obstacles = [];
        clouds = Array.from({ length: 4 }, () => ({ x: Math.random() * W, y: 20 + Math.random() * 40, s: 0.5 + Math.random() * 0.7 }));
        hills = Array.from({ length: 3 }, (_, i) => ({ x: i * (W / 2), s: 0.9 - i * 0.15 }));
        dust = [];
        particles = [];
        distance = 0;
        baseSpeed = 190; // px/s
        speed = baseSpeed;
        gameover = false;
        score = 0;
        shake = 0;
        flashTimer = 0;
        nextObstacleAt = 700;
    }

    function spawnObstacle() {
        const r = Math.random();
        let type;
        if (r < 0.35) type = 'rock';
        else if (r < 0.65) type = 'spike';
        else type = 'bird';

        if (type === 'bird') {
            const flyHeight = groundY - playerNormalHeight - (Math.random() < 0.5 ? 10 : 45);
            obstacles.push({ x: W + 20, y: flyHeight, width: 30, height: 18, type, wing: 0 });
        } else {
            const height = type === 'spike' ? 26 : 22;
            const width = type === 'spike' ? 18 : 26;
            obstacles.push({ x: W + 20, y: groundY - height, width, height, type });
        }
    }

    function spawnDust() {
        if (player.jumping) return;
        dust.push({ x: player.x + 4, y: groundY - 2, vx: -speed * 0.3 - 20, vy: -10 - Math.random() * 15, life: 0.4, r: 2 + Math.random() * 2 });
    }

    function spawnBurst(x, y, color, n = 12) {
        for (let i = 0; i < n; i++) {
            const a = Math.random() * Math.PI * 2;
            const sp = 60 + Math.random() * 120;
            particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, life: 0.5 + Math.random() * 0.4, color });
        }
    }

    function update(dt) {
        if (gameover) {
            for (const p of particles) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt; }
            particles = particles.filter(p => p.life > 0);
            if (flashTimer > 0) flashTimer -= dt;
            if (shake > 0) shake -= dt * 3;
            return;
        }

        distance += speed * dt;
        speed = Math.min(baseSpeed + distance * 0.02, baseSpeed * 2.4);

        if (player.jumping) {
            player.vy += gravity * dt;
            player.y += player.vy * dt;
            if (player.y >= groundY - playerNormalHeight) {
                player.y = groundY - playerNormalHeight;
                player.jumping = false;
                player.vy = 0;
                player.squash = 1.35;
                spawnBurst(player.x + player.width / 2, groundY - 2, '#c9a876', 6);
            }
        }

        player.squash += (1 - player.squash) * Math.min(1, dt * 10);

        if (player.sliding && !player.jumping) {
            player.height = playerSlideHeight;
            player.y = groundY - playerSlideHeight;
        } else if (!player.jumping) {
            player.height = playerNormalHeight;
            player.y = groundY - playerNormalHeight;
        }

        player.runPhase += speed * dt * 0.05;

        if (!player.jumping && Math.floor(distance / 14) !== Math.floor((distance - speed * dt) / 14)) spawnDust();
        for (const d of dust) { d.life -= dt; d.x += d.vx * dt; d.y += d.vy * dt; d.vy += 40 * dt; }
        dust = dust.filter(d => d.life > 0);

        for (const c of clouds) { c.x -= speed * 0.15 * c.s * dt; if (c.x < -40) c.x = W + 40; }
        for (const h of hills) { h.x -= speed * 0.35 * h.s * dt; if (h.x < -W / 2) h.x += W; }

        for (let i = obstacles.length - 1; i >= 0; i--) {
            const o = obstacles[i];
            o.x -= speed * dt;
            if (o.type === 'bird') o.wing += dt * 12;
            if (o.x + o.width < 0) { obstacles.splice(i, 1); score++; beep(880, 0.05, 'square', 0.03); }
        }
        nextObstacleAt -= speed * dt;
        if (nextObstacleAt <= 0) {
            spawnObstacle();
            nextObstacleAt = 260 + Math.random() * 180 - Math.min(speed - baseSpeed, 120);
        }

        const margin = 4;
        for (const o of obstacles) {
            if (player.x + margin < o.x + o.width &&
                player.x + player.width - margin > o.x &&
                player.y + margin < o.y + o.height &&
                player.y + player.height - margin > o.y) {
                gameover = true;
                shake = 1;
                flashTimer = 0.25;
                spawnBurst(player.x + player.width / 2, player.y + player.height / 2, '#ef4444', 20);
                beep(120, 0.3, 'sawtooth', 0.08);
                break;
            }
        }
    }

    function drawBackground() {
        const g = ctx.createLinearGradient(0, 0, 0, groundY);
        g.addColorStop(0, '#8ec9f0');
        g.addColorStop(1, '#cdeaff');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, groundY);

        ctx.fillStyle = '#a7d8b0';
        for (const h of hills) {
            ctx.beginPath();
            ctx.ellipse(h.x, groundY, W * 0.4, 50 * h.s, 0, Math.PI, 2 * Math.PI);
            ctx.fill();
        }

        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        for (const c of clouds) {
            ctx.beginPath();
            ctx.ellipse(c.x, c.y, 18 * c.s, 8 * c.s, 0, 0, Math.PI * 2);
            ctx.ellipse(c.x + 14 * c.s, c.y + 3, 12 * c.s, 7 * c.s, 0, 0, Math.PI * 2);
            ctx.ellipse(c.x - 12 * c.s, c.y + 3, 10 * c.s, 6 * c.s, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = '#8B5A2B';
        ctx.fillRect(0, groundY, W, H - groundY);
        ctx.fillStyle = '#6f4520';
        ctx.fillRect(0, groundY, W, 4);
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 2;
        const dashOffset = (distance * 0.5) % 40;
        for (let x = -dashOffset; x < W; x += 40) {
            ctx.beginPath(); ctx.moveTo(x, groundY + 14); ctx.lineTo(x + 18, groundY + 14); ctx.stroke();
        }
    }

    function roundRect(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
        ctx.fill();
    }

    function drawPlayer() {
        const px = player.x, py = player.y, pw = player.width, ph = player.height;
        const cx = px + pw / 2;

        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(cx, groundY + 2, pw * 0.55, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.translate(cx, py + ph);
        ctx.scale(1 / player.squash, player.squash);
        ctx.translate(-cx, -(py + ph));

        if (player.sliding && !player.jumping) {
            ctx.fillStyle = '#f59e0b';
            roundRect(px - 4, py + ph - 16, pw + 12, 16, 6);
            ctx.fillStyle = '#111827';
            ctx.beginPath(); ctx.arc(px + pw + 2, py + ph - 10, 6, 0, Math.PI * 2); ctx.fill();
        } else {
            const legSwing = player.jumping ? 0 : Math.sin(player.runPhase) * 10;
            ctx.strokeStyle = '#7c2d12'; ctx.lineWidth = 5; ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(cx - 4, py + ph - 14); ctx.lineTo(cx - 4 + legSwing, py + ph);
            ctx.moveTo(cx + 4, py + ph - 14); ctx.lineTo(cx + 4 - legSwing, py + ph);
            ctx.stroke();
            ctx.strokeStyle = '#c2410c'; ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(cx, py + 10); ctx.lineTo(cx - legSwing * 0.7, py + 20);
            ctx.stroke();
            ctx.fillStyle = '#f59e0b';
            roundRect(px, py + 6, pw, ph - 14, 6);
            ctx.fillStyle = '#fcd9a8';
            ctx.beginPath(); ctx.arc(cx, py + 2, 8, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(cx - 8, py - 3, 16, 5);
        }
        ctx.restore();
    }

    function drawObstacles() {
        for (const o of obstacles) {
            if (o.type === 'rock') {
                ctx.fillStyle = '#6b7280';
                ctx.beginPath();
                ctx.moveTo(o.x, o.y + o.height);
                ctx.lineTo(o.x + 4, o.y + 4);
                ctx.lineTo(o.x + o.width * 0.5, o.y);
                ctx.lineTo(o.x + o.width - 4, o.y + 6);
                ctx.lineTo(o.x + o.width, o.y + o.height);
                ctx.closePath(); ctx.fill();
            } else if (o.type === 'spike') {
                ctx.fillStyle = '#374151';
                for (let i = 0; i < 3; i++) {
                    const sx = o.x + i * (o.width / 3);
                    ctx.beginPath();
                    ctx.moveTo(sx, o.y + o.height);
                    ctx.lineTo(sx + o.width / 6, o.y);
                    ctx.lineTo(sx + o.width / 3, o.y + o.height);
                    ctx.closePath(); ctx.fill();
                }
            } else if (o.type === 'bird') {
                ctx.fillStyle = '#1f2937';
                const flap = Math.sin(o.wing) * 8;
                ctx.beginPath();
                ctx.moveTo(o.x, o.y + 8);
                ctx.quadraticCurveTo(o.x + o.width / 2, o.y + 8 - flap, o.x + o.width, o.y + 8);
                ctx.quadraticCurveTo(o.x + o.width / 2, o.y + 8 + flap * 0.4, o.x, o.y + 8);
                ctx.fill();
                ctx.beginPath(); ctx.arc(o.x + o.width - 4, o.y + 6, 3, 0, Math.PI * 2); ctx.fill();
            }
        }
    }

    function drawParticles() {
        for (const d of dust) {
            ctx.fillStyle = `rgba(230,215,190,${Math.max(d.life / 0.4, 0)})`;
            ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill();
        }
        for (const p of particles) {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(p.life, 0);
            ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    function draw() {
        ctx.save();
        if (shake > 0) {
            ctx.translate((Math.random() - 0.5) * 8 * shake, (Math.random() - 0.5) * 8 * shake);
        }
        ctx.clearRect(-10, -10, W + 20, H + 20);
        drawBackground();
        drawObstacles();
        drawPlayer();
        drawParticles();
        ctx.restore();

        if (flashTimer > 0) {
            ctx.fillStyle = `rgba(239,68,68,${flashTimer / 0.25 * 0.35})`;
            ctx.fillRect(0, 0, W, H);
        }

        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        roundRect(8, 8, 90, 24, 6);
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.fillText('🏁 ' + score, 16, 25);

        if (gameover) {
            ctx.fillStyle = 'rgba(17,24,39,0.75)';
            ctx.fillRect(0, H / 2 - 34, W, 68);
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.font = 'bold 20px Inter, sans-serif';
            ctx.fillText('💥 Game Over', W / 2, H / 2 - 6);
            ctx.font = '13px Inter, sans-serif';
            ctx.fillText('Score final : ' + score + ' — Appuie sur Recommencer', W / 2, H / 2 + 16);
            ctx.textAlign = 'left';
        }
        document.getElementById('runnerScoreLine').textContent = gameover ? '' : `Distance : ${Math.floor(distance)} m`;
    }

    function loop(ts) {
        if (!lastTime) lastTime = ts;
        let dt = (ts - lastTime) / 1000;
        dt = Math.min(dt, 1 / 30);
        lastTime = ts;
        update(dt);
        draw();
        rafId = requestAnimationFrame(loop);
    }

    function start() {
        reset();
        lastTime = 0;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(loop);
    }

    function jump() {
        if (!player.jumping && !gameover && !player.sliding) {
            player.jumping = true;
            player.vy = jumpVelocity;
            player.squash = 0.8;
            beep(660, 0.12, 'triangle', 0.05);
        }
    }
    function jumpCut() {
        if (player && player.jumping && player.vy < -150) player.vy = -150;
    }
    function slideStart() { if (!gameover && !player.jumping) player.sliding = true; }
    function slideEnd() { if (player) player.sliding = false; }

    const btnJump = document.getElementById('btnJump');
    const btnSlide = document.getElementById('btnSlide');
    btnJump.addEventListener('mousedown', jump);
    btnJump.addEventListener('touchstart', (e) => { e.preventDefault(); jump(); }, { passive: false });
    btnJump.addEventListener('mouseup', jumpCut);
    btnJump.addEventListener('touchend', jumpCut);
    btnSlide.addEventListener('mousedown', slideStart);
    btnSlide.addEventListener('touchstart', (e) => { e.preventDefault(); slideStart(); }, { passive: false });
    btnSlide.addEventListener('mouseup', slideEnd);
    btnSlide.addEventListener('touchend', slideEnd);
    document.getElementById('restartRunner').addEventListener('click', start);

    function keyHandler(e) {
        if (e.key === 'ArrowUp' || e.key === ' ' || e.code === 'Space') { e.preventDefault(); jump(); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); slideStart(); }
    }
    function keyUpHandler(e) {
        if (e.key === 'ArrowUp' || e.key === ' ' || e.code === 'Space') jumpCut();
        else if (e.key === 'ArrowDown') { e.preventDefault(); slideEnd(); }
    }
    document.addEventListener('keydown', keyHandler);
    document.addEventListener('keyup', keyUpHandler);

    start();

    return {
        stop() {
            if (rafId) cancelAnimationFrame(rafId);
            document.removeEventListener('keydown', keyHandler);
            document.removeEventListener('keyup', keyUpHandler);
            if (audioCtx) { try { audioCtx.close(); } catch {} }
        }
    };
}
