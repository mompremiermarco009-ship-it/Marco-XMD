module.exports = {
    name: 'flip',
    aliases: ['pileouface', 'coin', 'piece'],
    category: 'game',
    desc: 'Lance une pièce (Pile ou Face)',
    usage: '.flip',

    async execute(sock, msg) {
        const jid = msg.key.remoteJid;
        const cfg = sock.config || {};
        const owner = cfg.ownerName || '𝑀𝑟 𝑀𝑎𝑟𝑐𝑜';

        const result = Math.random() < 0.5 ? 'PILE' : 'FACE';
        const emoji = result === 'PILE' ? '🪙' : '👑';

        const text = `╔════════════════════════╗\n` +
                     `║   🪙  𝐏𝐈𝐋𝐄 𝐎𝐔 𝐅𝐀𝐂𝐄\n` +
                     `╚════════════════════════╝\n\n` +
                     `┃  ${emoji}  Résultat : *${result}*\n\n` +
                     `> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`;

        await sock.sendMessage(jid, { text }, { quoted: msg });
    }
};
