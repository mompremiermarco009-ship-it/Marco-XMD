const { isAuthorized, isGroupAdmin, isBotAdmin } = require('../utils/auth');

module.exports = {
    name: 'open',
    aliases: ['ouvrir', 'unmute', 'unlock'],
    category: 'group',
    desc: 'Ouvre le groupe (tout le monde peut parler)',
    usage: '.open',

    async execute(sock, msg) {
        const jid = msg.key.remoteJid;
        const cfg = sock.config || {};
        const owner = cfg.ownerName || '𝑀𝑟 𝑀𝑎𝑟𝑐𝑜';

        if (!jid.endsWith('@g.us')) return;

        const senderJid = msg.key.participant || msg.key.remoteJid;
        const senderAdmin = await isGroupAdmin(sock, jid, senderJid);
        const isOwner = isAuthorized(sock, msg, cfg);
        const botAdmin = await isBotAdmin(sock, jid);

        if (!senderAdmin && !isOwner) return sock.sendMessage(jid, { text: '❌ Vous devez être admin.' }, { quoted: msg });
        if (!botAdmin) return sock.sendMessage(jid, { text: '❌ Je dois être admin.' }, { quoted: msg });

        try {
            await sock.groupSettingUpdate(jid, 'not_announcement');
            const text = `╔════════════════════════╗\n` +
                         `║   🔓  𝐆𝐑𝐎𝐔𝐏𝐄 𝐎𝐔𝐕𝐄𝐑𝐓\n` +
                         `╚════════════════════════╝\n\n` +
                         `┃  🔓  Tous les membres peuvent parler.\n\n` +
                         `> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`;
            await sock.sendMessage(jid, { text }, { quoted: msg });
        } catch (err) {
            console.error('Erreur open:', err.message);
            await sock.sendMessage(jid, { text: '⚠️ Erreur.' }, { quoted: msg });
        }
    }
};
