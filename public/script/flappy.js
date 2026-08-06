export default function initFlappy(container, controlsContainer) {
    container.innerHTML = '<canvas id="flappyCanvas" class="game-canvas" style="width:100%; max-width:400px; height:300px; background:linear-gradient(#4dc9f6, #a0e0ff); display:block; margin:0 auto;"></canvas><div id="flappyScore" style="text-align:center; font-weight:bold; margin-top:6px;">0</div>';
    controlsContainer.innerHTML = '<button id="flappyRestart" style="padding:10px 20px; width:100%; border-radius:10px; background:var(--primary,#3b82f6); color:#fff; border:none; font-weight:bold;">🔄 Recommencer</button>';
    const canvas = document.getElementById('flappyCanvas'), ctx = canvas.getContext('2d');
    const W = 400, H = 300;
    canvas.width = W; canvas.height = H;
    let bird = { x: 80, y: H/2, vy: 0, size: 14 };
    let pipes = [], score = 0, gameover = false, started = false, pipeGap = 90, pipeWidth = 40, pipeSpeed = 2;
    let rafId;
    function reset() {
        bird = { x: 80, y: H/2, vy: 0, size: 14 };
        pipes = []; score = 0; gameover = false; started = false;
        document.getElementById('flappyScore').textContent = '0';
    }
    function spawnPipe() {
        const top = Math.random() * (H - pipeGap - 100) + 30;
        pipes.push({ x: W, top, bottom: top + pipeGap, scored: false });
    }
    function update() {
        if (!started || gameover) return;
        bird.vy += 0.4; bird.y += bird.vy;
        if (bird.y < 0 || bird.y + bird.size > H) { gameover = true; return; }
        for (let p of pipes) {
            p.x -= pipeSpeed;
            if (p.x + pipeWidth < bird.x && !p.scored) { p.scored = true; score++; document.getElementById('flappyScore').textContent = score; }
            if (bird.x < p.x + pipeWidth && bird.x + bird.size > p.x &&
                (bird.y < p.top || bird.y + bird.size > p.bottom)) { gameover = true; }
        }
        pipes = pipes.filter(p => p.x > -pipeWidth);
        if (pipes.length === 0 || pipes[pipes.length-1].x < W - 160) spawnPipe();
    }
    function draw() {
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#FFD700'; ctx.fillRect(bird.x, bird.y, bird.size, bird.size);
        ctx.fillStyle = '#228B22';
        for (let p of pipes) {
            ctx.fillRect(p.x, 0, pipeWidth, p.top);
            ctx.fillRect(p.x, p.bottom, pipeWidth, H - p.bottom);
        }
        if (!started) { ctx.fillStyle = '#fff'; ctx.font = '16px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Appuie pour démarrer', W/2, H/2); }
        if (gameover) { ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0,0,W,H); ctx.fillStyle = '#fff'; ctx.font = '20px sans-serif'; ctx.fillText('Game Over', W/2, H/2); }
    }
    function loop() { update(); draw(); rafId = requestAnimationFrame(loop); }
    function flap() { if (gameover) reset(); else if (!started) started = true; bird.vy = -6; }
    canvas.addEventListener('click', flap);
    canvas.addEventListener('touchstart', e => { e.preventDefault(); flap(); });
    document.addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); flap(); } });
    document.getElementById('flappyRestart').addEventListener('click', reset);
    reset(); loop();
    return { stop() { cancelAnimationFrame(rafId); } };
}
