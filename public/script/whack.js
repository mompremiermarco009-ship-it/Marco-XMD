export default function initWhack(container, controlsContainer) {
    container.innerHTML = '<div id="whackGrid" style="display:grid; grid-template-columns:repeat(3,1fr); gap:10px; max-width:300px; margin:0 auto;"></div><div id="whackScore" style="text-align:center; font-weight:bold; margin-top:6px;">Score: 0</div>';
    controlsContainer.innerHTML = '<button id="whackRestart" style="padding:10px; width:100%; border-radius:10px; background:var(--primary,#3b82f6); color:#fff; border:none; font-weight:bold;">🔄 Recommencer</button>';
    let score = 0, activeMole = null, gameover = false, timer;
    const holes = Array.from({length:9}, (_,i) => i);
    function drawGrid() {
        const grid = document.getElementById('whackGrid');
        grid.innerHTML = '';
        holes.forEach(i => {
            const hole = document.createElement('div');
            hole.style.aspectRatio = '1';
            hole.style.background = '#6B4226';
            hole.style.borderRadius = '50%';
            hole.style.position = 'relative';
            hole.style.overflow = 'hidden';
            hole.dataset.index = i;
            hole.addEventListener('click', () => whack(i));
            grid.appendChild(hole);
        });
    }
    function showMole() {
        if (gameover) return;
        const idx = holes[Math.floor(Math.random()*holes.length)];
        const hole = document.getElementById('whackGrid').children[idx];
        hole.innerHTML = '<div style="position:absolute; bottom:0; left:50%; transform:translateX(-50%); width:70%; height:70%; background:#8B4513; border-radius:50% 50% 0 0; display:flex; align-items:center; justify-content:center; font-size:20px;">🐹</div>';
        activeMole = idx;
        setTimeout(() => { if (activeMole === idx) { hole.innerHTML = ''; activeMole = null; } }, 800);
    }
    function whack(idx) {
        if (gameover) return;
        if (activeMole === idx) {
            score++;
            document.getElementById('whackScore').textContent = `Score: ${score}`;
            document.getElementById('whackGrid').children[idx].innerHTML = '';
            activeMole = null;
        }
    }
    function start() {
        score = 0; gameover = false; document.getElementById('whackScore').textContent = 'Score: 0';
        drawGrid();
        clearInterval(timer);
        timer = setInterval(showMole, 1000);
        setTimeout(() => { gameover = true; clearInterval(timer); }, 30000);
    }
    document.getElementById('whackRestart').addEventListener('click', start);
    start();
    return { stop() { clearInterval(timer); } };
}
