// script/tictactoe.js
// Version améliorée : thème cohérent avec le nouveau dashboard, ligne
// gagnante surlignée (grâce au correctif de ai.js), animation de pose des
// symboles, effet de survol sur les cases libres.
import { checkWinner, getWinningLine, getBestMove } from './ai.js';

export default function initTicTacToe(container, controlsContainer) {
    let size = 3;
    let mode = 'pvp';

    function showSelection() {
        container.innerHTML = `
            <div style="margin-bottom:15px;">
                <p style="font-weight:700; margin-bottom:10px; color:#111827;">1. Taille du plateau</p>
                <div style="display:flex; gap:10px; justify-content:center;">
                    <button class="size-btn" data-size="3">3×3</button>
                    <button class="size-btn" data-size="4">4×4</button>
                    <button class="size-btn" data-size="5">5×5</button>
                </div>
            </div>
            <div style="margin-bottom:20px;">
                <p style="font-weight:700; margin:20px 0 10px; color:#111827;">2. Mode de jeu</p>
                <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
                    <button class="mode-btn" data-mode="pvp">👤 Joueur vs Joueur</button>
                    <button class="mode-btn" data-mode="pvia">🤖 Joueur vs IA</button>
                </div>
                <p id="iaWarning" style="color:#ef4444; font-size:0.8rem; margin-top:8px;"></p>
            </div>
            <p id="selectionInfo" style="color:#6b7280; margin:15px 0;">Sélection : <strong>3×3</strong> – <strong>Joueur vs Joueur</strong></p>
            <button id="startGameBtn" style="background:#3b82f6; color:#fff; border:none; padding:10px 24px; border-radius:8px; font-weight:700; cursor:pointer;">Lancer la partie</button>
        `;
        controlsContainer.innerHTML = '';

        const sizeBtns = container.querySelectorAll('.size-btn');
        const modeBtns = container.querySelectorAll('.mode-btn');
        const info = container.querySelector('#selectionInfo');
        const startBtn = container.querySelector('#startGameBtn');
        const iaWarning = container.querySelector('#iaWarning');

        container.querySelectorAll('.size-btn, .mode-btn').forEach(b => {
            b.style.cssText += 'padding:10px 16px;border-radius:8px;border:1px solid #e5e7eb;background:#f9fafb;color:#111827;cursor:pointer;font-weight:600;';
        });

        function updateUI() {
            const sizeText = size + '×' + size;
            const modeText = (mode === 'pvp') ? 'Joueur vs Joueur' : 'Joueur vs IA';
            info.innerHTML = `Sélection : <strong>${sizeText}</strong> – <strong>${modeText}</strong>`;

            sizeBtns.forEach(b => {
                const active = b.dataset.size == size;
                b.style.background = active ? '#3b82f6' : '#f9fafb';
                b.style.color = active ? '#fff' : '#111827';
                b.style.borderColor = active ? '#3b82f6' : '#e5e7eb';
            });

            const pviaBtn = Array.from(modeBtns).find(b => b.dataset.mode === 'pvia');
            if (size !== 3) {
                mode = 'pvp';
                if (pviaBtn) { pviaBtn.disabled = true; pviaBtn.style.opacity = '0.5'; pviaBtn.style.cursor = 'not-allowed'; }
                iaWarning.textContent = '🤖 IA disponible uniquement en 3×3';
            } else {
                if (pviaBtn) { pviaBtn.disabled = false; pviaBtn.style.opacity = '1'; pviaBtn.style.cursor = 'pointer'; }
                iaWarning.textContent = '';
            }

            modeBtns.forEach(b => {
                const active = b.dataset.mode === mode && !b.disabled;
                b.style.background = active ? '#3b82f6' : '#f9fafb';
                b.style.color = active ? '#fff' : '#111827';
                b.style.borderColor = active ? '#3b82f6' : '#e5e7eb';
            });
        }

        sizeBtns.forEach(b => b.addEventListener('click', () => { size = parseInt(b.dataset.size); updateUI(); }));
        modeBtns.forEach(b => b.addEventListener('click', () => { if (b.disabled) return; mode = b.dataset.mode; updateUI(); }));
        startBtn.addEventListener('click', () => startGame(size, mode));

        updateUI();
    }

    function startGame(boardSize, gameMode) {
        const totalCells = boardSize * boardSize;
        let board = Array(totalCells).fill(null);
        let currentPlayer = '❌';
        let gameOver = false;
        const cellSize = boardSize <= 3 ? 80 : boardSize === 4 ? 65 : 50;

        container.innerHTML = `
            <p id="tttTurn" style="font-weight:700; color:#111827; margin-bottom:10px;">Tour de : ❌</p>
            <div id="tttGrid" style="display:grid;grid-template-columns:repeat(${boardSize},${cellSize}px);gap:5px;justify-content:center;"></div>
        `;
        controlsContainer.innerHTML = '<button id="restartTTT" style="width:100%;">🔄 Rejouer</button>';

        const grid = document.getElementById('tttGrid');
        const turnLabel = document.getElementById('tttTurn');
        for (let i = 0; i < totalCells; i++) {
            const cell = document.createElement('div');
            cell.className = 'ttt-cell';
            cell.dataset.index = i;
            cell.style.cssText = `width:${cellSize}px;height:${cellSize}px;background:#fff;border:2px solid #e5e7eb;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:${cellSize * 0.55}px;cursor:pointer;transition:background 0.15s, transform 0.15s;`;
            cell.addEventListener('mouseenter', () => { if (!cell.textContent) cell.style.background = '#eff6ff'; });
            cell.addEventListener('mouseleave', () => { if (!cell.textContent) cell.style.background = '#fff'; });
            cell.addEventListener('click', () => playerMove(i, cell));
            grid.appendChild(cell);
        }

        document.getElementById('restartTTT').addEventListener('click', () => showSelection());

        function playerMove(idx, cell) {
            if (gameOver || board[idx] !== null || (gameMode === 'pvia' && currentPlayer === '⭕')) return;
            makeMove(idx, currentPlayer, cell);
            if (!gameOver) {
                currentPlayer = currentPlayer === '❌' ? '⭕' : '❌';
                turnLabel.textContent = 'Tour de : ' + currentPlayer;
                if (gameMode === 'pvia' && currentPlayer === '⭕') setTimeout(botMove, 300);
            }
        }

        function botMove() {
            if (gameOver) return;
            const move = getBestMove(board, '⭕', '❌', boardSize);
            if (move !== undefined && board[move] === null) {
                const cell = document.querySelectorAll('.ttt-cell')[move];
                makeMove(move, '⭕', cell);
                if (!gameOver) { currentPlayer = '❌'; turnLabel.textContent = 'Tour de : ❌'; }
            }
        }

        function highlightWin(line) {
            const cells = document.querySelectorAll('.ttt-cell');
            line.forEach(i => {
                cells[i].style.background = '#dcfce7';
                cells[i].style.borderColor = '#10b981';
            });
        }

        function makeMove(idx, symbol, cell) {
            board[idx] = symbol;
            cell.textContent = symbol;
            cell.style.color = symbol === '❌' ? '#3b82f6' : '#ef4444';
            cell.style.transform = 'scale(0.3)';
            cell.style.background = '#fff';
            requestAnimationFrame(() => { cell.style.transform = 'scale(1)'; });

            if (checkWinner(board, symbol, boardSize)) {
                gameOver = true;
                const line = getWinningLine(board, symbol, boardSize);
                if (line) highlightWin(line);
                turnLabel.textContent = `🎉 ${symbol} a gagné !`;
            } else if (board.every(c => c !== null)) {
                gameOver = true;
                turnLabel.textContent = '🤝 Match nul';
            }
        }
    }

    showSelection();

    return { stop() {} };
}
