export default function init2048(container, controlsContainer) {
    container.innerHTML = `
        <div id="g2048Score" style="text-align:center; margin-bottom:12px; font-family:'JetBrains Mono',monospace; font-size:15px; color:var(--text); font-weight:700;">Score: 0 · Meilleur: 0</div>
        <div id="g2048Board" style="display:grid; grid-template-columns:repeat(4, 75px); grid-template-rows:repeat(4, 75px); gap:8px; justify-content:center; background:var(--surface-alt); padding:8px; border-radius:14px; touch-action:none; user-select:none;"></div>
    `;
    controlsContainer.innerHTML = `<button id="g2048Restart" style="margin-top:12px; padding:10px; width:100%; border-radius:10px; background:var(--surface-alt); color:var(--text); border:1px solid var(--border); font-weight:700; cursor:pointer;">🔄 Nouvelle partie</button>`;

    let grid, score, best = parseInt(localStorage.getItem('2048_best') || '0');

    const COLORS = {
        2: '#eee4da', 4: '#ede0c8', 8: '#f2b179', 16: '#f59563',
        32: '#f67c5f', 64: '#f65e3b', 128: '#edcf72', 256: '#edcc61',
        512: '#edc850', 1024: '#edc53f', 2048: '#edc22e'
    };

    function reset() {
        grid = Array.from({ length: 4 }, () => Array(4).fill(0));
        score = 0;
        spawn(); spawn();
        draw();
    }

    function spawn() {
        const empty = [];
        grid.forEach((r, i) => r.forEach((c, j) => { if (!c) empty.push([i, j]); }));
        if (!empty.length) return;
        const [i, j] = empty[Math.floor(Math.random() * empty.length)];
        grid[i][j] = Math.random() < 0.9 ? 2 : 4;
    }

    function draw() {
        const b = document.getElementById('g2048Board');
        b.innerHTML = '';
        grid.forEach(row => {
            row.forEach(val => {
                const cell = document.createElement('div');
                const bg = val ? (COLORS[val] || '#3c3a32') : 'var(--surface)';
                const fg = val >= 8 ? '#fff' : '#776e65';
                cell.style.cssText = `
                    background:${bg};
                    color:${fg};
                    border-radius:10px;
                    display:flex; align-items:center; justify-content:center;
                    font-size:${val >= 1024 ? '1.4rem' : val >= 128 ? '1.8rem' : '2.2rem'};
                    font-weight:900;
                    transition:background 0.15s;
                `;
                cell.textContent = val || '';
                b.appendChild(cell);
            });
        });
        document.getElementById('g2048Score').textContent = `Score: ${score} · Meilleur: ${best}`;
    }

    function move(dir) {
        const old = JSON.stringify(grid);
        let rotated = grid.map(r => [...r]);
        for (let t = 0; t < dir; t++) {
            rotated = rotated[0].map((_, i) => rotated.map(r => r[i]).reverse());
        }
        for (let r = 0; r < 4; r++) {
            let row = rotated[r].filter(v => v);
            for (let i = 0; i < row.length - 1; i++) {
                if (row[i] === row[i + 1]) {
                    row[i] *= 2;
                    score += row[i];
                    row.splice(i + 1, 1);
                }
            }
            while (row.length < 4) row.push(0);
            rotated[r] = row;
        }
        for (let t = 0; t < (4 - dir) % 4; t++) {
            rotated = rotated[0].map((_, i) => rotated.map(r => r[i]).reverse());
        }
        grid = rotated;
        if (JSON.stringify(grid) !== old) {
            spawn();
            if (score > best) { best = score; localStorage.setItem('2048_best', best); }
            draw();
        }
    }

    // Swipe
    let sx = 0, sy = 0;
    const board = document.getElementById('g2048Board');
    board.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    board.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].clientX - sx;
        const dy = e.changedTouches[0].clientY - sy;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 25) return;
        if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 1 : 3);
        else move(dy > 0 ? 2 : 0);
    }, { passive: true });

    function onKey(e) {
        if (e.key === 'ArrowLeft') { e.preventDefault(); move(3); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); move(1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); move(0); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); move(2); }
    }
    document.addEventListener('keydown', onKey);

    document.getElementById('g2048Restart').addEventListener('click', reset);
    reset();

    return {
        stop() { document.removeEventListener('keydown', onKey); }
    };
}
