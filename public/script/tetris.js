export default function initTetris(container, controlsContainer) {
    container.innerHTML = '<canvas id="tetrisCanvas" class="game-canvas" style="width:100%; max-width:240px; height:360px; background:#111; display:block; margin:0 auto;"></canvas><div id="tetrisScore" style="text-align:center; font-weight:bold; margin-top:6px;">Score: 0</div>';
    controlsContainer.innerHTML = `
        <div style="display:flex; gap:8px; justify-content:center; flex-wrap:wrap; margin-top:8px;">
            <button id="btnLeftT" style="padding:10px 20px; background:var(--primary); color:#fff; border:none; border-radius:8px;">⬅️</button>
            <button id="btnRotate" style="padding:10px 20px; background:#f59e0b; color:#fff; border:none; border-radius:8px;">↻</button>
            <button id="btnRightT" style="padding:10px 20px; background:var(--primary); color:#fff; border:none; border-radius:8px;">➡️</button>
            <button id="btnDown" style="padding:10px 20px; background:#3b82f6; color:#fff; border:none; border-radius:8px;">⬇️</button>
        </div>
        <button id="tetrisRestart" style="margin-top:8px; padding:8px; width:100%; border-radius:8px; background:var(--surface,#333); color:#fff; border:1px solid #555;">🔄 Recommencer</button>`;
    const canvas = document.getElementById('tetrisCanvas'), ctx = canvas.getContext('2d');
    const COLS = 10, ROWS = 20, CELL = 18;
    const W = COLS*CELL, H = ROWS*CELL;
    canvas.width = W; canvas.height = H;
    const PIECES = [
        { shape: [[1,1,1,1]], color: '#0ff' },
        { shape: [[1,1],[1,1]], color: '#ff0' },
        { shape: [[0,1,0],[1,1,1]], color: '#f0f' },
        { shape: [[1,0,0],[1,1,1]], color: '#00f' },
        { shape: [[0,0,1],[1,1,1]], color: '#f80' },
        { shape: [[0,1,1],[1,1,0]], color: '#0f0' },
        { shape: [[1,1,0],[0,1,1]], color: '#f00' },
    ];
    let grid, current, next, score, gameover, posX, posY, rafId, lastDrop;
    function newPiece() { const p = PIECES[Math.floor(Math.random()*PIECES.length)]; return { shape: p.shape.map(r=>[...r]), color: p.color }; }
    function reset() {
        grid = Array.from({length: ROWS}, ()=>Array(COLS).fill(null));
        current = newPiece(); next = newPiece();
        posX = Math.floor((COLS - current.shape[0].length)/2);
        posY = 0;
        score = 0; gameover = false; lastDrop = performance.now();
        document.getElementById('tetrisScore').textContent = 'Score: 0';
    }
    function collides(shape, offX, offY) {
        for (let r=0; r<shape.length; r++)
            for (let c=0; c<shape[r].length; c++)
                if (shape[r][c] && (grid[offY+r]?.[offX+c] !== undefined ? grid[offY+r][offX+c] !== null : true)) return true;
        return false;
    }
    function merge() {
        for (let r=0; r<current.shape.length; r++)
            for (let c=0; c<current.shape[r].length; c++)
                if (current.shape[r][c]) grid[posY+r][posX+c] = current.color;
        let cleared = 0;
        for (let r=ROWS-1; r>=0; r--) {
            if (grid[r].every(cell=>cell)) { grid.splice(r,1); grid.unshift(Array(COLS).fill(null)); r++; cleared++; }
        }
        score += [0,40,100,300,1200][cleared];
        document.getElementById('tetrisScore').textContent = `Score: ${score}`;
        current = next; next = newPiece();
        posX = Math.floor((COLS - current.shape[0].length)/2); posY = 0;
        if (collides(current.shape, posX, posY)) gameover = true;
    }
    function move(dir) {
        if (gameover) return;
        if (dir==='left' && !collides(current.shape, posX-1, posY)) posX--;
        if (dir==='right' && !collides(current.shape, posX+1, posY)) posX++;
        if (dir==='down') {
            if (!collides(current.shape, posX, posY+1)) posY++;
            else merge();
        }
        if (dir==='rotate') {
            const rotated = current.shape[0].map((_,i)=>current.shape.map(r=>r[i]).reverse());
            if (!collides(rotated, posX, posY)) current.shape = rotated;
        }
    }
    function drop() { while (!collides(current.shape, posX, posY+1)) posY++; merge(); }
    function draw() {
        ctx.fillStyle = '#111'; ctx.fillRect(0,0,W,H);
        for (let r=0; r<ROWS; r++) for (let c=0; c<COLS; c++) if (grid[r][c]) { ctx.fillStyle = grid[r][c]; ctx.fillRect(c*CELL+1, r*CELL+1, CELL-2, CELL-2); }
        for (let r=0; r<current.shape.length; r++) for (let c=0; c<current.shape[r].length; c++) if (current.shape[r][c]) { ctx.fillStyle = current.color; ctx.fillRect((posX+c)*CELL+1, (posY+r)*CELL+1, CELL-2, CELL-2); }
        if (gameover) { ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0,0,W,H); ctx.fillStyle = '#fff'; ctx.font = '16px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Game Over', W/2, H/2); }
    }
    function loop(time) {
        if (!gameover && time - lastDrop > 800) { move('down'); lastDrop = time; }
        draw(); rafId = requestAnimationFrame(loop);
    }
    document.getElementById('btnLeftT').addEventListener('click', ()=>move('left'));
    document.getElementById('btnRightT').addEventListener('click', ()=>move('right'));
    document.getElementById('btnDown').addEventListener('click', ()=>move('down'));
    document.getElementById('btnRotate').addEventListener('click', ()=>move('rotate'));
    document.getElementById('tetrisRestart').addEventListener('click', reset);
    window.addEventListener('keydown', e => {
        const map = { ArrowLeft:'left', ArrowRight:'right', ArrowDown:'down', ArrowUp:'rotate', ' ':'drop' };
        if (e.key in map) { e.preventDefault(); map[e.key]==='drop'? drop() : move(map[e.key]); }
    });
    reset(); rafId = requestAnimationFrame(loop);
    return { stop() { cancelAnimationFrame(rafId); } };
}
