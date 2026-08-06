// script/ai.js
// CORRECTIF : les lignes gagnantes étaient codées en dur pour une grille 3×3
// (indices 0 à 8), donc sur les plateaux 4×4/5×5 les victoires n'étaient
// jamais détectées. On génère maintenant les lignes dynamiquement selon la
// taille réelle du plateau.

function generateLines(n) {
    const lines = [];
    for (let r = 0; r < n; r++) lines.push(Array.from({ length: n }, (_, c) => r * n + c)); // lignes
    for (let c = 0; c < n; c++) lines.push(Array.from({ length: n }, (_, r) => r * n + c)); // colonnes
    lines.push(Array.from({ length: n }, (_, i) => i * n + i));           // diagonale \
    lines.push(Array.from({ length: n }, (_, i) => i * n + (n - 1 - i))); // diagonale /
    return lines;
}

export function checkWinner(board, player, boardSize = 3) {
    return generateLines(boardSize).some(line => line.every(i => board[i] === player));
}

// Renvoie les indices de la ligne gagnante (pour l'affichage), ou null.
export function getWinningLine(board, player, boardSize = 3) {
    return generateLines(boardSize).find(line => line.every(i => board[i] === player)) || null;
}

export function getBestMove(board, aiPlayer, humanPlayer, boardSize = 3) {
    const total = boardSize * boardSize;
    let bestScore = -Infinity;
    let move;
    for (let i = 0; i < total; i++) {
        if (board[i] === null) {
            board[i] = aiPlayer;
            const score = minimax(board, 0, false, aiPlayer, humanPlayer, boardSize);
            board[i] = null;
            if (score > bestScore) { bestScore = score; move = i; }
        }
    }
    return move;
}

function minimax(board, depth, isMaximizing, aiPlayer, humanPlayer, boardSize) {
    if (checkWinner(board, aiPlayer, boardSize)) return 10 - depth;
    if (checkWinner(board, humanPlayer, boardSize)) return depth - 10;
    if (board.every(cell => cell !== null)) return 0;

    const total = boardSize * boardSize;
    if (isMaximizing) {
        let best = -Infinity;
        for (let i = 0; i < total; i++) {
            if (board[i] === null) {
                board[i] = aiPlayer;
                best = Math.max(best, minimax(board, depth + 1, false, aiPlayer, humanPlayer, boardSize));
                board[i] = null;
            }
        }
        return best;
    } else {
        let best = Infinity;
        for (let i = 0; i < total; i++) {
            if (board[i] === null) {
                board[i] = humanPlayer;
                best = Math.min(best, minimax(board, depth + 1, true, aiPlayer, humanPlayer, boardSize));
                board[i] = null;
            }
        }
        return best;
    }
}
