import { checkWinner, getWinningLine, isBoardFull, getBestMove } from './ai.js';

export default function initTicTacToe(container, controlsContainer) {
    container.innerHTML = `
        <div id="tttSizeRow" style="display:flex; gap:8px; justify-content:center; margin-bottom:16px; flex-wrap:wrap;">
            <button data-size="3" class="ttt-size-btn" style="padding:8px 16px; border-radius:20px; background:var(--primary); color:#fff; border:none; font-weight:700; cursor:pointer; font-size:0.85rem;">3 × 3</button>
            <button data-size="4" class="ttt-size-btn" style="padding:8px 16px; border-radius:20px; background:var(--surface-alt); color:var(--text); border:1px solid var(--border); font-weight:700; cursor:pointer; font-size:0.85rem;">4 × 4</button>
            <button data-size="5" class="ttt-size-btn" style="padding:8px 16px; border-radius:20px; background:var(--surface-alt); color:var(--text); border:1px solid var(--border); font-weight:700; cursor:pointer; font-size:0.85rem;">5 × 5</button>
        </div>
        <div id="tttStatus" style="text-align:center; margin-bottom:12px; font-weight:700; color:var(--primary); font-family:'JetBrains Mono',monospace; font-size:0.9rem;">Votre tour (X)</div>
        <div id="tttBoard" style="display:grid; justify-content:center; touch-action:manipulation; user-select:none;"></div>
        <div id="tttScore" style="text-align:center; margin-top:14px; font-family:'JetBrains Mono',monospace; font-size:13px; color:var(--text-soft);"></div>
    `;
    controlsContainer.innerHTML = `<button id="tttRestart" style="margin-top:12px; padding:10px; width:100%; border-radius:10px; background:var(--surface-alt); color:var(--text); border:1px solid var(--border); font-weight:700; cursor:pointer;">🔄 Nouvelle partie</button>`;

    let board, gameover, size = 3;
    let playerWins = parseInt(localStorage.getItem('ttt_w') || '0');
    let aiWins = parseInt(localStorage.getItem('ttt_a') || '0');
    let draws = parseInt(localStorage.getItem('ttt_d') || '0');

    const boardEl = document.getElementById('tttBoard');

    function updateScore() {
        document.getElementById('tttScore').textContent = `🏆 Vous: ${playerWins} · 🤖 IA: ${aiWins} · 🤝 Nuls: ${draws}`;
    }

    function render() {
        const cellSize = size === 3 ? 90 : size === 4 ? 70 : 56;
        boardEl.style.gridTemplateColumns = `repeat(${size}, ${cellSize}px)`;
        boardEl.style.gridTemplateRows = `repeat(${size}, ${cellSize}px)`;
        boardEl.style.gap = '8px';
        boardEl.innerHTML = '';

        const winningLine = gameover ? getWinningLine(board, 'X', size) || getWinningLine(board, 'O', size) : null;

        for (let i = 0; i < size * size; i++) {
            const cell = document.createElement('div');
            const isWin = winningLine && winningLine.includes(i);
            const fontSize = size === 3 ? '2.4rem' : size === 4 ? '1.8rem' : '1.4rem';
            cell.style.cssText = `
                background:${isWin ? 'rgba(16,185,129,0.15)' : 'var(--surface-alt)'};
                border:2px solid ${isWin ? 'var(--success)' : 'var(--border)'};
                border-radius:12px;
                display:flex; align-items:center; justify-content:center;
                font-size:${fontSize};
                font-weight:900;
                cursor:${(!board[i] && !gameover) ? 'pointer' : 'default'};
                transition:all 0.15s;
                color:${board[i] === 'X' ? 'var(--primary)' : board[i] === 'O' ? 'var(--danger)' : 'var(--text)'};
            `;
            cell.textContent = board[i] || '';
            if (!board[i] && !gameover) {
                cell.addEventListener('mouseenter', () => cell.style.borderColor = 'var(--primary)');
                cell.addEventListener('mouseleave', () => cell.style.borderColor = 'var(--border)');
                cell.addEventListener('click', () => play(i));
            }
            boardEl.appendChild(cell);
        }
    }

    function play(i) {
        if (gameover || board[i]) return;
        board[i] = 'X';
        render();

        let w = checkWinner(board, 'X', size);
        if (w) return endGame('X');
        if (isBoardFull(board)) return endGame('D');

        document.getElementById('tttStatus').textContent = '🤖 Réflexion...';

        setTimeout(() => {
            const maxDepth = size === 5 ? 3 : size === 4 ? 4 : 9;
            const move = getBestMove(board, 'O', 'X', size, maxDepth);
            if (move !== -1) board[move] = 'O';

            w = checkWinner(board, 'O', size);
            if (w) return endGame('O');
            if (isBoardFull(board)) return endGame('D');

            document.getElementById('tttStatus').textContent = 'Votre tour (X)';
            render();
        }, 200);
    }

    function endGame(w) {
        gameover = true;
        const st = document.getElementById('tttStatus');

        if (w === 'X') {
            playerWins++;
            localStorage.setItem('ttt_w', playerWins);
            st.textContent = '🎉 Vous avez gagné !';
            st.style.color = 'var(--success)';
        } else if (w === 'O') {
            aiWins++;
            localStorage.setItem('ttt_a', aiWins);
            st.textContent = '🤖 IA a gagné !';
            st.style.color = 'var(--danger)';
        } else {
            draws++;
            localStorage.setItem('ttt_d', draws);
            st.textContent = '🤝 Match nul !';
            st.style.color = 'var(--warning)';
        }
        updateScore();
        render();
    }

    function reset() {
        board = Array(size * size).fill(null);
        gameover = false;
        const st = document.getElementById('tttStatus');
        st.textContent = 'Votre tour (X)';
        st.style.color = 'var(--primary)';
        updateScore();
        render();
    }

    document.querySelectorAll('.ttt-size-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            size = parseInt(btn.dataset.size);
            document.querySelectorAll('.ttt-size-btn').forEach(b => {
                b.style.background = 'var(--surface-alt)';
                b.style.color = 'var(--text)';
                b.style.border = '1px solid var(--border)';
            });
            btn.style.background = 'var(--primary)';
            btn.style.color = '#fff';
            btn.style.border = 'none';
            reset();
        });
    });

    document.getElementById('tttRestart').addEventListener('click', reset);
    reset();

    return { stop() {} };
}
