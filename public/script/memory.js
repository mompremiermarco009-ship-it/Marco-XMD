// script/memory.js
// Version améliorée : vraie animation de retournement 3D (perspective CSS),
// compteur de coups, chronomètre, et une petite mise en avant (pulse) des
// paires trouvées avant qu'elles ne disparaissent.
export default function initMemory(container, controlsContainer) {
    const emojis = ['🍎', '🍌', '🍒', '🍇', '🍊', '🍋', '🍉', '🍓'];
    let cards, cardElements, flipped, matched, lock, gameActive = true;
    let moves, seconds, timerInterval;

    function build() {
        gameActive = true;
        cards = [...emojis, ...emojis].sort(() => Math.random() - 0.5);
        moves = 0; seconds = 0;
        clearInterval(timerInterval);

        container.innerHTML = `
            <div style="display:flex; justify-content:center; gap:20px; margin-bottom:12px; font-weight:700; color:#111827;">
                <span>🕒 <span id="memTimer">0s</span></span>
                <span>🔁 <span id="memMoves">0</span> coups</span>
            </div>
            <div class="memory-grid" style="display:flex;flex-wrap:wrap;justify-content:center;gap:10px; perspective:600px;"></div>
        `;
        const grid = container.querySelector('.memory-grid');
        cards.forEach((emoji) => {
            const card = document.createElement('div');
            card.className = 'mem-card';
            card.dataset.emoji = emoji;
            card.dataset.state = 'hidden';
            card.style.cssText = 'width:64px;height:64px;cursor:pointer;';
            card.innerHTML = `
                <div class="mem-card-inner" style="position:relative;width:100%;height:100%;transition:transform 0.4s cubic-bezier(.2,.9,.3,1.2);transform-style:preserve-3d;">
                    <div class="mem-face mem-back" style="position:absolute;inset:0;backface-visibility:hidden;border-radius:10px;background:linear-gradient(135deg,#3b82f6,#1e40af);display:flex;align-items:center;justify-content:center;font-size:1.6em;color:#fff;box-shadow:0 2px 6px rgba(0,0,0,0.15);">❓</div>
                    <div class="mem-face mem-front" style="position:absolute;inset:0;backface-visibility:hidden;transform:rotateY(180deg);border-radius:10px;background:#fff;border:2px solid #e5e7eb;display:flex;align-items:center;justify-content:center;font-size:2em;">${emoji}</div>
                </div>`;
            card.addEventListener('click', handleClick);
            grid.appendChild(card);
        });
        cardElements = container.querySelectorAll('.mem-card');
        flipped = [];
        matched = 0;
        lock = false;

        controlsContainer.innerHTML = '<button id="restartMemory" style="width:100%;">🔄 Rejouer</button>';
        document.getElementById('restartMemory').addEventListener('click', restart);

        timerInterval = setInterval(() => {
            if (!gameActive) return;
            seconds++;
            const el = document.getElementById('memTimer');
            if (el) el.textContent = seconds + 's';
        }, 1000);
    }

    function flipCard(card, show) {
        const inner = card.querySelector('.mem-card-inner');
        inner.style.transform = show ? 'rotateY(180deg)' : 'rotateY(0deg)';
        card.dataset.state = show ? 'shown' : 'hidden';
    }

    function handleClick(e) {
        const card = e.currentTarget;
        if (!gameActive || lock || card.dataset.state !== 'hidden' || flipped.length >= 2) return;
        flipCard(card, true);
        flipped.push(card);
        if (flipped.length === 2) {
            lock = true;
            moves++;
            document.getElementById('memMoves').textContent = moves;
            setTimeout(() => {
                const [a, b] = flipped;
                if (a.dataset.emoji === b.dataset.emoji) {
                    a.dataset.state = 'matched'; b.dataset.state = 'matched';
                    [a, b].forEach(c => {
                        const inner = c.querySelector('.mem-card-inner');
                        inner.style.transition = 'transform 0.4s, opacity 0.3s';
                        inner.style.transform += ' scale(1.12)';
                        setTimeout(() => { c.style.opacity = '0.15'; c.style.pointerEvents = 'none'; }, 200);
                    });
                    matched++;
                    if (matched === emojis.length) {
                        gameActive = false;
                        clearInterval(timerInterval);
                        controlsContainer.innerHTML += `<p style="color:#10b981; font-weight:700; margin-top:10px;">🎉 Gagné en ${moves} coups et ${seconds}s !</p>`;
                    }
                } else {
                    flipCard(a, false); flipCard(b, false);
                }
                flipped = [];
                lock = false;
            }, 700);
        }
    }

    function restart() {
        cardElements.forEach(card => card.removeEventListener('click', handleClick));
        build();
    }

    function stop() {
        gameActive = false;
        clearInterval(timerInterval);
        cardElements.forEach(card => card.removeEventListener('click', handleClick));
    }

    build();
    return { stop, restart };
}
