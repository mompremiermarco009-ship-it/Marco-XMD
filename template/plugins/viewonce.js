const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'viewonce',
    aliases: ['vv', 'vo', 'voir'],
    category: 'sticker',
    desc: 'Révèle un média "vue unique"',
    usage: '.viewonce (répondre à un view once)',

    async execute(sock, msg) {
        const jid = msg.key.remoteJid;
        const cfg = sock.config || {};
        const owner = cfg.ownerName || '𝑀𝑟 𝑀𝑎𝑟𝑐𝑜';
        const prefix = cfg.prefix || '.';

        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (!quoted) {
            return sock.sendMessage(jid, {
                text: `╔════════════════════════╗\n` +
                      `║   👁️  𝐕𝐈𝐄𝐖 𝐎𝐍𝐂𝐄\n` +
                      `╚════════════════════════╝\n\n` +
                      `┃  ❌ Répondez à un message\n` +
                      `┃  ┃  "vue unique" avec *${prefix}vv*\n\n` +
                      `> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`
            }, { quoted: msg });
        }

        let viewOnce = quoted.viewOnceMessage?.message || quoted.viewOnceMessageV2?.message || quoted;
        let mediaMsg, type;
        if (viewOnce.imageMessage) { mediaMsg = viewOnce.imageMessage; type = 'image'; }
        else if (viewOnce.videoMessage) { mediaMsg = viewOnce.videoMessage; type = 'video'; }
        else if (viewOnce.audioMessage) { mediaMsg = viewOnce.audioMessage; type = 'audio'; }
        else {
            return sock.sendMessage(jid, { text: '❌ Ce message n\'est pas un "vue unique".' }, { quoted: msg });
        }

        await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } });

        try {
            const buffer = await downloadMediaMessage(
                { message: { [`${type}Message`]: mediaMsg } },
                'buffer',
                { logger: console }
            );

            const caption = `👁️ *View Once révélé*\n\n> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`;
            if (type === 'image') await sock.sendMessage(jid, { image: buffer, caption }, { quoted: msg });
            else if (type === 'video') await sock.sendMessage(jid, { video: buffer, caption }, { quoted: msg });
            else if (type === 'audio') await sock.sendMessage(jid, { audio: buffer, mimetype: 'audio/mpeg' }, { quoted: msg });

            await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });
        } catch (err) {
            console.error('Erreur viewonce:', err.message);
            await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
            await sock.sendMessage(jid, { text: '❌ Erreur lors de la récupération.' }, { quoted: msg });
        }
    }
};
