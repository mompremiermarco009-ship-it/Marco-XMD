export default function initInvaders(container, controlsContainer) {
    container.innerHTML = '<canvas id="invadersCanvas" class="game-canvas" style="width:100%; max-width:400px; height:300px; background:#000; display:block; margin:0 auto;"></canvas><div id="invadersScore" style="text-align:center; font-weight:bold; color:#fff; margin-top:6px;">Score: 0</div>';
    controlsContainer.innerHTML = `
        <div style="display:flex; gap:8px; justify-content:center; margin-top:8px;">
            <button id="btnLeft" style="padding:10px 20px; background:var(--primary); color:#fff; border:none; border-radius:8px;">⬅️</button>
            <button id="btnFire" style="padding:10px 20px; background:#ef4444; color:#fff; border:none; border-radius:8px;">🔫</button>
            <button id="btnRight" style="padding:10px 20px; background:var(--primary); color:#fff; border:none; border-radius:8px;">➡️</button>
        </div>
        <button id="invadersRestart" style="margin-top:8px; padding:8px; width:100%; border-radius:8px; background:var(--surface,#333); color:#fff; border:1px solid #555;">🔄 Recommencer</button>`;
    const canvas = document.getElementById('invadersCanvas'), ctx = canvas.getContext('2d');
    const W = 400, H = 300;
    canvas.width = W; canvas.height = H;
    let player = { x: W/2-15, y: H-30, w: 30, h: 15 };
    let bullets = [], enemies = [], enemyBullets = [], score = 0, gameover = false, enemyDir = 1;
    let rafId, moveLeft = false, moveRight = false;
    function reset() {
        player = { x: W/2-15, y: H-30, w: 30, h: 15 };
        bullets = []; enemyBullets = []; score = 0; gameover = false; enemyDir = 1;
        enemies = [];
        for (let row=0; row<3; row++) for (let col=0; col<8; col++) enemies.push({ x: 50+col*40, y: 30+row*35, w: 25, h: 15, alive: true });
        document.getElementById('invadersScore').textContent = 'Score: 0';
    }
    function update() {
        if (gameover) return;
        if (moveLeft) player.x = Math.max(0, player.x-5);
        if (moveRight) player.x = Math.min(W-player.w, player.x+5);
        bullets.forEach(b => b.y -= 5);
        bullets = bullets.filter(b => b.y > 0);
        enemies.forEach(e => { if (e.alive) e.x += enemyDir*0.5; });
        const aliveEnemies = enemies.filter(e => e.alive);
        if (aliveEnemies.length && (aliveEnemies[0].x <= 10 || aliveEnemies[aliveEnemies.length-1].x >= W-35)) { enemyDir *= -1; aliveEnemies.forEach(e => e.y += 5); }
        for (let b of bullets)
            for (let e of enemies)
                if (e.alive && b.x > e.x && b.x < e.x+e.w && b.y > e.y && b.y < e.y+e.h) { e.alive = false; b.y = -10; score+=10; document.getElementById('invadersScore').textContent = `Score: ${score}`; }
        enemies.filter(e => e.alive && Math.random()<0.002).forEach(e => enemyBullets.push({ x: e.x+e.w/2, y: e.y+e.h, vy: 3 }));
        enemyBullets.forEach(b => b.y += b.vy);
        enemyBullets = enemyBullets.filter(b => b.y < H);
        if (enemyBullets.some(b => b.x > player.x && b.x < player.x+player.w && b.y > player.y && b.y < player.y+player.h)) gameover = true;
        if (enemies.some(e => e.alive && e.y+e.h >= player.y)) gameover = true;
        if (enemies.every(e => !e.alive)) { gameover = true; /* win */ }
    }
    function draw() {
        ctx.fillStyle = '#000'; ctx.fillRect(0,0,W,H);
        ctx.fillStyle = '#0f0'; ctx.fillRect(player.x, player.y, player.w, player.h);
        ctx.fillStyle = '#fff';
        for (let e of enemies) if (e.alive) ctx.fillRect(e.x, e.y, e.w, e.h);
        ctx.fillStyle = '#ff0';
        for (let b of bullets) ctx.fillRect(b.x-2, b.y, 4, 10);
        ctx.fillStyle = '#f00';
        for (let b of enemyBullets) ctx.fillRect(b.x-2, b.y, 4, 8);
        if (gameover) { ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0,0,W,H); ctx.fillStyle = '#fff'; ctx.font = '20px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Game Over', W/2, H/2); }
    }
    function loop() { update(); draw(); rafId = requestAnimationFrame(loop); }
    function fire() { if (!gameover) bullets.push({ x: player.x+player.w/2, y: player.y }); }
    document.getElementById('btnLeft').addEventListener('mousedown', ()=>moveLeft=true);
    document.getElementById('btnLeft').addEventListener('mouseup', ()=>moveLeft=false);
    document.getElementById('btnRight').addEventListener('mousedown', ()=>moveRight=true);
    document.getElementById('btnRight').addEventListener('mouseup', ()=>moveRight=false);
    document.getElementById('btnFire').addEventListener('click', fire);
    document.getElementById('invadersRestart').addEventListener('click', reset);
    window.addEventListener('keydown', e => {
        if (e.key==='ArrowLeft') { e.preventDefault(); moveLeft=true; }
        else if (e.key==='ArrowRight') { e.preventDefault(); moveRight=true; }
        else if (e.key===' ') { e.preventDefault(); fire(); }
    });
    window.addEventListener('keyup', e => {
        if (e.key==='ArrowLeft') moveLeft=false;
        else if (e.key==='ArrowRight') moveRight=false;
    });
    reset(); loop();
    return { stop() { cancelAnimationFrame(rafId); } };
}
