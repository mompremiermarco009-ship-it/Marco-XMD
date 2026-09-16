export default function initQuizGame(container, controlsContainer) {
    container.innerHTML = `
        <div style="text-align:center; margin-bottom:14px;">
            <div style="font-family:'JetBrains Mono',monospace; font-size:13px; color:var(--text-soft); display:flex; justify-content:space-around;">
                <span>🏆 Score: <span id="quizScore" style="color:var(--primary); font-weight:700;">0</span></span>
                <span>📝 Question: <span id="quizQNum" style="color:var(--warning); font-weight:700;">1</span></span>
            </div>
        </div>
        <div id="quizProgress" style="height:4px; background:var(--border); border-radius:2px; margin-bottom:18px; overflow:hidden;">
            <div id="quizProgressBar" style="height:100%; background:linear-gradient(90deg, var(--primary), var(--primary-light)); width:0%; transition:width 0.3s;"></div>
        </div>
        <div id="quizLoading" style="text-align:center; padding:40px;">
            <div style="display:inline-block; width:36px; height:36px; border:4px solid var(--border); border-top-color:var(--primary); border-radius:50%; animation:spin 0.8s linear infinite;"></div>
            <p style="margin-top:12px; color:var(--text-soft);">Chargement...</p>
        </div>
        <div id="quizContent" style="display:none;"></div>
    `;
    controlsContainer.innerHTML = `<button id="quizRestart" style="margin-top:12px; padding:12px; width:100%; border-radius:10px; background:var(--surface-alt); color:var(--text); border:1px solid var(--border); font-weight:700; cursor:pointer;">🔄 Nouvelle partie</button>`;

    const questions = [
        { q: "Quelle est la capitale de la France ?", a: ["Paris", "Lyon", "Marseille", "Lille"], correct: 0 },
        { q: "Combien de continents y a-t-il ?", a: ["5", "6", "7", "8"], correct: 2 },
        { q: "Qui a peint la Joconde ?", a: ["Van Gogh", "Picasso", "Léonard de Vinci", "Monet"], correct: 2 },
        { q: "Quel est le plus grand océan ?", a: ["Atlantique", "Indien", "Arctique", "Pacifique"], correct: 3 },
        { q: "En quelle année a eu lieu la Révolution française ?", a: ["1776", "1789", "1799", "1815"], correct: 1 },
        { q: "Quel est l'élément chimique de symbole O ?", a: ["Or", "Oxygène", "Osmium", "Ozone"], correct: 1 },
        { q: "Qui a écrit 'Les Misérables' ?", a: ["Balzac", "Victor Hugo", "Zola", "Flaubert"], correct: 1 },
        { q: "Combien de côtés a un hexagone ?", a: ["5", "6", "7", "8"], correct: 1 },
        { q: "Quelle est la langue la plus parlée au monde ?", a: ["Anglais", "Chinois", "Espagnol", "Hindi"], correct: 1 },
        { q: "Qui a inventé le téléphone ?", a: ["Edison", "Bell", "Tesla", "Marconi"], correct: 1 },
        { q: "Quel pays a pour capitale Tokyo ?", a: ["Chine", "Corée", "Japon", "Vietnam"], correct: 2 },
        { q: "Combien de minutes dans une journée ?", a: ["1200", "1440", "1800", "2400"], correct: 1 },
        { q: "Quel est le plus grand mammifère ?", a: ["Éléphant", "Baleine bleue", "Girafe", "Rhinocéros"], correct: 1 },
        { q: "Qui a découvert la pénicilline ?", a: ["Pasteur", "Fleming", "Curie", "Koch"], correct: 1 },
        { q: "Quelle est la monnaie du Japon ?", a: ["Won", "Yuan", "Yen", "Baht"], correct: 2 }
    ];

    let score = 0, qNum = 0, currentQ, shuffledQuestions, answered = false;
    let totalQuestions = 10;

    function shuffle(a) {
        const arr = [...a];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function start() {
        score = 0; qNum = 0; answered = false;
        shuffledQuestions = shuffle(questions).slice(0, totalQuestions);
        document.getElementById('quizScore').textContent = '0';
        document.getElementById('quizQNum').textContent = '1';
        document.getElementById('quizLoading').style.display = 'none';
        document.getElementById('quizContent').style.display = 'block';
        nextQuestion();
    }

    function nextQuestion() {
        if (qNum >= totalQuestions) return endGame();
        currentQ = shuffledQuestions[qNum];
        answered = false;

        document.getElementById('quizQNum').textContent = qNum + 1;
        document.getElementById('quizProgressBar').style.width = `${(qNum / totalQuestions) * 100}%`;

        // Mélanger les réponses
        const answersWithIdx = currentQ.a.map((txt, idx) => ({ txt, idx, correct: idx === currentQ.correct }));
        const shuffled = shuffle(answersWithIdx);

        const content = document.getElementById('quizContent');
        const letters = ['Ⓐ', 'Ⓑ', 'Ⓒ', 'Ⓓ'];
        content.innerHTML = `
            <div style="background:var(--surface-alt); border-radius:14px; padding:20px; margin-bottom:16px;">
                <div style="font-size:1.05rem; font-weight:700; color:var(--text); line-height:1.5;">${currentQ.q}</div>
            </div>
            <div id="quizAnswers" style="display:grid; gap:10px;"></div>
        `;

        const answersEl = document.getElementById('quizAnswers');
        shuffled.forEach((ans, i) => {
            const btn = document.createElement('button');
            btn.style.cssText = `
                display:flex; align-items:center; gap:14px;
                padding:14px 18px;
                background:var(--surface);
                border:1.5px solid var(--border);
                border-radius:12px;
                color:var(--text);
                font-size:0.95rem;
                font-weight:600;
                text-align:left;
                cursor:pointer;
                transition:all 0.2s;
                font-family:inherit;
            `;
            btn.innerHTML = `<span style="font-size:1.4rem; color:var(--primary);">${letters[i]}</span> <span>${ans.txt}</span>`;
            btn.addEventListener('mouseenter', () => { if (!answered) btn.style.borderColor = 'var(--primary)'; });
            btn.addEventListener('mouseleave', () => { if (!answered) btn.style.borderColor = 'var(--border)'; });
            btn.addEventListener('click', () => answer(ans.correct, btn));
            answersEl.appendChild(btn);
        });
    }

    function answer(isCorrect, btn) {
        if (answered) return;
        answered = true;

        if (isCorrect) {
            btn.style.background = 'rgba(16,185,129,0.15)';
            btn.style.borderColor = 'var(--success)';
            btn.style.color = 'var(--success)';
            score++;
            document.getElementById('quizScore').textContent = score;
        } else {
            btn.style.background = 'rgba(239,68,68,0.15)';
            btn.style.borderColor = 'var(--danger)';
            btn.style.color = 'var(--danger)';

            // Montrer la bonne réponse
            const answers = document.querySelectorAll('#quizAnswers button');
            answers.forEach(b => {
                // On ne sait pas laquelle est la bonne ici, donc on désactive les autres
                b.style.pointerEvents = 'none';
                b.style.opacity = '0.5';
            });
            btn.style.opacity = '1';
        }

        document.querySelectorAll('#quizAnswers button').forEach(b => {
            b.style.pointerEvents = 'none';
        });

        qNum++;
        setTimeout(nextQuestion, 900);
    }

    function endGame() {
        document.getElementById('quizProgressBar').style.width = '100%';

        const content = document.getElementById('quizContent');
        const pct = Math.round((score / totalQuestions) * 100);
        let emoji = '📚';
        let msg = 'Continuez à vous entraîner !';
        if (pct === 100) { emoji = '🏆'; msg = 'Parfait !'; }
        else if (pct >= 80) { emoji = '🎉'; msg = 'Excellent !'; }
        else if (pct >= 60) { emoji = '👍'; msg = 'Bien joué !'; }
        else if (pct >= 40) { emoji = '📖'; msg = 'Pas mal !'; }

        content.innerHTML = `
            <div style="text-align:center; padding:30px 20px;">
                <div style="font-size:3.5rem; margin-bottom:12px;">${emoji}</div>
                <div style="font-size:2rem; font-weight:900; color:var(--primary); margin-bottom:6px;">${score} / ${totalQuestions}</div>
                <div style="font-size:1rem; color:var(--text-soft); margin-bottom:20px;">${msg} (${pct}%)</div>
                <div style="height:8px; background:var(--border); border-radius:4px; overflow:hidden; max-width:300px; margin:0 auto;">
                    <div style="height:100%; background:linear-gradient(90deg, var(--primary), var(--primary-light)); width:${pct}%;"></div>
                </div>
            </div>
        `;
    }

    document.getElementById('quizRestart').addEventListener('click', start);
    start();

    return { stop() {} };
}
