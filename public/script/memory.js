// script/memory.js
export default function initMemory(container, controlsContainer) {
    const emojis = ['🍎','🍌','🍒','🍇','🍊','🍋','🍉','🍓'];
    let cards, cardElements, flipped, matched, lock, gameActive = true;
    let restartHandler;

    function build() {
        gameActive = true;
        cards = [...emojis, ...emojis].sort(() => Math.random() - 0.5);
        container.innerHTML = '<div class="memory-grid" style="display:flex;flex-wrap:wrap;justify-content:center;gap:10px;"></div>';
        const grid = container.querySelector('.memory-grid');
        cards.forEach((emoji, idx) => {
            const div = document.createElement('div');
            div.className = 'card';
            div.dataset.emoji = emoji;
            div.style = 'width:70px;height:70px;background:#333;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:2em;cursor:pointer;';
            div.textContent = '❓';
            div.addEventListener('click', handleClick);
            grid.appendChild(div);
        });
        cardElements = container.querySelectorAll('.card');
        flipped = [];
        matched = 0;
        lock = false;
        controlsContainer.innerHTML = '<button id="restartMemory">🔄 Rejouer</button>';
        document.getElementById('restartMemory').addEventListener('click', restart);
    }

    function handleClick(e) {
        const card = e.currentTarget;
        if (!gameActive || lock || card.textContent !== '❓' || flipped.length >= 2) return;
        card.textContent = card.dataset.emoji;
        flipped.push(card);
        if (flipped.length === 2) {
            lock = true;
            setTimeout(() => {
                if (flipped[0].dataset.emoji === flipped[1].dataset.emoji) {
                    flipped[0].style.visibility = 'hidden';
                    flipped[1].style.visibility = 'hidden';
                    matched++;
                    if (matched === emojis.length) {
                        gameActive = false;
                        controlsContainer.innerHTML += '<p style="color:#0f0;">🎉 Gagné !</p>';
                    }
                } else {
                    flipped[0].textContent = '❓';
                    flipped[1].textContent = '❓';
                }
                flipped = [];
                lock = false;
            }, 700);
        }
    }

    function restart() {
        // Nettoyer les anciens écouteurs
        cardElements.forEach(card => card.removeEventListener('click', handleClick));
        build();
    }

    function stop() {
        gameActive = false;
        cardElements.forEach(card => card.removeEventListener('click', handleClick));
    }

    build();
    return { stop, restart }; // on ne se sert pas de restart ici, stop suffit pour la modale
}
