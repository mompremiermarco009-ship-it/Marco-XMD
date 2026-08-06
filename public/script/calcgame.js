// script/calcgame.js
// CORRECTIF IMPORTANT : l'ancienne version faisait `eval("12 × 7")`. Les
// symboles × et ÷ ne sont PAS des opérateurs JavaScript valides : eval()
// levait une SyntaxError à chaque fois qu'une multiplication ou division
// était générée (donc quasi à chaque partie en mode intermédiaire/pro/expert).
// On calcule maintenant le résultat nous-mêmes, sans eval.
// Ajouts : barre de progression du temps, série de bonnes réponses (streak),
// feedback visuel coloré.
export default function initCalcGame(container, controlsContainer) {
    let level = 'debutant';
    let timer, countdown;
    let timeLeft = 30;
    let score = 0;
    let streak = 0;
    let bestStreak = 0;
    let currentAnswer;
    let gameActive = false;

    function generateOperation() {
        let a, b, op;
        switch (level) {
            case 'debutant':
                a = Math.floor(Math.random() * 10) + 1;
                b = Math.floor(Math.random() * 10) + 1;
                op = Math.random() < 0.5 ? '+' : '-';
                break;
            case 'intermediaire':
                a = Math.floor(Math.random() * 20) + 5;
                b = Math.floor(Math.random() * 20) + 5;
                op = Math.random() < 0.5 ? '+' : (Math.random() < 0.5 ? '-' : '×');
                break;
            case 'pro':
                a = Math.floor(Math.random() * 50) + 10;
                b = Math.floor(Math.random() * 50) + 10;
                op = ['+', '-', '×'][Math.floor(Math.random() * 3)];
                break;
            case 'expert':
            default:
                a = Math.floor(Math.random() * 100) + 20;
                b = Math.floor(Math.random() * 100) + 20;
                op = ['+', '-', '×', '÷'][Math.floor(Math.random() * 4)];
                if (op === '÷') { b = 1 + Math.floor(Math.random() * 9); a = b * (Math.floor(Math.random() * 9) + 1); }
                break;
        }
        // Assure a >= b pour la soustraction afin d'éviter les résultats négatifs déroutants
        if (op === '-' && b > a) [a, b] = [b, a];

        switch (op) {
            case '+': currentAnswer = a + b; break;
            case '-': currentAnswer = a - b; break;
            case '×': currentAnswer = a * b; break;
            case '÷': currentAnswer = a / b; break;
        }
        return `${a} ${op} ${b}`;
    }

    function updateUI(expression) {
        document.getElementById('calcExpression').textContent = expression + ' = ?';
        document.getElementById('calcScore').textContent = `Score : ${score} · Série : ${streak} (meilleure : ${bestStreak})`;
        document.getElementById('calcTimer').textContent = 'Temps restant : ' + timeLeft + 's';
        const bar = document.getElementById('calcProgress');
        if (bar) bar.style.width = Math.max(0, (timeLeft / 30) * 100) + '%';
    }

    function startRound() {
        if (!gameActive) return;
        const expr = generateOperation();
        updateUI(expr);
        clearTimeout(timer);
        timer = setTimeout(() => { gameActive = false; endGame(); }, 30000);
    }

    function endGame() {
        clearTimeout(timer);
        clearInterval(countdown);
        gameActive = false;
        document.getElementById('calcFeedback').textContent = `⏱️ Temps écoulé ! Score final : ${score} (meilleure série : ${bestStreak})`;
        document.getElementById('calcFeedback').style.color = '#3b82f6';
        document.getElementById('btnStart').classList.remove('hidden');
        document.getElementById('calcInput').classList.add('hidden');
        document.getElementById('btnSubmitCalc').classList.add('hidden');
    }

    function checkAnswer() {
        if (!gameActive) return;
        const input = document.getElementById('calcInput');
        const userAnswer = parseFloat(input.value);
        const feedback = document.getElementById('calcFeedback');
        if (userAnswer === currentAnswer) {
            score++; streak++; bestStreak = Math.max(bestStreak, streak);
            feedback.textContent = streak >= 3 ? `🔥 Correct ! Série de ${streak} !` : '✅ Correct !';
            feedback.style.color = '#10b981';
        } else {
            streak = 0;
            feedback.textContent = '❌ Faux. La réponse était ' + currentAnswer;
            feedback.style.color = '#ef4444';
        }
        input.value = '';
        startRound();
    }

    container.innerHTML = `
        <div style="margin-bottom:12px; text-align:left;">
            <label for="calcLevel" style="font-size:13px; font-weight:600; color:#6b7280; display:block; margin-bottom:6px;">Niveau</label>
            <select id="calcLevel" style="width:100%; background:#f9fafb; border:1px solid #e5e7eb; color:#111827; padding:8px; border-radius:8px;">
                <option value="debutant">Débutant (+ / -)</option>
                <option value="intermediaire">Intermédiaire</option>
                <option value="pro">Pro</option>
                <option value="expert">Expert (+ - × ÷)</option>
            </select>
        </div>
        <div style="margin-bottom:12px;">
            <span id="calcExpression" style="font-size:1.6rem; font-weight:700; color:#3b82f6;"></span>
        </div>
        <div style="background:#e5e7eb; border-radius:20px; height:8px; overflow:hidden; margin-bottom:8px;">
            <div id="calcProgress" style="background:#3b82f6; height:100%; width:100%; transition:width 1s linear;"></div>
        </div>
        <div id="calcTimer" style="color:#6b7280; margin-bottom:12px; font-size:13px;"></div>
        <input type="number" id="calcInput" class="hidden" placeholder="Ta réponse" style="width:100%; margin-bottom:10px; padding:10px; border-radius:8px; border:1px solid #e5e7eb; font-size:1.1rem;">
        <button id="btnSubmitCalc" class="hidden" style="width:100%; background:#3b82f6; color:#fff; border:none; padding:10px; border-radius:8px; font-weight:700; margin-bottom:8px;">Valider</button>
        <button id="btnStart" style="width:100%; background:#3b82f6; color:#fff; border:none; padding:10px; border-radius:8px; font-weight:700;">Démarrer</button>
        <div id="calcScore" style="margin-top:12px; color:#6b7280; font-size:14px;"></div>
        <div id="calcFeedback" style="margin-top:8px; font-weight:600;"></div>
    `;
    controlsContainer.innerHTML = '';

    document.getElementById('btnStart').addEventListener('click', () => {
        level = document.getElementById('calcLevel').value;
        score = 0; streak = 0; bestStreak = 0;
        timeLeft = 30;
        gameActive = true;
        document.getElementById('btnStart').classList.add('hidden');
        document.getElementById('calcInput').classList.remove('hidden');
        document.getElementById('btnSubmitCalc').classList.remove('hidden');
        document.getElementById('calcInput').value = '';
        document.getElementById('calcInput').focus();
        document.getElementById('calcFeedback').textContent = '';
        startRound();

        clearInterval(countdown);
        countdown = setInterval(() => {
            timeLeft--;
            const bar = document.getElementById('calcProgress');
            if (bar) bar.style.width = Math.max(0, (timeLeft / 30) * 100) + '%';
            document.getElementById('calcTimer').textContent = 'Temps restant : ' + timeLeft + 's';
            if (timeLeft <= 0 || !gameActive) clearInterval(countdown);
        }, 1000);
    });

    document.getElementById('btnSubmitCalc').addEventListener('click', checkAnswer);
    document.getElementById('calcInput').addEventListener('keypress', (e) => { if (e.key === 'Enter') checkAnswer(); });

    return {
        stop() {
            clearInterval(countdown);
            clearTimeout(timer);
            gameActive = false;
        }
    };
}
