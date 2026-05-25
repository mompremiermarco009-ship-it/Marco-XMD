// script/calc.js
export default function initCalc(container, controlsContainer) {
    container.innerHTML = `
        <div style="display:inline-block;background:#1a1a1a;padding:10px;border-radius:10px;">
            <input type="text" id="calcDisplay" style="width:100%;padding:10px;font-size:1.5em;text-align:right;background:#222;color:#fff;border:none;margin-bottom:10px;" readonly>
            <div style="display:grid;grid-template-columns:repeat(4,60px);gap:5px;">
                ${['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+','C','(',')','⌫'].map(btn => 
                    `<button class="calc-btn" data-key="${btn}" style="padding:15px;font-size:1.2em;background:rgba(0,255,204,0.1);border:1px solid var(--primary);color:#fff;border-radius:5px;">${btn}</button>`
                ).join('')}
            </div>
        </div>
    `;
    controlsContainer.innerHTML = '';

    const display = document.getElementById('calcDisplay');
    let currentInput = '';

    function updateDisplay() { display.value = currentInput || '0'; }
    updateDisplay();

    container.querySelectorAll('.calc-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.dataset.key;
            if (key === 'C') {
                currentInput = '';
            } else if (key === '⌫') {
                currentInput = currentInput.slice(0, -1);
            } else if (key === '=') {
                try {
                    currentInput = Function('"use strict";return (' + currentInput + ')')() + '';
                } catch {
                    currentInput = 'Erreur';
                }
            } else {
                currentInput += key;
            }
            updateDisplay();
        });
    });

    return {
        stop() {
            // rien à nettoyer
        }
    };
}
