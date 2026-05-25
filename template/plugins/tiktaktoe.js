// plugins/tiktaktoe.js
const games = new Map(); // Stockage des parties en cours par chat

// Affichage de la grille
function renderBoard(board, showNumbers = false) {
    const getCell = (i, j) => {
        const idx = i * 3 + j;
        if (showNumbers) {
            const labels = ['A1','A2','A3','B1','B2','B3','C1','C2','C3'];
            return board[idx] || labels[idx];
        }
        return board[idx] || ' ';
    };
    return (
        `    1   2   3\n` +
        `  ┌───┬───┬───┐\n` +
        `A │ ${getCell(0,0)} │ ${getCell(0,1)} │ ${getCell(0,2)} │\n` +
        `  ├───┼───┼───┤\n` +
        `B │ ${getCell(1,0)} │ ${getCell(1,1)} │ ${getCell(1,2)} │\n` +
        `  ├───┼───┼───┤\n` +
        `C │ ${getCell(2,0)} │ ${getCell(2,1)} │ ${getCell(2,2)} │\n` +
        `  └───┴───┴───┘`
    );
}

// Vérifie si un joueur a gagné
function checkWin(board, player) {
    const lines = [
        [0,1,2],[3,4,5],[6,7,8], // lignes
        [0,3,6],[1,4,7],[2,5,8], // colonnes
        [0,4,8],[2,4,6]          // diagonales
    ];
    return lines.some(l => l.every(i => board[i] === player));
}

// Vérifie si le plateau est plein
function isBoardFull(board) {
    return board.every(c => c !== null);
}

// Convertit une saisie utilisateur (A1, 1A, a1, etc.) en index 0-8
function parseMove(input) {
    if (!input) return null;
    const clean = input.trim().toUpperCase();
    // Patterns possibles : "A1", "1A", "A 1", etc.
    const match = clean.match(/^([A-C])[\s]*([1-3])$/) || clean.match(/^([1-3])[\s]*([A-C])$/);
    if (!match) {
        // Si c'est juste un chiffre 1-9
        if (/^[1-9]$/.test(clean)) return parseInt(clean) - 1;
        return null;
    }
    let row, col;
    if (isNaN(match[1])) {
        row = match[1].charCodeAt(0) - 65; // A=0, B=1, C=2
        col = parseInt(match[2]) - 1;
    } else {
        col = parseInt(match[1]) - 1;
        row = match[2].charCodeAt(0) - 65;
    }
    if (row < 0 || row > 2 || col < 0 || col > 2) return null;
    return row * 3 + col;
}

// Coup aléatoire du bot
function botMove(board) {
    const empty = board.reduce((acc, cell, idx) => {
        if (cell === null) acc.push(idx);
        return acc;
    }, []);
    if (empty.length === 0) return -1;
    return empty[Math.floor(Math.random() * empty.length)];
}

