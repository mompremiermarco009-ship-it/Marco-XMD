// Morpion multijoueur (2 joueurs dans un groupe)
const games = new Map();

function boardDisplay(b) {
    const c = i => b[i] || '·';
    return `  1 2 3\n1 ${c(0)} ${c(1)} ${c(2)}\n2 ${c(3)} ${c(4)} ${c(5)}\n3 ${c(6)} ${c(7)} ${c(8)}`;
}

function checkWin(b, p) {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    return lines.some(l => l.every(i => b[i] === p));
}

module.exports = {
    name: 'ttt',
    aliases: ['morpion', 'tictactoe'],
    category: 'game',
    desc: 'Joue au Morpion (2 joueurs)',
    usage: '.ttt start @user  /  .ttt <1-9>  /  .ttt stop',

    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        const cfg = sock.config || {};
        const owner = cfg.ownerName || '𝑀𝑟 𝑀𝑎𝑟𝑐𝑜';
        const sender = msg.key.participant || msg.key.remoteJid;

        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: '❌ Uniquement dans un groupe (2 joueurs).' }, { quoted: msg });
        }

        const sub = (args[0] || '').toLowerCase();
        const game = games.get(jid);

        // Stop
        if (sub === 'stop' || sub === 'quitter') {
            if (game) {
                games.delete(jid);
                return sock.sendMessage(jid, { text: '🛑 Partie terminée.' }, { quoted: msg });
            }
            return;
        }

        // Start
        if (sub === 'start' || sub === 'commencer') {
            if (game) return sock.sendMessage(jid, { text: '❌ Une partie est déjà en cours.' }, { quoted: msg });

            const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            if (!mentions[0]) return sock.sendMessage(jid, { text: '❌ Mentionnez un adversaire : *.ttt start @user*' }, { quoted: msg });
            if (mentions[0] === sender) return sock.sendMessage(jid, { text: '❌ Vous ne pouvez pas vous affronter.' }, { quoted: msg });

            games.set(jid, {
                board: Array(9).fill(null),
                players: { X: sender, O: mentions[0] },
                turn: 'X'
            });

            return sock.sendMessage(jid, {
                text: `╔════════════════════════╗\n` +
                      `║   ⭕  𝐌𝐎𝐑𝐏𝐈𝐎𝐍\n` +
                      `╚════════════════════════╝\n\n` +
                      `┃  ❌ *X* : @${sender.split('@')[0]}\n` +
                      `┃  ⭕ *O* : @${mentions[0].split('@')[0]}\n\n` +
                      `╭━━━〔 🎯 𝐏𝐋𝐀𝐓𝐄𝐀𝐔 〕━━━╮\n` +
                      `${boardDisplay(Array(9).fill(null))}\n` +
                      `╰━━━━━━━━━━━━━━━━━━━━╯\n\n` +
                      `À toi @${sender.split('@')[0]} !\nJouez avec *.ttt <1-9>*\n\n` +
                      `> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`,
                mentions: [sender, mentions[0]]
            }, { quoted: msg });
        }

        // Jeu
        if (!game) return sock.sendMessage(jid, { text: '❌ Aucune partie. Tapez *.ttt start @user*' }, { quoted: msg });

        if (game.players[game.turn] !== sender) {
            return sock.sendMessage(jid, { text: `⏳ C'est à @${game.players[game.turn].split('@')[0]} de jouer.`, mentions: [game.players[game.turn]] }, { quoted: msg });
        }

        const pos = parseInt(sub) - 1;
        if (isNaN(pos) || pos < 0 || pos > 8 || game.board[pos]) {
            return sock.sendMessage(jid, { text: '❌ Position invalide (1-9) ou déjà occupée.' }, { quoted: msg });
        }

        game.board[pos] = game.turn;

        if (checkWin(game.board, game.turn)) {
            const winner = game.players[game.turn];
            games.delete(jid);
            return sock.sendMessage(jid, {
                text: `🏆 *Victoire de @${winner.split('@')[0]} !*\n\n${boardDisplay(game.board)}\n\n> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`,
                mentions: [winner]
            }, { quoted: msg });
        }

        if (game.board.every(c => c)) {
            games.delete(jid);
            return sock.sendMessage(jid, {
                text: `🤝 *Match nul !*\n\n${boardDisplay(game.board)}\n\n> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`
            }, { quoted: msg });
        }

        game.turn = game.turn === 'X' ? 'O' : 'X';
        const next = game.players[game.turn];

        await sock.sendMessage(jid, {
            text: `Tour de @${next.split('@')[0]} (${game.turn})\n\n${boardDisplay(game.board)}\n\n> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`,
            mentions: [next]
        }, { quoted: msg });
    }
};
