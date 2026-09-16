// Memory : retrouver toutes les paires
const games = new Map();
const EMOJIS = ['🍎', '🍌', '🍇', '🍓', '🍒', '🥝', '🍑', '🥥'];

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function boardDisplay(board) {
    let out = '  ';
    for (let i = 0; i < board.length; i++) {
        out += `${board[i]}  `;
        if ((i + 1) % 4 === 0) out += '\n  ';
    }
    return out;
}

module.exports = {
    name: 'memory',
    aliases: ['memo'],
    category: 'game',
    desc: 'Jeu de Memory (retrouver les paires)',
    usage: '.memory start  /  .memory <1-16>  /  .memory stop',

    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        const cfg = sock.config || {};
        const owner = cfg.ownerName || '𝑀𝑟 𝑀𝑎𝑟𝑐𝑜';
        const sender = msg.key.participant || msg.key.remoteJid;

        const sub = (args[0] || '').toLowerCase();
        const game = games.get(jid);

        if (sub === 'stop') {
            if (game) games.delete(jid);
            return sock.sendMessage(jid, { text: '🛑 Partie terminée.' }, { quoted: msg });
        }

        if (sub === 'start' || !game) {
            const cards = shuffle([...EMOJIS, ...EMOJIS]).map(e => ({ emoji: e, revealed: false, matched: false }));
            games.set(jid, { cards, player: sender, flipped: [], tries: 0 });

            await sock.sendMessage(jid, {
                text: `╔════════════════════════╗\n` +
                      `║   🧠  𝐌𝐄𝐌𝐎𝐑𝐘\n` +
                      `╚════════════════════════╝\n\n` +
                      `┃  @${sender.split('@')[0]}, trouvez\n` +
                      `┃  toutes les paires !\n\n` +
                      `╭━━━〔 🎯 𝐏𝐋𝐀𝐓𝐄𝐀𝐔 (16 cartes) 〕━━━╮\n` +
                      `  1️⃣ 2️⃣ 3️⃣ 4️⃣\n  5️⃣ 6️⃣ 7️⃣ 8️⃣\n  9️⃣ 🔟 1️⃣1️⃣ 1️⃣2️⃣\n  1️⃣3️⃣ 1️⃣4️⃣ 1️⃣5️⃣ 1️⃣6️⃣\n` +
                      `╰━━━━━━━━━━━━━━━━━━━━╯\n\n` +
                      `Jouez avec *.memory <1-16>*\n\n> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`,
                mentions: [sender]
            }, { quoted: msg });
            return;
        }

        // Coup
        const pos = parseInt(sub) - 1;
        if (isNaN(pos) || pos < 0 || pos > 15) {
            return sock.sendMessage(jid, { text: '❌ Position invalide (1-16).' }, { quoted: msg });
        }

        const card = game.cards[pos];
        if (card.revealed || card.matched) {
            return sock.sendMessage(jid, { text: '❌ Carte déjà révélée.' }, { quoted: msg });
        }

        card.revealed = true;
        game.flipped.push(pos);

        // Construire l'affichage
        const display = game.cards.map(c => c.matched ? c.emoji : (c.revealed ? c.emoji : '❓'));

        if (game.flipped.length === 2) {
            game.tries++;
            const [i, j] = game.flipped;
            const c1 = game.cards[i], c2 = game.cards[j];

            if (c1.emoji === c2.emoji) {
                c1.matched = c2.matched = true;
                game.flipped = [];

                const won = game.cards.every(c => c.matched);

                if (won) {
                    games.delete(jid);
                    return sock.sendMessage(jid, {
                        text: `🎉 *Bravo !* Toutes les paires trouvées en *${game.tries} essais* !\n\n> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`
                    }, { quoted: msg });
                }

                return sock.sendMessage(jid, {
                    text: `✅ *Paire trouvée !* (${game.tries} essais)\n\n` +
                          `${boardDisplay(game.cards.map(c => c.matched ? c.emoji : (c.revealed ? c.emoji : '❓')))}\n\n` +
                          `Continuez !\n\n> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`
                }, { quoted: msg });
            } else {
                // Pas de paire : cacher après 2s
                setTimeout(() => {
                    c1.revealed = c2.revealed = false;
                    game.flipped = [];
                    sock.sendMessage(jid, {
                        text: `❌ Pas de paire. Essayez encore !\n\n> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`
                    }).catch(() => {});
                }, 2000);

                return sock.sendMessage(jid, {
                    text: `❌ Pas de paire pour :\n${c1.emoji} et ${c2.emoji}\n\n> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`
                }, { quoted: msg });
            }
        }

        await sock.sendMessage(jid, {
            text: `Révélé : ${card.emoji}\n\n> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`
        }, { quoted: msg });
    }
};
