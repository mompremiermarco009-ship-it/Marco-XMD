const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'gstatus',
    aliases: ['groupstatus', 'statutgroup'],
    category: 'sticker',
    desc: 'Publie un statut WhatsApp avec image ou vidéo',
    usage: '.gstatus <texte> (répondre à une image/vidéo)',

    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        const cfg = sock.config || {};
        const owner = cfg.ownerName || '𝑀𝑟 𝑀𝑎𝑟𝑐𝑜';
        const prefix = cfg.prefix || '.';

        const m = msg.message;
        const quoted = m?.extendedTextMessage?.contextInfo?.quotedMessage;
        let media = null;
        let type = null;

        if (m?.imageMessage) { media = m.imageMessage; type = 'image'; }
        else if (quoted?.imageMessage) { media = quoted.imageMessage; type = 'image'; }
        else if (m?.videoMessage) { media = m.videoMessage; type = 'video'; }
        else if (quoted?.videoMessage) { media = quoted.videoMessage; type = 'video'; }

        const caption = args.join(' ').trim() || '';

        if (!media) {
            return sock.sendMessage(jid, {
                text: `╔════════════════════════╗\n` +
                      `║   📸  𝐆𝐒𝐓𝐀𝐓𝐔𝐒\n` +
                      `╚════════════════════════╝\n\n` +
                      `┃  ❌ Envoyez une image/vidéo avec\n` +
                      `┃  ┃  la légende *${prefix}gstatus <texte>*\n` +
                      `┃  ┃  ou répondez à un média.\n\n` +
                      `> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`
            }, { quoted: msg });
        }

        await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } });

        try {
            const stream = await downloadContentFromMessage(media, type);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

            const payload = type === 'image'
                ? { image: buffer, caption }
                : { video: buffer, caption };

            await sock.sendMessage('status@broadcast', payload);

            await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });
            await sock.sendMessage(jid, {
                text: `✅ Statut publié avec succès !\n\n> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`
            }, { quoted: msg });
        } catch (err) {
            console.error('Erreur gstatus:', err.message);
            await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
            await sock.sendMessage(jid, { text: '❌ Erreur lors de la publication.' }, { quoted: msg });
        }
    }
};
