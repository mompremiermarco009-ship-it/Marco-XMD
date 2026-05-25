// script/ai.js
const wins = [
    [0,1,2],[3,4,5],[6,7,8], // lignes
    [0,3,6],[1,4,7],[2,5,8], // colonnes
    [0,4,8],[2,4,6]          // diagonales
];

export function checkWinner(board, player) {
    return wins.some(line => line.every(i => board[i] === player));
}

export function getBestMove(board, aiPlayer, humanPlayer) {
    // Minimax
    let bestScore = -Infinity;
    let move;
    for (let i=0; i<9; i++) {
        if (board[i] === null) {
            board[i] = aiPlayer;
            let score = minimax(board, 0, false, aiPlayer, humanPlayer);
            board[i] = null;
            if (score > bestScore) {
                bestScore = score;
                move = i;
            }
        }
    }
    return move;
}

function minimax(board, depth, isMaximizing, aiPlayer, humanPlayer) {
    if (checkWinner(board, aiPlayer)) return 10 - depth;
    if (checkWinner(board, humanPlayer)) return depth - 10;
    if (board.every(cell => cell !== null)) return 0;

    if (isMaximizing) {
        let best = -Infinity;
        for (let i=0; i<9; i++) {
            if (board[i] === null) {
                board[i] = aiPlayer;
                best = Math.max(best, minimax(board, depth+1, false, aiPlayer, humanPlayer));
                board[i] = null;
            }
        }
        return best;
    } else {
        let best = Infinity;
        for (let i=0; i<9; i++) {
            if (board[i] === null) {
                board[i] = humanPlayer;
                best = Math.min(best, minimax(board, depth+1, true, aiPlayer, humanPlayer));
                board[i] = null;
            }
        }
        return best;
    }
}
