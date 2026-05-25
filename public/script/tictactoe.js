// script/tictactoe.js
import { checkWinner, getBestMove } from './ai.js';

export default function initTicTacToe(container, controlsContainer) {
    let size = 3;
    let mode = 'pvp';

    function showSelection() {
        container.innerHTML = `
            <div style="color:var(--primary); margin-bottom:15px;">
                <p style="font-weight:bold; margin-bottom:10px;">1. Taille du plateau</p>
                <div style="display:flex; gap:10px; justify-content:center;">
                    <button class="size-btn" data-size="3">3×3</button>
                    <button class="size-btn" data-size="4">4×4</button>
                    <button class="size-btn" data-size="5">5×5</button>
                </div>
            </div>
            <div style="color:var(--primary); margin-bottom:20px;">
                <p style="font-weight:bold; margin:20px 0 10px;">2. Mode de jeu</p>
                <div style="display:flex; gap:10px; justify-content:center;">
                    <button class="mode-btn" data-mode="pvp">👤 Joueur vs Joueur</button>
                    <button class="mode-btn" data-mode="pvia">🤖 Joueur vs IA</button>
                </div>
                <p id="iaWarning" style="color:#ff6666; font-size:0.8rem; margin-top:8px;"></p>
            </div>
            <p id="selectionInfo" style="color:var(--text-secondary); margin:15px 0;">Sélection : <strong>3×3</strong> – <strong>Joueur vs Joueur</strong></p>
            <button id="startGameBtn" class="btn-primary" style="max-width:200px;">Lancer la partie</button>
        `;
        controlsContainer.innerHTML = '';

        const sizeBtns = container.querySelectorAll('.size-btn');
        const modeBtns = container.querySelectorAll('.mode-btn');
        const info = container.querySelector('#selectionInfo');
        const startBtn = container.querySelector('#startGameBtn');
        const iaWarning = container.querySelector('#iaWarning');

        function updateUI() {
            const sizeText = size + '×' + size;
            const modeText = (mode === 'pvp') ? 'Joueur vs Joueur' : 'Joueur vs IA';
            info.innerHTML = `Sélection : <strong>${sizeText}</strong> – <strong>${modeText}</strong>`;

            // Style des boutons de taille
            sizeBtns.forEach(b => {
                b.style.background = b.dataset.size == size ? 'var(--primary)' : 'rgba(255,255,255,0.1)';
            });

            // Gestion du mode IA (disponible uniquement en 3×3)
            const pviaBtn = Array.from(modeBtns).find(b => b.dataset.mode === 'pvia');
            if (size !== 3) {
                mode = 'pvp'; // forcer PvP
                if (pviaBtn) {
                    pviaBtn.disabled = true;
                    pviaBtn.style.opacity = '0.5';
                    pviaBtn.style.cursor = 'not-allowed';
                }
                iaWarning.textContent = '🤖 IA disponible uniquement en 3×3';
            } else {
                if (pviaBtn) {
                    pviaBtn.disabled = false;
                    pviaBtn.style.opacity = '1';
                    pviaBtn.style.cursor = 'pointer';
                }
                iaWarning.textContent = '';
            }

            // Style des boutons de mode
            modeBtns.forEach(b => {
                if (b.dataset.mode === mode && !b.disabled) {
                    b.style.background = 'var(--primary)';
                } else {
                    b.style.background = 'rgba(255,255,255,0.1)';
                }
            });
        }

        sizeBtns.forEach(b => b.addEventListener('click', () => {
            size = parseInt(b.dataset.size);
            updateUI();
        }));
        modeBtns.forEach(b => b.addEventListener('click', () => {
            if (b.disabled) return;
            mode = b.dataset.mode;
            updateUI();
        }));
        startBtn.addEventListener('click', () => startGame(size, mode));

        updateUI();
    }

    function startGame(boardSize, gameMode) {
        const totalCells = boardSize * boardSize;
        let board = Array(totalCells).fill(null);
        let currentPlayer = '❌';
        let gameOver = false;
        const cellSize = boardSize <= 3 ? 80 : boardSize === 4 ? 65 : 50;

        container.innerHTML = `<div id="tttGrid" style="display:grid;grid-template-columns:repeat(${boardSize},${cellSize}px);gap:5px;justify-content:center;margin-top:10px;"></div>`;
        controlsContainer.innerHTML = '<button id="restartTTT">🔄 Rejouer</button>';

        const grid = document.getElementById('tttGrid');
        for (let i = 0; i < totalCells; i++) {
            const cell = document.createElement('div');
            cell.className = 'ttt-cell';
            cell.dataset.index = i;
            cell.style = `width:${cellSize}px;height:${cellSize}px;background:#1a1a1a;border:1px solid var(--primary);display:flex;align-items:center;justify-content:center;font-size:${cellSize*0.6}px;cursor:pointer;`;
            cell.addEventListener('click', () => playerMove(i, cell));
            grid.appendChild(cell);
        }

        document.getElementById('restartTTT').addEventListener('click', () => {
            showSelection();
        });

        function playerMove(idx, cell) {
            if (gameOver || board[idx] !== null || (gameMode === 'pvia' && currentPlayer === '⭕')) return;
            makeMove(idx, currentPlayer, cell);
            if (!gameOver) {
                currentPlayer = currentPlayer === '❌' ? '⭕' : '❌';
                if (gameMode === 'pvia' && currentPlayer === '⭕') {
                    setTimeout(botMove, 300);
                }
            }
        }

        function botMove() {
            if (gameOver) return;
            const move = getBestMove(board, '⭕', '❌', boardSize);
            if (move !== undefined && board[move] === null) {
                const cell = document.querySelectorAll('.ttt-cell')[move];
                makeMove(move, '⭕', cell);
                if (!gameOver) currentPlayer = '❌';
            }
        }

        function makeMove(idx, symbol, cell) {
            board[idx] = symbol;
            cell.textContent = symbol;
            if (checkWinner(board, symbol, boardSize)) {
                gameOver = true;
                controlsContainer.innerHTML += `<p style="color:#0f0;">${symbol} a gagné !</p>`;
            } else if (board.every(cell => cell !== null)) {
                gameOver = true;
                controlsContainer.innerHTML += '<p style="color:#fff;">Match nul</p>';
            }
        }
    }

    showSelection();

    return {
        stop() {}
    };
}
