export default function initInvaders(container, controlsContainer) {
    container.innerHTML = `
        <canvas id="invadersCanvas" class="game-canvas" style="width:100%; max-width:400px; height:300px; background:#000; display:block; margin:0 auto; touch-action:none;"></canvas>
        <div id="invadersScore" style="text-align:center; font-weight:bold; color:#fff; margin-top:6px;">Score: 0 | Ennemis: 24</div>
    `;
    controlsContainer.innerHTML = `
        <div style="display:flex; gap:8px; justify-content:center; margin-top:8px; flex-wrap:wrap;">
            <button id="btnLeft" style="padding:12px 24px; background:#3b82f6; color:#fff; border:none; border-radius:8px; font-size:1.2rem; touch-action:none;">⬅️</button>
            <button id="btnFire" style="padding:12px 24px; background:#ef4444; color:#fff; border:none; border-radius:8px; font-size:1.2rem;">🔫 Tirer</button>
            <button id="btnRight" style="padding:12px 24px; background:#3b82f6; color:#fff; border:none; border-radius:8px; font-size:1.2rem; touch-action:none;">➡️</button>
        </div>
        <button id="invadersRestart" style="margin-top:8px; padding:10px; width:100%; border-radius:8px; background:#333; color:#fff; border:1px solid #555;">🔄 Recommencer</button>
        <p style="color:#aaa; font-size:12px; text-align:center; margin-top:6px;">Clavier : ← → pour bouger, Espace pour tirer</p>
    `;

    const canvas = document.getElementById('invadersCanvas');
    const ctx = canvas.getContext('2d');
    const W = 400, H = 300;
    canvas.width = W; canvas.height = H;

    let player, bullets, enemies, enemyBullets, score, gameover, win, enemyDir;
    let rafId, moveLeft = false, moveRight = false;
    let lastShot = 0;
    const shotCooldown = 300; // ms

    function reset() {
        player = { x: W/2 - 15, y: H - 30, w: 30, h: 15 };
        bullets = [];
        enemyBullets = [];
        score = 0;
        gameover = false;
        win = false;
        enemyDir = 1;
        enemies = [];
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 8; col++) {
                enemies.push({ x: 50 + col * 40, y: 30 + row * 35, w: 25, h: 15, alive: true });
            }
        }
        updateScore();
    }

    function updateScore() {
        const remaining = enemies.filter(e => e.alive).length;
        document.getElementById('invadersScore').textContent = `Score: ${score} | Ennemis: ${remaining}`;
    }

    function fire() {
        const now = Date.now();
        if (!gameover && !win && now - lastShot >= shotCooldown) {
            bullets.push({ x: player.x + player.w/2, y: player.y });
            lastShot = now;
        }
    }

    function update() {
        if (gameover || win) return;

        // Mouvement joueur
        if (moveLeft) player.x = Math.max(0, player.x - 5);
        if (moveRight) player.x = Math.min(W - player.w, player.x + 5);

        // Tirs du joueur
        bullets.forEach(b => b.y -= 5);
        bullets = bullets.filter(b => b.y > 0);

        // Mouvement des ennemis
        enemies.forEach(e => { if (e.alive) e.x += enemyDir * 0.5; });

        const aliveEnemies = enemies.filter(e => e.alive);
        if (aliveEnemies.length) {
            const leftmost = Math.min(...aliveEnemies.map(e => e.x));
            const rightmost = Math.max(...aliveEnemies.map(e => e.x + e.w));
            if (leftmost <= 10 || rightmost >= W - 10) {
                enemyDir *= -1;
                aliveEnemies.forEach(e => e.y += 5);
            }
        }

        // Collisions tirs joueur - ennemis
        for (let b of bullets) {
            for (let e of enemies) {
                if (e.alive && b.x > e.x && b.x < e.x + e.w && b.y > e.y && b.y < e.y + e.h) {
                    e.alive = false;
                    b.y = -10;
                    score += 10;
                    updateScore();
                    break;
                }
            }
        }

        // Tirs des ennemis
        enemies.filter(e => e.alive && Math.random() < 0.004).forEach(e => {
            enemyBullets.push({ x: e.x + e.w/2, y: e.y + e.h, vy: 3 });
        });
        enemyBullets.forEach(b => b.y += b.vy);
        enemyBullets = enemyBullets.filter(b => b.y < H);

        // Collision tirs ennemis - joueur
        if (enemyBullets.some(b => b.x > player.x && b.x < player.x + player.w && b.y > player.y && b.y < player.y + player.h)) {
            gameover = true;
        }

        // Ennemis atteignent le bas
        if (enemies.some(e => e.alive && e.y + e.h >= player.y)) {
            gameover = true;
        }

        // Victoire ?
        if (enemies.every(e => !e.alive)) {
            win = true;
        }

        if (gameover || win) {
            updateScore();
        }
    }

    function draw() {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, W, H);

        // Étoiles en fond (simple)
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        for (let i = 0; i < 50; i++) {
            if (i % 2 === 0) continue; // juste quelques étoiles fixes
            ctx.fillRect((i * 23) % W, (i * 7) % H, 1, 1);
        }

        // Joueur
        ctx.fillStyle = '#0f0';
        ctx.fillRect(player.x, player.y, player.w, player.h);

        // Ennemis
        ctx.fillStyle = '#fff';
        for (let e of enemies) {
            if (e.alive) {
                ctx.fillRect(e.x, e.y, e.w, e.h);
            }
        }

        // Tirs joueur
        ctx.fillStyle = '#ff0';
        for (let b of bullets) {
            ctx.fillRect(b.x - 2, b.y, 4, 10);
        }

        // Tirs ennemis
        ctx.fillStyle = '#f00';
        for (let b of enemyBullets) {
            ctx.fillRect(b.x - 2, b.y, 4, 8);
        }

        if (gameover) {
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(0, H/2 - 40, W, 80);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 24px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('💥 GAME OVER', W/2, H/2 + 8);
            ctx.textAlign = 'left';
        } else if (win) {
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(0, H/2 - 40, W, 80);
            ctx.fillStyle = '#0f0';
            ctx.font = 'bold 24px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('🏆 VICTOIRE !', W/2, H/2 + 8);
            ctx.textAlign = 'left';
        }
    }

    function loop() {
        update();
        draw();
        rafId = requestAnimationFrame(loop);
    }

    // Contrôles clavier
    function keyDownHandler(e) {
        if (e.key === 'ArrowLeft') { e.preventDefault(); moveLeft = true; }
        else if (e.key === 'ArrowRight') { e.preventDefault(); moveRight = true; }
        else if (e.key === ' ') { e.preventDefault(); fire(); }
    }
    function keyUpHandler(e) {
        if (e.key === 'ArrowLeft') moveLeft = false;
        else if (e.key === 'ArrowRight') moveRight = false;
    }
    window.addEventListener('keydown', keyDownHandler);
    window.addEventListener('keyup', keyUpHandler);

    // Contrôles tactiles (boutons)
    const btnLeft = document.getElementById('btnLeft');
    const btnRight = document.getElementById('btnRight');
    const btnFire = document.getElementById('btnFire');

    const addTouchAndMouse = (element, onStart, onEnd) => {
        element.addEventListener('mousedown', onStart);
        element.addEventListener('mouseup', onEnd);
        element.addEventListener('touchstart', (e) => { e.preventDefault(); onStart(); }, { passive: false });
        element.addEventListener('touchend', (e) => { e.preventDefault(); onEnd(); }, { passive: false });
    };

    addTouchAndMouse(btnLeft, () => moveLeft = true, () => moveLeft = false);
    addTouchAndMouse(btnRight, () => moveRight = true, () => moveRight = false);
    btnFire.addEventListener('click', fire);
    btnFire.addEventListener('touchstart', (e) => { e.preventDefault(); fire(); }, { passive: false });

    document.getElementById('invadersRestart').addEventListener('click', reset);

    reset();
    rafId = requestAnimationFrame(loop);

    return {
        stop() {
            cancelAnimationFrame(rafId);
            window.removeEventListener('keydown', keyDownHandler);
            window.removeEventListener('keyup', keyUpHandler);
        }
    };
}
