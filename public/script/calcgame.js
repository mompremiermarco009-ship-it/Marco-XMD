export default function initCalcGame(container, controlsContainer) {
    container.innerHTML = `
        <div style="display:flex; justify-content:space-around; max-width:380px; margin:0 auto 14px; font-family:'JetBrains Mono',monospace; font-size:13px; color:var(--text-soft);">
            <span>🏆 <span id="cgScore" style="color:var(--primary); font-weight:700;">0</span></span>
            <span>🔥 <span id="cgStreak" style="color:var(--warning); font-weight:700;">0</span></span>
            <span>⏱️ <span id="cgTime" style="color:var(--danger); font-weight:700;">30</span>s</span>
        </div>
        <div style="height:6px; background:var(--border); border-radius:3px; overflow:hidden; max-width:380px; margin:0 auto 20px;">
            <div id="cgTimeBar" style="height:100%; background:linear-gradient(90deg, var(--success), var(--warning), var(--danger)); width:100%; transition:width 1s linear;"></div>
        </div>
        <div id="cgLevel" style="display:flex; gap:8px; justify-content:center; margin-bottom:16px; flex-wrap:wrap;">
            <button data-lvl="easy" class="cg-lvl-btn" style="padding:8px 14px; border-radius:20px; background:var(--primary); color:#fff; border:none; font-weight:700; cursor:pointer; font-size:0.8rem;">Débutant</button>
            <button data-lvl="mid" class="cg-lvl-btn" style="padding:8px 14px; border-radius:20px; background:var(--surface-alt); color:var(--text); border:1px solid var(--border); font-weight:700; cursor:pointer; font-size:0.8rem;">Intermédiaire</button>
            <button data-lvl="hard" class="cg-lvl-btn" style="padding:8px 14px; border-radius:20px; background:var(--surface-alt); color:var(--text); border:1px solid var(--border); font-weight:700; cursor:pointer; font-size:0.8rem;">Expert</button>
        </div>
        <div id="cgQuestion" style="text-align:center; font-size:2rem; font-weight:900; color:var(--primary); margin:24px 0; font-family:'JetBrains Mono',monospace;">— × — = ?</div>
        <div id="cgFeedback" style="text-align:center; font-size:0.95rem; font-weight:700; margin-bottom:16px; min-height:20px;"></div>
        <div id="cgPad" style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; max-width:340px; margin:0 auto;"></div>
    `;
    controlsContainer.innerHTML = `<button id="cgStart" style="margin-top:12px; padding:14px; width:100%; border-radius:12px; background:linear-gradient(135deg, var(--primary), var(--primary-dark)); color:#fff; border:none; font-weight:800; font-size:1rem; cursor:pointer;">▶️ DÉMARRER</button>`;

    let score = 0, streak = 0, best = 0, timeLeft = 30, currentAnswer, currentExpr;
    let running = false, timerInterval, level = 'easy';
    let userInput = '';

    function updateUI() {
        document.getElementById('cgScore').textContent = score;
        document.getElementById('cgStreak').textContent = streak;
        document.getElementById('cgTime').textContent = timeLeft;
        document.getElementById('cgTimeBar').style.width = `${(timeLeft / 30) * 100}%`;
    }

    function buildPad() {
        const pad = document.getElementById('cgPad');
        pad.innerHTML = '';
        const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', 'C', '0', '✓'];
        keys.forEach(k => {
            const btn = document.createElement('button');
            btn.textContent = k;
            const isOk = k === '✓';
            const isClear = k === 'C';
            btn.style.cssText = `
                padding:18px;
                border-radius:12px;
                border:none;
                font-size:1.3rem;
                font-weight:800;
                cursor:pointer;
                font-family:'JetBrains Mono',monospace;
                background:${isOk ? 'linear-gradient(135deg, var(--success), #059669)' : isClear ? 'var(--warning)' : 'var(--surface-alt)'};
                color:${isOk || isClear ? '#fff' : 'var(--text)'};
                box-shadow:0 3px 8px rgba(0,0,0,0.1);
                transition:transform 0.1s;
            `;
            btn.addEventListener('mousedown', () => btn.style.transform = 'scale(0.95)');
            btn.addEventListener('mouseup', () => btn.style.transform = 'scale(1)');
            btn.addEventListener('click', () => pressKey(k));
            btn.addEventListener('touchstart', (e) => { e.preventDefault(); btn.style.transform = 'scale(0.95)'; }, { passive: false });
            btn.addEventListener('touchend', (e) => { e.preventDefault(); btn.style.transform = 'scale(1)'; pressKey(k); }, { passive: false });
            pad.appendChild(btn);
        });
    }

    function pressKey(k) {
        if (!running) return;
        if (k === 'C') { userInput = ''; updateDisplay(); return; }
        if (k === '✓') { submit(); return; }
        if (userInput.length >= 5) return;
        userInput += k;
        updateDisplay();
    }

    function updateDisplay() {
        const q = document.getElementById('cgQuestion');
        if (userInput) q.textContent = `${currentExpr} = ${userInput}`;
        else q.textContent = `${currentExpr} = ?`;
    }

    function generateQuestion() {
        let a, b, op;
        if (level === 'easy') {
            a = Math.floor(Math.random() * 10) + 1;
            b = Math.floor(Math.random() * 10) + 1;
            op = Math.random() < 0.5 ? '+' : '-';
        } else if (level === 'mid') {
            a = Math.floor(Math.random() * 20) + 5;
            b = Math.floor(Math.random() * 20) + 5;
            op = ['+', '-', '×'][Math.floor(Math.random() * 3)];
        } else {
            a = Math.floor(Math.random() * 50) + 10;
            b = Math.floor(Math.random() * 50) + 10;
            op = ['+', '-', '×', '÷'][Math.floor(Math.random() * 4)];
            if (op === '÷') { b = Math.floor(Math.random() * 9) + 1; a = b * (Math.floor(Math.random() * 10) + 1); }
        }
        if (op === '-' && b > a) [a, b] = [b, a];
        if (op === '÷' && a % b !== 0) { a = b * (Math.floor(Math.random() * 10) + 1); }

        let answer;
        if (op === '+') answer = a + b;
        else if (op === '-') answer = a - b;
        else if (op === '×') answer = a * b;
        else answer = a / b;

        currentAnswer = answer;
        currentExpr = `${a} ${op} ${b}`;
        userInput = '';
        updateDisplay();
    }

    function submit() {
        if (userInput === '') return;
        const val = parseFloat(userInput);
        const feedback = document.getElementById('cgFeedback');

        if (val === currentAnswer) {
            streak++;
            const bonus = streak >= 3 ? 2 : 1;
            score += bonus;
            feedback.textContent = streak >= 3 ? `🔥 Série de ${streak} !` : '✅ Correct !';
            feedback.style.color = 'var(--success)';
        } else {
            streak = 0;
            feedback.textContent = `❌ Raté ! Réponse : ${currentAnswer}`;
            feedback.style.color = 'var(--danger)';
        }
        updateUI();
        generateQuestion();
    }

    function start() {
        score = 0; streak = 0; timeLeft = 30; running = true;
        updateUI();
        generateQuestion();
        document.getElementById('cgStart').textContent = '⏸ EN COURS...';
        document.getElementById('cgStart').disabled = true;

        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            timeLeft--;
            updateUI();
            if (timeLeft <= 0) endGame();
        }, 1000);
    }

    function endGame() {
        running = false;
        clearInterval(timerInterval);
        if (score > best) best = score;
        const feedback = document.getElementById('cgFeedback');
        feedback.textContent = `⏱️ Temps écoulé ! Score final : ${score} (meilleur : ${best})`;
        feedback.style.color = 'var(--primary)';
        document.getElementById('cgQuestion').textContent = '🎉 Partie terminée';
        document.getElementById('cgStart').textContent = '🔄 REJOUER';
        document.getElementById('cgStart').disabled = false;
    }

    function reset() {
        score = 0; streak = 0; timeLeft = 30; running = false;
        updateUI();
        document.getElementById('cgQuestion').textContent = 'Prêt ?';
        document.getElementById('cgFeedback').textContent = '';
        document.getElementById('cgStart').textContent = '▶️ DÉMARRER';
        document.getElementById('cgStart').disabled = false;
        clearInterval(timerInterval);
    }

    document.querySelectorAll('.cg-lvl-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            level = btn.dataset.lvl;
            document.querySelectorAll('.cg-lvl-btn').forEach(b => {
                b.style.background = 'var(--surface-alt)';
                b.style.color = 'var(--text)';
                b.style.border = '1px solid var(--border)';
            });
            btn.style.background = 'var(--primary)';
            btn.style.color = '#fff';
            btn.style.border = 'none';
        });
    });

    document.getElementById('cgStart').addEventListener('click', () => {
        if (running) return;
        start();
    });

    function onKey(e) {
        if (!running) return;
        if (e.key >= '0' && e.key <= '9') pressKey(e.key);
        else if (e.key === 'Backspace') { userInput = userInput.slice(0, -1); updateDisplay(); }
        else if (e.key === 'Enter') submit();
        else if (e.key === 'Escape') { userInput = ''; updateDisplay(); }
    }
    document.addEventListener('keydown', onKey);

    buildPad();
    reset();

    return {
        stop() {
            clearInterval(timerInterval);
            document.removeEventListener('keydown', onKey);
        }
    };
}
