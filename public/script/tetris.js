export default function initTetris(container, controlsContainer) {
    container.innerHTML = `
        <div style="display:flex; gap:14px; justify-content:center; align-items:flex-start; flex-wrap:wrap;">
            <canvas id="tetrisCanvas" style="background:#0a0e1a; border-radius:12px; touch-action:none;"></canvas>
            <div style="display:flex; flex-direction:column; gap:10px;">
                <div style="background:var(--surface-alt); border:1px solid var(--border); border-radius:10px; padding:12px; text-align:center;">
                    <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">Score</div>
                    <div id="tetrisScore" style="font-family:'JetBrains Mono',monospace; font-size:1.2rem; font-weight:800; color:var(--primary);">0</div>
                </div>
                <div style="background:var(--surface-alt); border:1px solid var(--border); border-radius:10px; padding:12px; text-align:center;">
                    <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">Niveau</div>
                    <div id="tetrisLevel" style="font-family:'JetBrains Mono',monospace; font-size:1.2rem; font-weight:800; color:var(--primary);">1</div>
                </div>
                <div style="background:var(--surface-alt); border:1px solid var(--border); border-radius:10px; padding:12px; text-align:center;">
                    <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">Suivant</div>
                    <canvas id="tetrisNext" width="80" height="60" style="background:var(--bg); border-radius:6px;"></canvas>
                </div>
            </div>
        </div>
    `;
    controlsContainer.innerHTML = `
        <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:8px; margin-top:12px; max-width:360px; margin-left:auto; margin-right:auto;">
            <button id="tetrisLeft" style="padding:14px; background:var(--primary); color:#fff; border:none; border-radius:10px; font-size:1.2rem; cursor:pointer;">◀</button>
            <button id="tetrisRotate" style="padding:14px; background:var(--warning); color:#fff; border:none; border-radius:10px; font-size:1.2rem; cursor:pointer;">↻</button>
            <button id="tetrisDown" style="padding:14px; background:var(--primary); color:#fff; border:none; border-radius:10px; font-size:1.2rem; cursor:pointer;">▼</button>
            <button id="tetrisRight" style="padding:14px; background:var(--primary); color:#fff; border:none; border-radius:10px; font-size:1.2rem; cursor:pointer;">▶</button>
        </div>
        <button id="tetrisRestart" style="margin-top:10px; padding:10px; width:100%; border-radius:10px; background:var(--surface-alt); color:var(--text); border:1px solid var(--border); font-weight:700; cursor:pointer;">🔄 Nouvelle partie</button>
    `;

    const canvas = document.getElementById('tetrisCanvas');
    const ctx = canvas.getContext('2d');
    const nextCanvas = document.getElementById('tetrisNext');
    const nextCtx = nextCanvas.getContext('2d');

    const COLS = 10, ROWS = 20, CELL = 18;
    const W = COLS * CELL, H = ROWS * CELL;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * DPR; canvas.height = H * DPR;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    const PIECES = [
        { shape: [[1,1,1,1]], color: '#00ffff' },         // I
        { shape: [[1,1],[1,1]], color: '#ffff00' },       // O
        { shape: [[0,1,0],[1,1,1]], color: '#ff00ff' },   // T
        { shape: [[1,0,0],[1,1,1]], color: '#0066ff' },   // J
        { shape: [[0,0,1],[1,1,1]], color: '#ff8800' },   // L
        { shape: [[0,1,1],[1,1,0]], color: '#00ff00' },   // S
        { shape: [[1,1,0],[0,1,1]], color: '#ff0000' }    // Z
    ];

    let grid, current, next, posX, posY, score, level, lines, gameover, rafId, lastDrop, paused;

    function newPiece() {
        const p = PIECES[Math.floor(Math.random() * PIECES.length)];
        return { shape: p.shape.map(r => [...r]), color: p.color };
    }

    function reset() {
        grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
        current = newPiece(); next = newPiece();
        posX = Math.floor((COLS - current.shape[0].length) / 2);
        posY = 0;
        score = 0; level = 1; lines = 0; gameover = false; paused = false;
        lastDrop = performance.now();
        updateStats();
    }

    function updateStats() {
        document.getElementById('tetrisScore').textContent = score;
        document.getElementById('tetrisLevel').textContent = level;
    }

    function collides(shape, offX, offY) {
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    const x = offX + c, y = offY + r;
                    if (x < 0 || x >= COLS || y >= ROWS) return true;
                    if (y >= 0 && grid[y][x]) return true;
                }
            }
        }
        return false;
    }

    function merge() {
        for (let r = 0; r < current.shape.length; r++)
            for (let c = 0; c < current.shape[r].length; c++)
                if (current.shape[r][c]) grid[posY + r][posX + c] = current.color;

        // Clear lines
        let cleared = 0;
        for (let r = ROWS - 1; r >= 0; r--) {
            if (grid[r].every(c => c)) {
                grid.splice(r, 1);
                grid.unshift(Array(COLS).fill(null));
                r++;
                cleared++;
            }
        }
        if (cleared) {
            lines += cleared;
            score += [0, 40, 100, 300, 1200][cleared] * level;
            level = Math.floor(lines / 10) + 1;
            updateStats();
        }

        current = next; next = newPiece();
        posX = Math.floor((COLS - current.shape[0].length) / 2);
        posY = 0;
        if (collides(current.shape, posX, posY)) gameover = true;
    }

    function move(dir) {
        if (gameover || paused) return;
        if (dir === 'left' && !collides(current.shape, posX - 1, posY)) posX--;
        if (dir === 'right' && !collides(current.shape, posX + 1, posY)) posX++;
        if (dir === 'down') {
            if (!collides(current.shape, posX, posY + 1)) posY++;
            else merge();
        }
        if (dir === 'rotate') {
            const rotated = current.shape[0].map((_, i) => current.shape.map(r => r[i]).reverse());
            if (!collides(rotated, posX, posY)) current.shape = rotated;
        }
    }

    function hardDrop() {
        if (gameover || paused) return;
        while (!collides(current.shape, posX, posY + 1)) posY++;
        merge();
    }

    function drawGrid() {
        ctx.fillStyle = '#0a0e1a';
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = 'rgba(0,170,255,0.05)';
        ctx.lineWidth = 1;
        for (let i = 1; i < COLS; i++) { ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, H); ctx.stroke(); }
        for (let i = 1; i < ROWS; i++) { ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(W, i * CELL); ctx.stroke(); }
    }

    function drawCell(ctx, x, y, color, size = CELL) {
        ctx.fillStyle = color;
        ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(x + 1, y + 1, size - 2, 2);
    }

    function draw() {
        drawGrid();
        // Grid pieces
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (grid[r][c]) drawCell(ctx, c * CELL, r * CELL, grid[r][c]);
            }
        }
        // Current piece
        if (current) {
            for (let r = 0; r < current.shape.length; r++)
                for (let c = 0; c < current.shape[r].length; c++)
                    if (current.shape[r][c]) drawCell(ctx, (posX + c) * CELL, (posY + r) * CELL, current.color);
        }

        // Next piece
        nextCtx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg') || '#0a0e1a';
        nextCtx.fillRect(0, 0, 80, 60);
        if (next) {
            const s = 12;
            const ox = (80 - next.shape[0].length * s) / 2;
            const oy = (60 - next.shape.length * s) / 2;
            for (let r = 0; r < next.shape.length; r++)
                for (let c = 0; c < next.shape[r].length; c++)
                    if (next.shape[r][c]) drawCell(nextCtx, ox + c * s, oy + r * s, next.color, s);
        }

        if (gameover) {
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(0, H / 2 - 50, W, 100);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 22px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('💀 Game Over', W / 2, H / 2 - 5);
            ctx.font = '13px Inter, sans-serif';
            ctx.fillStyle = '#94a3b8';
            ctx.fillText(`Score: ${score} · Niveau: ${level}`, W / 2, H / 2 + 22);
            ctx.textAlign = 'left';
        }
    }

    function loop(time) {
        if (!gameover && !paused) {
            const interval = Math.max(100, 800 - (level - 1) * 70);
            if (time - lastDrop > interval) {
                move('down');
                lastDrop = time;
            }
        }
        draw();
        rafId = requestAnimationFrame(loop);
    }

    // Boutons
    document.getElementById('tetrisLeft').addEventListener('click', () => move('left'));
    document.getElementById('tetrisRight').addEventListener('click', () => move('right'));
    document.getElementById('tetrisDown').addEventListener('click', () => move('down'));
    document.getElementById('tetrisRotate').addEventListener('click', () => move('rotate'));
    document.getElementById('tetrisRestart').addEventListener('click', reset);

    function onKey(e) {
        if (e.key === 'ArrowLeft') { e.preventDefault(); move('left'); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); move('right'); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); move('down'); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); move('rotate'); }
        else if (e.key === ' ') { e.preventDefault(); hardDrop(); }
    }
    document.addEventListener('keydown', onKey);

    reset();
    rafId = requestAnimationFrame(loop);

    return {
        stop() { cancelAnimationFrame(rafId); document.removeEventListener('keydown', onKey); }
    };
}