module.exports = {
    name: 'tiktaktoe',
    aliases: ['ttt', 'morpion', 'tictactoe', 'xo'],
    description: 'Joue au Morpion (Tic Tac Toe) contre un autre joueur ou le bot',
    usage: '.ttt @membre (groupe) ou .ttt (privé vs bot)\n.ttt accept (pour accepter un défi)\n.ttt <case> (pour jouer : A1, B3, 5...)',

    async execute(sock, message, args, { config }) {
        const jid = message.key.remoteJid;
        const sender = message.key.participant || message.key.remoteJid;
        const isGroup = jid.endsWith('@g.us');
        const command = args[0]?.toLowerCase();
        
        // --- Fonctions d'envoi rapide ---
        const reply = async (text, opts = {}) => {
            return sock.sendMessage(jid, { text }, { quoted: message, ...opts });
        };
        
        // --- Mode PRIVÉ vs BOT ---
        if (!isGroup) {
            // Démarrer ou jouer en privé contre le bot
            let session = games.get(jid);
            if (!session || session.status === 'ended') {
                // Nouvelle partie contre le bot
                session = {
                    board: Array(9).fill(null),
                    players: { X: sender, O: 'bot' },
                    turn: 'X',
                    status: 'playing',
                    type: 'bot'
                };
                games.set(jid, session);
                await reply(
                    `🎮 *Morpion contre le robot*\n` +
                    `Vous êtes X, le bot est O.\n\n` +
                    renderBoard(session.board, true) +
                    `\n\n👉 Tapez *.ttt <case>* pour jouer (ex: A1, B3, 5).`
                );
                return;
            }

            if (session.status !== 'playing') {
                return reply('❌ Aucune partie en cours. Tapez *.ttt* pour commencer.');
            }

            // Vérifier que c'est bien son tour (le bot ne joue pas pendant le tour du joueur)
            if (session.players[session.turn] !== sender) {
                return reply('⏳ Ce n’est pas votre tour.');
            }

            const moveIdx = parseMove(command);
            if (moveIdx === null || session.board[moveIdx] !== null) {
                return reply('❌ Case invalide ou déjà occupée. Utilisez par exemple A1, B3, 5...');
            }

            // Appliquer le coup du joueur
            session.board[moveIdx] = 'X';
            if (checkWin(session.board, 'X')) {
                session.status = 'ended';
                games.delete(jid);
                await reply(`🎉 *Vous avez gagné !*\n` + renderBoard(session.board));
                return;
            }
            if (isBoardFull(session.board)) {
                session.status = 'ended';
                games.delete(jid);
                await reply(`🤝 *Match nul !*\n` + renderBoard(session.board));
                return;
            }

            // Coup du bot
            session.turn = 'O';
            const botIdx = botMove(session.board);
            setTimeout(async () => {
                if (botIdx === -1) return;
                session.board[botIdx] = 'O';
                if (checkWin(session.board, 'O')) {
                    session.status = 'ended';
                    games.delete(jid);
                    await reply(`😞 *Le bot a gagné.*\n` + renderBoard(session.board));
                    return;
                }
                if (isBoardFull(session.board)) {
                    session.status = 'ended';
                    games.delete(jid);
                    await reply(`🤝 *Match nul !*\n` + renderBoard(session.board));
                    return;
                }
                session.turn = 'X';
                await reply(
                    `🤖 Le bot a joué.\n` +
                    renderBoard(session.board) +
                    `\nÀ votre tour (X).`
                );
            }, 800); // petit délai pour simuler la réflexion
            return;
        }

        // --- Mode GROUPE ---
        const mentions = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        
        // Commande : .ttt accept
        if (['accept', 'accepter', 'oui', 'join'].includes(command)) {
            const session = games.get(jid);
            if (!session || session.status !== 'waiting_accept') {
                return reply('❌ Aucun défi en attente d’acceptation.');
            }
            if (session.challenged !== sender) {
                return reply('❌ Seul le joueur défié peut accepter.');
            }
            // Début de la partie
            session.status = 'playing';
            session.board = Array(9).fill(null);
            session.turn = 'X'; // le challenger commence
            const challengerName = '@' + session.challenger.split('@')[0];
            const challengedName = '@' + session.challenged.split('@')[0];
            await reply(
                `⚔️ *Morpion entre ${challengerName} (X) et ${challengedName} (O)*\n\n` +
                renderBoard(session.board, true) +
                `\n\n👉 ${challengerName} commence. Tapez *.ttt case* pour jouer.`,
                { mentions: [session.challenger, session.challenged] }
            );
            return;
        }

        // Commande sans argument ou avec un argument non reconnu => usage
        if (!command || (!mentions.length && !['accept', 'accepter', 'oui', 'join'].includes(command))) {
            // Si une partie est en cours, on interprète la commande comme un coup
            const session = games.get(jid);
            if (session && session.status === 'playing') {
                // Coup de jeu
                const currentPlayer = session.turn === 'X' ? session.challenger : session.challenged;
                if (sender !== currentPlayer) {
                    return reply('⏳ Ce n’est pas votre tour.');
                }
                const moveIdx = parseMove(command);
                if (moveIdx === null || session.board[moveIdx] !== null) {
                    return reply('❌ Case invalide ou déjà occupée.');
                }
                session.board[moveIdx] = session.turn;
                if (checkWin(session.board, session.turn)) {
                    const winner = session.turn === 'X' ? session.challenger : session.challenged;
                    session.status = 'ended';
                    games.delete(jid);
                    await reply(
                        `🏆 *${'@' + winner.split('@')[0]} a gagné !*\n` + renderBoard(session.board),
                        { mentions: [winner] }
                    );
                    return;
                }
                if (isBoardFull(session.board)) {
                    session.status = 'ended';
                    games.delete(jid);
                    await reply(`🤝 *Match nul !*\n` + renderBoard(session.board));
                    return;
                }
                session.turn = session.turn === 'X' ? 'O' : 'X';
                const nextPlayer = session.turn === 'X' ? session.challenger : session.challenged;
                await reply(
                    `Tour de @${nextPlayer.split('@')[0]} (${session.turn})\n` +
                    renderBoard(session.board),
                    { mentions: [nextPlayer] }
                );
                return;
            } else {
                // Pas de partie en cours, et l'utilisateur n'a pas mentionné de joueur
                return reply(
                    `🎲 *Usage :*\n` +
                    `• En groupe : *.ttt @joueur* pour défier\n` +
                    `• Accepter : *.ttt accept*\n` +
                    `• Jouer : *.ttt A1 / B2 / 5...*`
                );
            }
        }

        // Si on arrive ici, c'est un défi : .ttt @mention
        if (mentions.length > 0) {
            const challenged = mentions[0];
            if (challenged === sender) {
                return reply('❌ Vous ne pouvez pas vous défier vous-même.');
            }
            // Vérifier qu'aucune partie n'est en cours dans ce chat
            if (games.has(jid) && games.get(jid).status !== 'ended') {
                return reply('❌ Une partie est déjà en cours dans ce groupe.');
            }
            // Créer le défi
            games.set(jid, {
                challenger: sender,
                challenged: challenged,
                status: 'waiting_accept',
                type: 'pvp'
            });
            await reply(
                `⚔️ @${challenged.split('@')[0]}, vous êtes défié au *Morpion* par @${sender.split('@')[0]} !\n` +
                `Tapez *.ttt accept* pour jouer.`,
                { mentions: [challenged, sender] }
            );
            // Timeout de 60 secondes pour annuler le défi automatiquement
            setTimeout(() => {
                const s = games.get(jid);
                if (s && s.status === 'waiting_accept' && s.challenged === challenged) {
                    games.delete(jid);
                    sock.sendMessage(jid, { text: '⌛ Défi expiré.' });
                }
            }, 60000);
            return;
        }
    }
};
