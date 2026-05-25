// script/calcgame.js
export default function initCalcGame(container, controlsContainer) {
    let level = 'debutant';
    let timer;
    let timeLeft = 30;
    let score = 0;
    let currentAnswer;
    let gameActive = false;

    function generateOperation() {
        let a, b, op;
        switch(level) {
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
                op = ['+','-','×'][Math.floor(Math.random()*3)];
                break;
            case 'expert':
                a = Math.floor(Math.random() * 100) + 20;
                b = Math.floor(Math.random() * 100) + 20;
                op = ['+','-','×','÷'][Math.floor(Math.random()*4)];
                if (op === '÷') { b = 1 + Math.floor(Math.random() * 9); a = b * (Math.floor(Math.random()*9)+1); }
                break;
        }
        let expression = `${a} ${op} ${b}`;
        currentAnswer = eval(expression);
        return expression;
    }

    function updateUI(expression) {
        document.getElementById('calcExpression').textContent = expression + ' = ?';
        document.getElementById('calcScore').textContent = 'Score : ' + score;
        document.getElementById('calcTimer').textContent = 'Temps restant : ' + timeLeft + 's';
    }

    function startRound() {
        if (!gameActive) return;
        const expr = generateOperation();
        updateUI(expr);
        clearTimeout(timer);
        timer = setTimeout(() => {
            gameActive = false;
            endGame();
        }, 30000);
    }

    function endGame() {
        clearTimeout(timer);
        gameActive = false;
        document.getElementById('calcFeedback').textContent = 'Temps écoulé ! Score final : ' + score;
        document.getElementById('btnStart').classList.remove('hidden');
        document.getElementById('calcInput').classList.add('hidden');
        document.getElementById('btnSubmitCalc').classList.add('hidden');
    }

    function checkAnswer() {
        if (!gameActive) return;
        const input = document.getElementById('calcInput');
        const userAnswer = parseInt(input.value);
        if (userAnswer === currentAnswer) {
            score++;
            document.getElementById('calcFeedback').textContent = 'Correct !';
        } else {
            document.getElementById('calcFeedback').textContent = 'Faux. La réponse était ' + currentAnswer;
        }
        input.value = '';
        startRound();
    }

    container.innerHTML = `
        <div class="input-group">
            <label for="calcLevel">Niveau</label>
            <select id="calcLevel" style="width:100%; background:rgba(255,255,255,0.06); border:1px solid var(--border-color); color:#fff; padding:8px; border-radius:8px;">
                <option value="debutant">Débutant</option>
                <option value="intermediaire">Intermédiaire</option>
                <option value="pro">Pro</option>
                <option value="expert">Expert</option>
            </select>
        </div>
        <div style="margin-bottom:15px;">
            <span id="calcExpression" style="font-size:1.5rem; color:var(--primary);"></span>
        </div>
        <div id="calcTimer" style="color:var(--text-secondary); margin-bottom:10px;"></div>
        <input type="number" id="calcInput" class="hidden" placeholder="Votre réponse" style="width:100%; margin-bottom:10px;">
        <button class="btn-primary hidden" id="btnSubmitCalc">Valider</button>
        <button class="btn-primary" id="btnStart">Démarrer</button>
        <div id="calcScore" style="margin-top:10px; color:var(--text-secondary);"></div>
        <div id="calcFeedback" style="margin-top:10px; color:var(--primary);"></div>
    `;
    controlsContainer.innerHTML = '';

    document.getElementById('btnStart').addEventListener('click', () => {
        level = document.getElementById('calcLevel').value;
        score = 0;
        timeLeft = 30;
        gameActive = true;
        document.getElementById('btnStart').classList.add('hidden');
        document.getElementById('calcInput').classList.remove('hidden');
        document.getElementById('btnSubmitCalc').classList.remove('hidden');
        document.getElementById('calcInput').value = '';
        document.getElementById('calcFeedback').textContent = '';
        startRound();
        // Compte à rebours global (facultatif, on utilise setTimeout)
        const countdown = setInterval(() => {
            timeLeft--;
            document.getElementById('calcTimer').textContent = 'Temps restant : ' + timeLeft + 's';
            if (timeLeft <= 0 || !gameActive) {
                clearInterval(countdown);
            }
        }, 1000);
        // Stocker l'intervalle pour le stopper plus tard
        window._calcCountdown = countdown;
    });

    document.getElementById('btnSubmitCalc').addEventListener('click', checkAnswer);
    document.getElementById('calcInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkAnswer();
    });

    return {
        stop() {
            clearInterval(window._calcCountdown);
            clearTimeout(timer);
            gameActive = false;
        }
    };
}
