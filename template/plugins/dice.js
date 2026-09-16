module.exports = {
    name: 'dice',
    aliases: ['de', 'dé', 'roll'],
    category: 'game',
    desc: 'Lance un dé (1-6)',
    usage: '.dice',

    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        const cfg = sock.config || {};
        const owner = cfg.ownerName || '𝑀𝑟 𝑀𝑎𝑟𝑐𝑜';

        // Nombre de faces (par défaut 6)
        const faces = Math.min(Math.max(parseInt(args[0]) || 6, 2), 100);
        const result = Math.floor(Math.random() * faces) + 1;

        const emojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
        const diceEmoji = faces === 6 ? emojis[result - 1] : '🎲';

        const text = `╔════════════════════════╗\n` +
                     `║   🎲  𝐃𝐄́\n` +
                     `╚════════════════════════╝\n\n` +
                     `┃  🎯  Faces : ${faces}\n` +
                     `┃  ${diceEmoji}  Résultat : *${result}*\n\n` +
                     `> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`;

        await sock.sendMessage(jid, { text }, { quoted: msg });
    }
};
