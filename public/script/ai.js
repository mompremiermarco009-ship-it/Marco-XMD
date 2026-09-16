// public/script/ai.js — Module IA (minimax) réutilisable pour jeux de plateau
// Utilisé par tictactoe.js

function generateLines(n) {
    const lines = [];
    // Lignes
    for (let r = 0; r < n; r++) lines.push(Array.from({ length: n }, (_, c) => r * n + c));
    // Colonnes
    for (let c = 0; c < n; c++) lines.push(Array.from({ length: n }, (_, r) => r * n + c));
    // Diagonale \
    lines.push(Array.from({ length: n }, (_, i) => i * n + i));
    // Diagonale /
    lines.push(Array.from({ length: n }, (_, i) => i * n + (n - 1 - i)));
    return lines;
}

export function checkWinner(board, player, boardSize = 3) {
    return generateLines(boardSize).some(line => line.every(i => board[i] === player));
}

export function getWinningLine(board, player, boardSize = 3) {
    return generateLines(boardSize).find(line => line.every(i => board[i] === player)) || null;
}

export function isBoardFull(board) {
    return board.every(c => c !== null);
}

export function getBestMove(board, aiPlayer, humanPlayer, boardSize = 3, maxDepth = 6) {
    const total = boardSize * boardSize;
    let bestScore = -Infinity;
    let move = -1;

    for (let i = 0; i < total; i++) {
        if (board[i] === null) {
            board[i] = aiPlayer;
            const score = minimax(board, 0, false, aiPlayer, humanPlayer, boardSize, maxDepth);
            board[i] = null;
            if (score > bestScore) {
                bestScore = score;
                move = i;
            }
        }
    }
    return move;
}

function minimax(board, depth, isMaximizing, aiPlayer, humanPlayer, boardSize, maxDepth) {
    if (checkWinner(board, aiPlayer, boardSize)) return 10 - depth;
    if (checkWinner(board, humanPlayer, boardSize)) return depth - 10;
    if (isBoardFull(board) || depth >= maxDepth) return 0;

    const total = boardSize * boardSize;

    if (isMaximizing) {
        let best = -Infinity;
        for (let i = 0; i < total; i++) {
            if (board[i] === null) {
                board[i] = aiPlayer;
                best = Math.max(best, minimax(board, depth + 1, false, aiPlayer, humanPlayer, boardSize, maxDepth));
                board[i] = null;
            }
        }
        return best;
    } else {
        let best = Infinity;
        for (let i = 0; i < total; i++) {
            if (board[i] === null) {
                board[i] = humanPlayer;
                best = Math.min(best, minimax(board, depth + 1, true, aiPlayer, humanPlayer, boardSize, maxDepth));
                board[i] = null;
            }
        }
        return best;
    }
}
