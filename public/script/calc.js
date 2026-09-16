export default function initCalc(container, controlsContainer) {
    container.innerHTML = `
        <div style="max-width:340px; margin:0 auto;">
            <div id="calcDisplay" style="background:var(--surface-alt); border:1px solid var(--border); border-radius:14px; padding:20px; text-align:right; margin-bottom:14px;">
                <div id="calcExpr" style="font-family:'JetBrains Mono',monospace; font-size:0.85rem; color:var(--text-muted); min-height:18px; word-break:break-all;"></div>
                <div id="calcResult" style="font-family:'JetBrains Mono',monospace; font-size:2rem; font-weight:800; color:var(--primary); margin-top:4px; word-break:break-all;">0</div>
            </div>
            <div id="calcPad" style="display:grid; grid-template-columns:repeat(4, 1fr); gap:8px;"></div>
        </div>
    `;
    controlsContainer.innerHTML = '';

    let expr = '', result = '0', lastAns = '0';

    const buttons = [
        { label: 'C', type: 'clear', color: 'var(--warning)' },
        { label: '⌫', type: 'back', color: 'var(--warning)' },
        { label: '%', type: 'op', color: 'var(--primary)' },
        { label: '÷', type: 'op', color: 'var(--primary)' },
        { label: '7', type: 'num' }, { label: '8', type: 'num' }, { label: '9', type: 'num' },
        { label: '×', type: 'op', color: 'var(--primary)' },
        { label: '4', type: 'num' }, { label: '5', type: 'num' }, { label: '6', type: 'num' },
        { label: '-', type: 'op', color: 'var(--primary)' },
        { label: '1', type: 'num' }, { label: '2', type: 'num' }, { label: '3', type: 'num' },
        { label: '+', type: 'op', color: 'var(--primary)' },
        { label: '±', type: 'sign', color: 'var(--warning)' },
        { label: '0', type: 'num' }, { label: '.', type: 'dot' },
        { label: '=', type: 'eq', color: 'var(--success)', wide: true }
    ];

    function buildPad() {
        const pad = document.getElementById('calcPad');
        pad.innerHTML = '';
        buttons.forEach(b => {
            const btn = document.createElement('button');
            btn.textContent = b.label;
            const isNum = b.type === 'num' || b.type === 'dot';
            btn.style.cssText = `
                padding:20px;
                border-radius:14px;
                border:none;
                font-size:1.3rem;
                font-weight:700;
                cursor:pointer;
                font-family:'JetBrains Mono',monospace;
                background:${b.type === 'eq' ? 'linear-gradient(135deg, var(--success), #059669)' : b.color || (isNum ? 'var(--surface-alt)' : 'var(--primary)')};
                color:${b.type === 'eq' || !isNum ? '#fff' : 'var(--text)'};
                box-shadow:0 3px 8px rgba(0,0,0,0.1);
                transition:transform 0.1s;
                ${b.wide ? 'grid-column:span 2;' : ''}
            `;
            btn.addEventListener('mousedown', () => btn.style.transform = 'scale(0.95)');
            btn.addEventListener('mouseup', () => btn.style.transform = 'scale(1)');
            btn.addEventListener('click', () => handleClick(b));
            btn.addEventListener('touchstart', (e) => { e.preventDefault(); btn.style.transform = 'scale(0.95)'; }, { passive: false });
            btn.addEventListener('touchend', (e) => { e.preventDefault(); btn.style.transform = 'scale(1)'; handleClick(b); }, { passive: false });
            pad.appendChild(btn);
        });
    }

    function updateDisplay() {
        document.getElementById('calcExpr').textContent = expr || '';
        document.getElementById('calcResult').textContent = result;
    }

    function handleClick(b) {
        switch (b.type) {
            case 'num':
                if (result === '0' && expr === '') result = b.label;
                else result += b.label;
                break;
            case 'dot':
                if (!result.includes('.')) result += '.';
                break;
            case 'op':
                if (expr !== '' && /[+\-×÷%]\s?$/.test(expr)) {
                    expr = expr.slice(0, -2) + ' ' + b.label + ' ';
                } else {
                    expr += (expr ? ' ' : '') + result + ' ' + b.label + ' ';
                    result = '0';
                }
                break;
            case 'clear':
                expr = ''; result = '0';
                break;
            case 'back':
                if (result.length > 1) result = result.slice(0, -1);
                else result = '0';
                break;
            case 'sign':
                if (result.startsWith('-')) result = result.slice(1);
                else if (result !== '0') result = '-' + result;
                break;
            case 'eq':
                try {
                    const fullExpr = expr + result;
                    const cleaned = fullExpr
                        .replace(/×/g, '*').replace(/÷/g, '/').replace(/%/g, '/100');
                    const r = eval(cleaned);
                    if (r === undefined || isNaN(r) || !isFinite(r)) throw new Error('Invalide');
                    lastAns = String(Math.round(r * 1e10) / 1e10);
                    document.getElementById('calcExpr').textContent = fullExpr + ' =';
                    result = lastAns;
                    expr = '';
                    updateDisplay();
                    return;
                } catch {
                    result = 'Erreur';
                }
                break;
        }
        updateDisplay();
    }

    function onKey(e) {
        if (e.key >= '0' && e.key <= '9') handleClick({ type: 'num', label: e.key });
        else if (e.key === '.') handleClick({ type: 'dot' });
        else if (e.key === '+') handleClick({ type: 'op', label: '+' });
        else if (e.key === '-') handleClick({ type: 'op', label: '-' });
        else if (e.key === '*') handleClick({ type: 'op', label: '×' });
        else if (e.key === '/') { e.preventDefault(); handleClick({ type: 'op', label: '÷' }); }
        else if (e.key === 'Enter' || e.key === '=') handleClick({ type: 'eq' });
        else if (e.key === 'Backspace') handleClick({ type: 'back' });
        else if (e.key === 'Escape') handleClick({ type: 'clear' });
    }
    document.addEventListener('keydown', onKey);

    buildPad();
    updateDisplay();

    return {
        stop() { document.removeEventListener('keydown', onKey); }
    };
}
