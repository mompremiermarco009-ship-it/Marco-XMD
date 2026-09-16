const { isAuthorized, normalizeNumber, extractTarget } = require('../utils/auth');

module.exports = {
    name: 'block',
    aliases: ['unblock', 'bloquer', 'debloquer'],
    category: 'owner',
    desc: 'Bloque ou débloque un utilisateur',
    usage: '.block @user / .unblock @user',

    async execute(sock, msg, args, cmd) {
        const jid = msg.key.remoteJid;
        const cfg = sock.config || {};
        const owner = cfg.ownerName || '𝑀𝑟 𝑀𝑎𝑟𝑐𝑜';
        const prefix = cfg.prefix || '.';

        if (!isAuthorized(sock, msg, cfg)) {
            return sock.sendMessage(jid, { text: '❌ Réservé au propriétaire.' }, { quoted: msg });
        }

        const isUnblock = ['unblock', 'debloquer', 'débloquer'].includes((cmd || '').toLowerCase());

        let target = extractTarget(msg, args);

        if (!target && !jid.endsWith('@g.us')) {
            target = jid;
        }

        if (!target) {
            return sock.sendMessage(jid, {
                text: `╔════════════════════════╗\n` +
                      `║   ${isUnblock ? '🔓' : '🔒'}  ${isUnblock ? 'UNBLOCK' : 'BLOCK'}\n` +
                      `╚════════════════════════╝\n\n` +
                      `┃  📌 Utilisation :\n` +
                      `┃  • ${prefix}${isUnblock ? 'unblock' : 'block'} @user\n` +
                      `┃  • ${prefix}${isUnblock ? 'unblock' : 'block'} 509xxxxxxxx\n` +
                      `┃  • Répondre à un message\n\n` +
                      `> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`
            }, { quoted: msg });
        }

        const targetNumber = normalizeNumber(target);
        const botNumber = normalizeNumber(sock.user.id);
        const ownerNumber = normalizeNumber(cfg.ownerNumber);

        if (targetNumber === botNumber) {
            return sock.sendMessage(jid, { text: '🚫 Je ne peux pas me bloquer moi-même.' }, { quoted: msg });
        }
        if (targetNumber === ownerNumber) {
            return sock.sendMessage(jid, { text: '🚫 Impossible de bloquer le propriétaire.' }, { quoted: msg });
        }

        try {
            const action = isUnblock ? 'unblock' : 'block';
            await sock.updateBlockStatus(target, action);

            const emoji = isUnblock ? '🔓' : '🔒';
            const label = isUnblock ? 'DÉBLOQUÉ' : 'BLOQUÉ';
            const status = isUnblock ? '✅' : '🚫';

            await sock.sendMessage(jid, {
                text: `╔════════════════════════╗\n` +
                      `║   ${status}  𝐔𝐭𝐢𝐥𝐢𝐬𝐚𝐭𝐞𝐮𝐫 ${label}\n` +
                      `╚════════════════════════╝\n\n` +
                      `┃  ${emoji}  @${targetNumber}\n\n` +
                      `> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`,
                mentions: [target]
            }, { quoted: msg });
        } catch (err) {
            console.error('Erreur block:', err.message);
            await sock.sendMessage(jid, {
                text: `⚠️ Erreur lors du ${isUnblock ? 'déblocage' : 'blocage'}.\n\n> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`
            }, { quoted: msg });
        }
    }
};
