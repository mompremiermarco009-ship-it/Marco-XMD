export default function initPong(container, controlsContainer) {
    container.innerHTML = `
        <canvas id="pongCanvas" class="game-canvas" style="width:100%; max-width:400px; height:250px; background:#1a1a2e; display:block; margin:0 auto;"></canvas>
        <div id="pongScore" style="text-align:center; font-weight:bold; color:#fff; margin-top:6px;">0 - 0</div>
    `;
    controlsContainer.innerHTML = `
        <div style="display:flex; justify-content:center; gap:10px; margin-top:12px; flex-wrap:wrap;">
            <button id="pongModeToggle" style="padding:8px 16px; background:#3b82f6; color:#fff; border:none; border-radius:8px; font-weight:bold;">Mode : Solo</button>
            <button id="pongRestart" style="padding:8px 16px; background:#3b82f6; color:#fff; border:none; border-radius:8px; font-weight:bold;">🔄 Recommencer</button>
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:15px;">
            <div style="text-align:center;">
                <div style="color:#fff; font-weight:bold; margin-bottom:8px;">Joueur 1</div>
                <div style="display:flex; flex-direction:column; gap:8px; align-items:center;">
                    <button id="p1Up" style="padding:14px; background:#3b82f6; color:#fff; border:none; border-radius:8px; font-size:1.2rem;">▲</button>
                    <button id="p1Down" style="padding:14px; background:#3b82f6; color:#fff; border:none; border-radius:8px; font-size:1.2rem;">▼</button>
                </div>
            </div>
            <div style="text-align:center;">
                <div style="color:#fff; font-weight:bold; margin-bottom:8px;">Joueur 2 / IA</div>
                <div style="display:flex; flex-direction:column; gap:8px; align-items:center;">
                    <button id="p2Up" style="padding:14px; background:#ef4444; color:#fff; border:none; border-radius:8px; font-size:1.2rem;">▲</button>
                    <button id="p2Down" style="padding:14px; background:#ef4444; color:#fff; border:none; border-radius:8px; font-size:1.2rem;">▼</button>
                </div>
            </div>
        </div>
        <p style="color:#aaa; font-size:12px; text-align:center; margin-top:10px;">Clavier : Joueur 1 = Z/S, Joueur 2 = Flèches ↑/↓</p>
    `;

    const canvas = document.getElementById('pongCanvas');
    const ctx = canvas.getContext('2d');
    const W = 400, H = 250;
    canvas.width = W; canvas.height = H;

    let ball, paddle1, paddle2, keys, rafId, mode = 'solo';
    const p1Up = document.getElementById('p1Up');
    const p1Down = document.getElementById('p1Down');
    const p2Up = document.getElementById('p2Up');
    const p2Down = document.getElementById('p2Down');
    const modeToggle = document.getElementById('pongModeToggle');

    function reset() {
        ball = { x: W/2, y: H/2, vx: 3*(Math.random()>0.5?1:-1), vy: 2*(Math.random()>0.5?1:-1), size: 8 };
        paddle1 = { x: 10, y: H/2-40, w: 8, h: 80, score: 0, vy: 0 };
        paddle2 = { x: W-18, y: H/2-40, w: 8, h: 80, score: 0, vy: 0 };
        keys = { 
            p1Up: false, p1Down: false, 
            p2Up: false, p2Down: false,
            z: false, s: false, ArrowUp: false, ArrowDown: false 
        };
        document.getElementById('pongScore').textContent = '0 - 0';
    }

    function update() {
        if (keys.p1Up || keys.z) paddle1.y = Math.max(0, paddle1.y - 5);
        if (keys.p1Down || keys.s) paddle1.y = Math.min(H - paddle1.h, paddle1.y + 5);

        if (mode === 'solo') {
            const target = ball.y + (ball.vy > 0 ? 20 : -20);
            paddle2.y += (target - (paddle2.y + paddle2.h/2)) * 0.1;
            paddle2.y = Math.max(0, Math.min(H - paddle2.h, paddle2.y));
        } else if (mode === 'duo') {
            if (keys.p2Up || keys.ArrowUp) paddle2.y = Math.max(0, paddle2.y - 5);
            if (keys.p2Down || keys.ArrowDown) paddle2.y = Math.min(H - paddle2.h, paddle2.y + 5);
        }

        ball.x += ball.vx;
        ball.y += ball.vy;

        if (ball.y <= 0 || ball.y >= H - ball.size) ball.vy *= -1;

        if (ball.x <= paddle1.x + paddle1.w && ball.y + ball.size >= paddle1.y && ball.y <= paddle1.y + paddle1.h) {
            ball.vx = Math.abs(ball.vx);
            ball.x = paddle1.x + paddle1.w + 1;
        }
        if (ball.x + ball.size >= paddle2.x && ball.y + ball.size >= paddle2.y && ball.y <= paddle2.y + paddle2.h) {
            ball.vx = -Math.abs(ball.vx);
            ball.x = paddle2.x - ball.size - 1;
        }

        if (ball.x < 0) {
            paddle2.score++;
            document.getElementById('pongScore').textContent = `${paddle1.score} - ${paddle2.score}`;
            ball = { x: W/2, y: H/2, vx: -3, vy: 2*(Math.random()>0.5?1:-1), size: 8 };
        }
        if (ball.x > W) {
            paddle1.score++;
            document.getElementById('pongScore').textContent = `${paddle1.score} - ${paddle2.score}`;
            ball = { x: W/2, y: H/2, vx: 3, vy: 2*(Math.random()>0.5?1:-1), size: 8 };
        }
    }

    function draw() {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0,0,W,H);
        ctx.fillStyle = '#fff';
        ctx.fillRect(ball.x, ball.y, ball.size, ball.size);
        ctx.fillRect(paddle1.x, paddle1.y, paddle1.w, paddle1.h);
        ctx.fillRect(paddle2.x, paddle2.y, paddle2.w, paddle2.h);
        ctx.setLineDash([5,5]);
        ctx.strokeStyle = '#333';
        ctx.beginPath();
        ctx.moveTo(W/2,0);
        ctx.lineTo(W/2,H);
        ctx.stroke();
    }

    function loop() {
        update();
        draw();
        rafId = requestAnimationFrame(loop);
    }

    function toggleMode() {
        if (mode === 'solo') {
            mode = 'duo';
            modeToggle.textContent = 'Mode : 2 Joueurs';
        } else {
            mode = 'solo';
            modeToggle.textContent = 'Mode : Solo';
        }
        reset();
    }

    function keyDownHandler(e) {
        e.preventDefault();
        if (e.key === 'z' || e.key === 'Z') keys.z = true;
        if (e.key === 's' || e.key === 'S') keys.s = true;
        if (e.key === 'ArrowUp') keys.ArrowUp = true;
        if (e.key === 'ArrowDown') keys.ArrowDown = true;
    }
    function keyUpHandler(e) {
        if (e.key === 'z' || e.key === 'Z') keys.z = false;
        if (e.key === 's' || e.key === 'S') keys.s = false;
        if (e.key === 'ArrowUp') keys.ArrowUp = false;
        if (e.key === 'ArrowDown') keys.ArrowDown = false;
    }
    window.addEventListener('keydown', keyDownHandler);
    window.addEventListener('keyup', keyUpHandler);

    const addButtonListeners = (btn, keyTrue) => {
        btn.addEventListener('mousedown', () => keys[keyTrue] = true);
        btn.addEventListener('mouseup', () => keys[keyTrue] = false);
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); keys[keyTrue] = true; });
        btn.addEventListener('touchend', () => keys[keyTrue] = false);
    };

    addButtonListeners(p1Up, 'p1Up');
    addButtonListeners(p1Down, 'p1Down');
    addButtonListeners(p2Up, 'p2Up');
    addButtonListeners(p2Down, 'p2Down');

    modeToggle.addEventListener('click', toggleMode);
    document.getElementById('pongRestart').addEventListener('click', reset);

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
