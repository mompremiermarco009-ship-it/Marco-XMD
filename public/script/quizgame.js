export default function initQuizGame(container, controlsContainer) {
    container.innerHTML = '<div id="quizQuestion" style="font-weight:bold; margin-bottom:12px;"></div><div id="quizOptions" style="display:flex; flex-direction:column; gap:8px;"></div><div id="quizScore" style="text-align:center; font-weight:bold; margin-top:10px;">Score: 0</div>';
    controlsContainer.innerHTML = '<button id="quizRestart" style="padding:10px; width:100%; border-radius:10px; background:var(--primary,#3b82f6); color:#fff; border:none; font-weight:bold;">🔄 Nouveau quiz</button>';
    let score = 0, currentQuestion = null;
    async function fetchQuestion() {
        const res = await fetch('https://opentdb.com/api.php?amount=1&type=multiple&lang=fr');
        const data = await res.json();
        if (data.results && data.results[0]) {
            currentQuestion = data.results[0];
            displayQuestion();
        }
    }
    function displayQuestion() {
        const q = currentQuestion;
        document.getElementById('quizQuestion').innerHTML = q.question;
        const answers = [...q.incorrect_answers, q.correct_answer].sort(()=>Math.random()-0.5);
        const optionsDiv = document.getElementById('quizOptions');
        optionsDiv.innerHTML = '';
        answers.forEach(ans => {
            const btn = document.createElement('button');
            btn.textContent = ans;
            btn.style.padding = '10px'; btn.style.borderRadius = '8px'; btn.style.border = '1px solid var(--border,#ccc)';
            btn.style.background = 'var(--surface,#fff)'; btn.style.color = 'var(--text,#000)'; btn.style.cursor = 'pointer';
            btn.addEventListener('click', () => checkAnswer(ans));
            optionsDiv.appendChild(btn);
        });
    }
    function checkAnswer(ans) {
        if (ans === currentQuestion.correct_answer) { score++; document.getElementById('quizScore').textContent = `Score: ${score}`; }
        fetchQuestion();
    }
    fetchQuestion();
    document.getElementById('quizRestart').addEventListener('click', () => { score = 0; document.getElementById('quizScore').textContent = 'Score: 0'; fetchQuestion(); });
    return { stop() {} };
}
