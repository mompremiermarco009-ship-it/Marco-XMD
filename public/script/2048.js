export default function init2048(container, controlsContainer) {
    container.innerHTML = '<div id="grid2048" style="display:grid; grid-template-columns:repeat(4,1fr); gap:6px; background:#bbada0; padding:8px; border-radius:10px; max-width:300px; margin:0 auto; touch-action:none;"></div><div id="score2048" style="text-align:center; font-weight:bold; margin-top:6px;">Score: 0</div>';
    controlsContainer.innerHTML = '<button id="restart2048" style="padding:10px; width:100%; border-radius:10px; background:var(--primary,#3b82f6); color:#fff; border:none; font-weight:bold;">🔄 Nouvelle partie</button>';
    let grid = Array.from({length:4}, () => Array(4).fill(0));
    let score = 0;
    function drawGrid() {
        const container = document.getElementById('grid2048');
        container.innerHTML = '';
        grid.flat().forEach(val => {
            const cell = document.createElement('div');
            cell.style.aspectRatio = '1';
            cell.style.background = val ? '#eee4da' : '#cdc1b4';
            cell.style.display = 'flex'; cell.style.alignItems = 'center'; cell.style.justifyContent = 'center';
            cell.style.fontWeight = 'bold'; cell.style.fontSize = '24px'; cell.style.borderRadius = '6px';
            cell.textContent = val || '';
            container.appendChild(cell);
        });
        document.getElementById('score2048').textContent = `Score: ${score}`;
    }
    function spawn() {
        let empty = []; grid.forEach((r,i) => r.forEach((c,j) => { if (!c) empty.push([i,j]); }));
        if (empty.length) { const [i,j] = empty[Math.floor(Math.random()*empty.length)]; grid[i][j] = Math.random()<0.9?2:4; }
    }
    function move(dir) {
        let moved = false;
        const rotate = (g, times) => { let n = g.map(r=>[...r]); for (let t=0; t<times; t++) n = n[0].map((_,i) => n.map(r=>r[i]).reverse()); return n; };
        let work = rotate(grid, dir);
        for (let r=0; r<4; r++) {
            let row = work[r].filter(v=>v);
            for (let i=0; i<row.length-1; i++) if (row[i]===row[i+1]) { row[i]*=2; score+=row[i]; row.splice(i+1,1); row.push(0); moved=true; }
            while (row.length<4) row.push(0);
            if (row.some((v,i)=>v!==work[r][i])) moved = true;
            work[r] = row;
        }
        if (moved) { grid = rotate(work, (4-dir)%4); spawn(); drawGrid(); }
    }
    function handleKey(e) {
        const map = { ArrowUp:3, ArrowDown:1, ArrowLeft:2, ArrowRight:0 };
        if (e.key in map) { e.preventDefault(); move(map[e.key]); }
    }
    let touchStart = null;
    container.addEventListener('touchstart', e => { touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY }; });
    container.addEventListener('touchend', e => {
        if (!touchStart) return;
        const dx = e.changedTouches[0].clientX - touchStart.x, dy = e.changedTouches[0].clientY - touchStart.y;
        if (Math.abs(dx) > Math.abs(dy)) move(dx>0?0:2); else move(dy>0?1:3);
        touchStart = null;
    });
    document.addEventListener('keydown', handleKey);
    document.getElementById('restart2048').addEventListener('click', () => { grid = Array.from({length:4},()=>Array(4).fill(0)); score=0; spawn(); spawn(); drawGrid(); });
    spawn(); spawn(); drawGrid();
    return { stop() { document.removeEventListener('keydown', handleKey); } };
}
