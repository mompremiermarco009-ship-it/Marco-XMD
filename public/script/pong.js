export default function initPong(container, controlsContainer) {
    container.innerHTML = '<canvas id="pongCanvas" class="game-canvas" style="width:100%; max-width:400px; height:250px; background:#1a1a2e; display:block; margin:0 auto;"></canvas><div id="pongScore" style="text-align:center; font-weight:bold; color:#fff; margin-top:6px;">0 - 0</div>';
    controlsContainer.innerHTML = '<button id="pongRestart" style="padding:10px 20px; width:100%; border-radius:10px; background:var(--primary,#3b82f6); color:#fff; border:none; font-weight:bold;">🔄 Recommencer</button>';
    const canvas = document.getElementById('pongCanvas'), ctx = canvas.getContext('2d');
    const W = 400, H = 250;
    canvas.width = W; canvas.height = H;
    let ball = { x: W/2, y: H/2, vx: 3, vy: 2, size: 8 };
    let paddle1 = { x: 10, y: H/2-40, w: 8, h: 80, score: 0 };
    let paddle2 = { x: W-18, y: H/2-40, w: 8, h: 80, score: 0 };
    let keys = { ArrowUp: false, ArrowDown: false };
    let rafId;
    function reset() {
        ball = { x: W/2, y: H/2, vx: 3*(Math.random()>0.5?1:-1), vy: 2*(Math.random()>0.5?1:-1), size: 8 };
        paddle1.y = H/2-40; paddle2.y = H/2-40; paddle1.score = 0; paddle2.score = 0;
        document.getElementById('pongScore').textContent = '0 - 0';
    }
    function update() {
        if (keys.ArrowUp) paddle1.y = Math.max(0, paddle1.y - 4);
        if (keys.ArrowDown) paddle1.y = Math.min(H - paddle1.h, paddle1.y + 4);
        // IA
        const target = ball.y + (ball.vy>0? 15 : -15);
        paddle2.y += (target - (paddle2.y + paddle2.h/2)) * 0.1;
        paddle2.y = Math.max(0, Math.min(H - paddle2.h, paddle2.y));
        ball.x += ball.vx; ball.y += ball.vy;
        if (ball.y <= 0 || ball.y >= H - ball.size) ball.vy *= -1;
        if (ball.x <= paddle1.x + paddle1.w && ball.y + ball.size >= paddle1.y && ball.y <= paddle1.y + paddle1.h) {
            ball.vx = Math.abs(ball.vx); ball.x = paddle1.x + paddle1.w + 1;
        }
        if (ball.x + ball.size >= paddle2.x && ball.y + ball.size >= paddle2.y && ball.y <= paddle2.y + paddle2.h) {
            ball.vx = -Math.abs(ball.vx); ball.x = paddle2.x - ball.size - 1;
        }
        if (ball.x < 0) { paddle2.score++; document.getElementById('pongScore').textContent = `${paddle1.score} - ${paddle2.score}`; ball = { x: W/2, y: H/2, vx: -3, vy: 2, size: 8 }; }
        if (ball.x > W) { paddle1.score++; document.getElementById('pongScore').textContent = `${paddle1.score} - ${paddle2.score}`; ball = { x: W/2, y: H/2, vx: 3, vy: 2, size: 8 }; }
    }
    function draw() {
        ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0,0,W,H);
        ctx.fillStyle = '#fff'; ctx.fillRect(ball.x, ball.y, ball.size, ball.size);
        ctx.fillRect(paddle1.x, paddle1.y, paddle1.w, paddle1.h);
        ctx.fillRect(paddle2.x, paddle2.y, paddle2.w, paddle2.h);
        ctx.setLineDash([5,5]); ctx.strokeStyle = '#333'; ctx.beginPath(); ctx.moveTo(W/2,0); ctx.lineTo(W/2,H); ctx.stroke();
    }
    function loop() { update(); draw(); rafId = requestAnimationFrame(loop); }
    window.addEventListener('keydown', e => { if (e.code in keys) { e.preventDefault(); keys[e.code] = true; } });
    window.addEventListener('keyup', e => { if (e.code in keys) keys[e.code] = false; });
    document.getElementById('pongRestart').addEventListener('click', reset);
    reset(); loop();
    return { stop() { cancelAnimationFrame(rafId); window.removeEventListener('keydown',()=>{}); } };
}
