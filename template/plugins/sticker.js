const sharp = require('sharp');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'sticker',
    aliases: ['s', 'stiker', 'stick'],
    category: 'sticker',
    desc: 'Convertit une image en sticker WebP',
    usage: '.sticker (répondre à une image)',

    async execute(sock, msg) {
        const jid = msg.key.remoteJid;
        const cfg = sock.config || {};
        const owner = cfg.ownerName || '𝑀𝑟 𝑀𝑎𝑟𝑐𝑜';
        const prefix = cfg.prefix || '.';

        // Trouver l'image (directe ou citée)
        const m = msg.message;
        const quoted = m?.extendedTextMessage?.contextInfo?.quotedMessage;
        let imgMsg = null;

        if (m?.imageMessage) imgMsg = m.imageMessage;
        else if (quoted?.imageMessage) imgMsg = quoted.imageMessage;

        if (!imgMsg) {
            return sock.sendMessage(jid, {
                text: `╔════════════════════════╗\n` +
                      `║   🎨  𝐒𝐓𝐈𝐂𝐊𝐄𝐑\n` +
                      `╚════════════════════════╝\n\n` +
                      `┃  ❌ Envoyez une image avec\n` +
                      `┃  ┃  la légende *${prefix}sticker*\n` +
                      `┃  ┃  ou répondez à une image.\n\n` +
                      `> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`
            }, { quoted: msg });
        }

        await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } });

        try {
            const stream = await downloadContentFromMessage(imgMsg, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

            // Convertir en WebP 512x512
            const webp = await sharp(buffer)
                .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                .webp({ quality: 90 })
                .toBuffer();

            await sock.sendMessage(jid, {
                sticker: webp,
                packname: cfg.botName || 'MARCO-XMD',
                author: owner
            }, { quoted: msg });

            await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });
        } catch (err) {
            console.error('Erreur sticker:', err.message);
            await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
            await sock.sendMessage(jid, {
                text: `❌ Erreur lors de la création du sticker.\n\n> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`
            }, { quoted: msg });
        }
    }
};
