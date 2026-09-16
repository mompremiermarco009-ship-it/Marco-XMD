const sharp = require('sharp');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'toimage',
    aliases: ['toimg', 'img'],
    category: 'sticker',
    desc: 'Convertit un sticker en image PNG',
    usage: '.toimage (répondre à un sticker)',

    async execute(sock, msg) {
        const jid = msg.key.remoteJid;
        const cfg = sock.config || {};
        const owner = cfg.ownerName || '𝑀𝑟 𝑀𝑎𝑟𝑐𝑜';
        const prefix = cfg.prefix || '.';

        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        let sticker = null;
        if (quoted?.stickerMessage) sticker = quoted.stickerMessage;
        else if (msg.message?.stickerMessage) sticker = msg.message.stickerMessage;

        if (!sticker) {
            return sock.sendMessage(jid, {
                text: `╔════════════════════════╗\n` +
                      `║   🖼️  𝐒𝐓𝐈𝐂𝐊𝐄𝐑 → 𝐈𝐌𝐆\n` +
                      `╚════════════════════════╝\n\n` +
                      `┃  ❌ Répondez à un sticker\n` +
                      `┃  ┃  avec *${prefix}toimage*\n\n` +
                      `> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`
            }, { quoted: msg });
        }

        await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } });

        try {
            const stream = await downloadContentFromMessage(sticker, 'sticker');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

            const png = await sharp(buffer).png().toBuffer();

            await sock.sendMessage(jid, {
                image: png,
                caption: `🖼️ *Sticker converti en image*\n\n> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`
            }, { quoted: msg });

            await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });
        } catch (err) {
            console.error('Erreur toimage:', err.message);
            await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
            await sock.sendMessage(jid, { text: '❌ Erreur lors de la conversion.' }, { quoted: msg });
        }
    }
};
