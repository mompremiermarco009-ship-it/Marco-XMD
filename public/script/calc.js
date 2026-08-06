// script/calc.js
// Optimisations : support du clavier physique, historique des derniers
// calculs, gestion propre des erreurs (division par zéro, NaN/Infinity),
// et une liste blanche de caractères avant évaluation (on n'exécute plus
// n'importe quelle expression tapée).
export default function initCalc(container, controlsContainer) {
    let currentInput = '';
    let history = [];

    container.innerHTML = `
        <div style="display:inline-block;background:#1a1a1a;padding:12px;border-radius:12px;">
            <input type="text" id="calcDisplay" style="width:100%;box-sizing:border-box;padding:12px;font-size:1.6em;text-align:right;background:#222;color:#fff;border:none;border-radius:6px;margin-bottom:10px;" readonly>
            <div style="display:grid;grid-template-columns:repeat(4,60px);gap:6px;">
                ${['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '=', '+', 'C', '(', ')', '⌫'].map(btn =>
                    `<button class="calc-btn" data-key="${btn}" style="padding:15px;font-size:1.2em;background:rgba(59,130,246,0.15);border:1px solid #3b82f6;color:#fff;border-radius:6px;cursor:pointer;">${btn}</button>`
                ).join('')}
            </div>
        </div>
        <div id="calcHistory" style="margin-top:14px; max-width:260px; text-align:left; font-size:12px; color:#6b7280;"></div>
    `;
    controlsContainer.innerHTML = '';

    const display = document.getElementById('calcDisplay');
    const historyEl = document.getElementById('calcHistory');

    // Liste blanche : uniquement chiffres, opérateurs, parenthèses, point.
    // On refuse d'évaluer toute expression qui contiendrait autre chose
    // (lettres, points-virgules, etc.), même si Function() est en mode strict.
    const SAFE_EXPR = /^[0-9+\-*/.() ]*$/;

    function updateDisplay() { display.value = currentInput || '0'; }

    function renderHistory() {
        historyEl.innerHTML = history.slice(-4).reverse().map(h => `<div>${h}</div>`).join('');
    }

    function computeResult() {
        if (!SAFE_EXPR.test(currentInput)) return 'Erreur';
        try {
            const result = Function('"use strict";return (' + currentInput + ')')();
            if (typeof result !== 'number' || !isFinite(result)) return 'Erreur';
            // Arrondi pour éviter les longues décimales flottantes (0.1+0.2 etc.)
            return Math.round(result * 1e10) / 1e10;
        } catch {
            return 'Erreur';
        }
    }

    function pressKey(key) {
        if (key === 'C') {
            currentInput = '';
        } else if (key === '⌫') {
            currentInput = currentInput.slice(0, -1);
        } else if (key === '=') {
            const expr = currentInput;
            const result = computeResult();
            if (result !== 'Erreur' && expr) {
                history.push(`${expr} = ${result}`);
                renderHistory();
            }
            currentInput = String(result);
        } else {
            currentInput += key;
        }
        updateDisplay();
    }

    container.querySelectorAll('.calc-btn').forEach(btn => {
        btn.addEventListener('click', () => pressKey(btn.dataset.key));
    });

    // Support du clavier physique
    function keyHandler(e) {
        if (/[0-9+\-*/.()]/.test(e.key)) { pressKey(e.key); e.preventDefault(); }
        else if (e.key === 'Enter' || e.key === '=') { pressKey('='); e.preventDefault(); }
        else if (e.key === 'Backspace') { pressKey('⌫'); e.preventDefault(); }
        else if (e.key === 'Escape') { pressKey('C'); e.preventDefault(); }
    }
    document.addEventListener('keydown', keyHandler);

    updateDisplay();

    return {
        stop() {
            document.removeEventListener('keydown', keyHandler);
        }
    };
}
