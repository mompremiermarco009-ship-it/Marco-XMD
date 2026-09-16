export default function initMemory(container, controlsContainer) {
    container.innerHTML = `
        <div id="memInfo" style="text-align:center; margin-bottom:12px; font-family:'JetBrains Mono',monospace; font-size:14px; color:var(--text-soft);">Essais: 0 · Paires: 0/8</div>
        <div id="memBoard" style="display:grid; grid-template-columns:repeat(4, 70px); gap:8px; justify-content:center;"></div>
    `;
    controlsContainer.innerHTML = `<button id="memRestart" style="margin-top:12px; padding:10px; width:100%; border-radius:10px; background:var(--surface-alt); color:var(--text); border:1px solid var(--border); font-weight:700; cursor:pointer;">🔄 Nouvelle partie</button>`;

    const EMOJIS = ['🍎', '🍌', '🍇', '🍓', '🍒', '🥝', '🍑', '🥥'];
    let cards, flipped, matched, tries, locked;

    function shuffle(a) {
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    function reset() {
        cards = shuffle([...EMOJIS, ...EMOJIS]).map(e => ({ emoji: e, revealed: false, matched: false }));
        flipped = []; matched = 0; tries = 0; locked = false;
        draw();
    }

    function draw() {
        const b = document.getElementById('memBoard');
        b.innerHTML = '';
        cards.forEach((c, i) => {
            const cell = document.createElement('div');
            const isVisible = c.revealed || c.matched;
            cell.style.cssText = `
                width:70px; height:70px;
                background:${isVisible ? 'var(--surface)' : 'linear-gradient(135deg, var(--primary), var(--primary-dark))'};
                border:2px solid ${c.matched ? 'var(--success)' : 'var(--border)'};
                border-radius:12px;
                display:flex; align-items:center; justify-content:center;
                font-size:1.8rem;
                cursor:pointer;
                transition:all 0.2s;
                user-select:none;
                ${c.matched ? 'opacity:0.6;' : ''}
            `;
            cell.textContent = isVisible ? c.emoji : '❓';
            if (!isVisible && !locked) cell.addEventListener('click', () => flip(i));
            b.appendChild(cell);
        });
        document.getElementById('memInfo').textContent = `Essais: ${tries} · Paires: ${matched}/8`;
    }

    function flip(i) {
        if (locked || cards[i].revealed || cards[i].matched) return;
        cards[i].revealed = true;
        flipped.push(i);
        draw();

        if (flipped.length === 2) {
            tries++;
            const [a, b] = flipped;
            if (cards[a].emoji === cards[b].emoji) {
                cards[a].matched = cards[b].matched = true;
                matched++;
                flipped = [];
                draw();
                if (matched === 8) {
                    setTimeout(() => {
                        document.getElementById('memInfo').textContent = `🎉 Gagné en ${tries} essais !`;
                    }, 300);
                }
            } else {
                locked = true;
                setTimeout(() => {
                    cards[a].revealed = cards[b].revealed = false;
                    flipped = [];
                    locked = false;
                    draw();
                }, 800);
            }
        }
    }

    document.getElementById('memRestart').addEventListener('click', reset);
    reset();

    return { stop() {} };
}
