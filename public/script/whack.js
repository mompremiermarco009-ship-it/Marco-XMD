export default function initWhack(container, controlsContainer) {
    container.innerHTML = `
        <div style="display:flex; justify-content:space-around; max-width:380px; margin:0 auto 10px; font-family:'JetBrains Mono',monospace; font-size:14px; color:var(--text-soft);">
            <span>🏆 <span id="whackScore" style="color:var(--primary); font-weight:700;">0</span></span>
            <span>⏱️ <span id="whackTime" style="color:var(--warning); font-weight:700;">30</span>s</span>
            <span>🔥 <span id="whackStreak" style="color:var(--danger); font-weight:700;">0</span></span>
        </div>
        <div id="whackGrid" style="display:grid; grid-template-columns:repeat(3, 100px); grid-template-rows:repeat(3, 100px); gap:12px; justify-content:center; max-width:360px; margin:0 auto;"></div>
    `;
    controlsContainer.innerHTML = `<button id="whackStart" style="margin-top:12px; padding:14px; width:100%; border-radius:12px; background:linear-gradient(135deg, var(--primary), var(--primary-dark)); color:#fff; border:none; font-weight:800; font-size:1rem; cursor:pointer;">▶️ DÉMARRER (30s)</button>`;

    let score = 0, streak = 0, best = 0, timeLeft = 30, activeMole = null;
    let timerInterval, moleTimeout, running = false, audioCtx;
    let moleSpeed;

    function beep(freq, dur, type = 'sine', gain = 0.05) {
        try {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            osc.type = type;
            osc.frequency.value = freq;
            g.gain.value = gain;
            osc.connect(g); g.connect(audioCtx.destination);
            osc.start();
            g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
            osc.stop(audioCtx.currentTime + dur);
        } catch {}
    }

    function updateUI() {
        document.getElementById('whackScore').textContent = score;
        document.getElementById('whackTime').textContent = timeLeft;
        document.getElementById('whackStreak').textContent = streak;
    }

    function buildGrid() {
        const grid = document.getElementById('whackGrid');
        grid.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            const hole = document.createElement('div');
            hole.dataset.index = i;
            hole.style.cssText = `
                background: radial-gradient(circle at 50% 80%, #3d2817 0%, #1f1409 60%, #0a0503 100%);
                border-radius: 50%;
                border: 3px solid #1a1a2e;
                box-shadow: inset 0 10px 20px rgba(0,0,0,0.8), 0 4px 10px rgba(0,0,0,0.5);
                position: relative;
                cursor: pointer;
                overflow: hidden;
                transition: transform 0.1s;
            `;
            hole.addEventListener('click', () => whack(i));
            grid.appendChild(hole);
        }
    }

    function showMole() {
        if (!running) return;

        // Retirer l'ancien
        if (activeMole !== null) {
            const prev = document.querySelector(`[data-index="${activeMole}"]`);
            if (prev) {
                const m = prev.querySelector('.mole');
                if (m) {
                    m.style.transform = 'translate(-50%, 100%)';
                    setTimeout(() => m.remove(), 200);
                }
            }
        }

        const idx = Math.floor(Math.random() * 9);
        activeMole = idx;
        const hole = document.querySelector(`[data-index="${idx}"]`);
        if (!hole) return;

        const mole = document.createElement('div');
        mole.className = 'mole';
        mole.style.cssText = `
            position: absolute;
            bottom: 0; left: 50%;
            width: 78%; height: 78%;
            background: linear-gradient(180deg, #b8860b 0%, #8b4513 100%);
            border-radius: 50% 50% 30% 30%;
            transform: translate(-50%, 100%);
            transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
            display: flex; align-items: center; justify-content: center;
            font-size: 2rem;
            box-shadow: 0 -4px 10px rgba(0,0,0,0.4);
        `;
        mole.textContent = '🐹';
        hole.appendChild(mole);

        requestAnimationFrame(() => {
            mole.style.transform = 'translate(-50%, 0%)';
        });

        // Timer pour cacher
        moleSpeed = Math.max(400, 900 - score * 8);
        moleTimeout = setTimeout(() => {
            if (activeMole === idx) {
                mole.style.transform = 'translate(-50%, 100%)';
                setTimeout(() => mole.remove(), 200);
                activeMole = null;
                streak = 0;
                updateUI();
            }
        }, moleSpeed);
    }

    function whack(idx) {
        if (!running) return;
        if (activeMole !== idx) return;

        const hole = document.querySelector(`[data-index="${idx}"]`);
        const mole = hole?.querySelector('.mole');
        if (!mole) return;

        // Animation de hit
        mole.style.background = 'linear-gradient(180deg, #ffcc00, #cc6600)';
        mole.style.transform = 'translate(-50%, 20%) scale(0.8)';
        setTimeout(() => mole.remove(), 150);

        clearTimeout(moleTimeout);
        activeMole = null;

        streak++;
        const bonus = streak >= 3 ? streak : 1;
        score += bonus;
        updateUI();

        beep(600 + streak * 50, 0.08, 'sine', 0.05);

        // Prochain taup plus vite
        setTimeout(showMole, Math.max(200, 500 - score * 5));
    }

    function start() {
        reset();
        running = true;
        timeLeft = 30;
        updateUI();

        timerInterval = setInterval(() => {
            timeLeft--;
            updateUI();
            if (timeLeft <= 0) endGame();
        }, 1000);

        showMole();
    }

    function endGame() {
        running = false;
        clearInterval(timerInterval);
        clearTimeout(moleTimeout);
        document.getElementById('whackStart').textContent = '🔄 REJOUER';
        if (score > best) best = score;

        // Message de fin
        const grid = document.getElementById('whackGrid');
        grid.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:30px; font-family:'JetBrains Mono',monospace;">
                <div style="font-size:2rem; margin-bottom:10px;">🎉</div>
                <div style="font-size:1.5rem; font-weight:800; color:var(--primary); margin-bottom:8px;">${score} points</div>
                <div style="color:var(--text-soft);">Meilleur : ${best}</div>
            </div>
        `;
    }

    function reset() {
        score = 0; streak = 0; timeLeft = 30; activeMole = null;
        updateUI();
        buildGrid();
        document.getElementById('whackStart').textContent = '▶️ DÉMARRER (30s)';
    }

    document.getElementById('whackStart').addEventListener('click', start);
    reset();

    return {
        stop() {
            running = false;
            clearInterval(timerInterval);
            clearTimeout(moleTimeout);
        }
    };
}
