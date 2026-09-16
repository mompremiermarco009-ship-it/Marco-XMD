const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

module.exports = {
    name: 'togif',
    aliases: ['togfy', 'stickergif'],
    category: 'sticker',
    desc: 'Convertit un sticker animé en vidéo MP4',
    usage: '.togif (répondre à un sticker animé)',

    async execute(sock, msg) {
        const jid = msg.key.remoteJid;
        const cfg = sock.config || {};
        const owner = cfg.ownerName || '𝑀𝑟 𝑀𝑎𝑟𝑐𝑜';
        const prefix = cfg.prefix || '.';

        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        let sticker = null;
        if (quoted?.stickerMessage) sticker = quoted.stickerMessage;

        if (!sticker) {
            return sock.sendMessage(jid, {
                text: `╔════════════════════════╗\n` +
                      `║   📹  𝐒𝐓𝐈𝐂𝐊𝐄𝐑 → 𝐆𝐈𝐅\n` +
                      `╚════════════════════════╝\n\n` +
                      `┃  ❌ Répondez à un sticker animé\n` +
                      `┃  ┃  avec *${prefix}togif*\n\n` +
                      `> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`
            }, { quoted: msg });
        }

        await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } });

        const tmpDir = os.tmpdir();
        const webpPath = path.join(tmpDir, `sticker_${Date.now()}.webp`);
        const mp4Path = path.join(tmpDir, `sticker_${Date.now()}.mp4`);

        try {
            const stream = await downloadContentFromMessage(sticker, 'sticker');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
            fs.writeFileSync(webpPath, buffer);

            execSync(`ffmpeg -y -i "${webpPath}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=white" -c:v libx264 -pix_fmt yuv420p "${mp4Path}"`, { stdio: 'pipe' });

            const mp4Buffer = fs.readFileSync(mp4Path);

            await sock.sendMessage(jid, {
                video: mp4Buffer,
                mimetype: 'video/mp4',
                gifPlayback: true,
                caption: `📹 *Sticker converti en vidéo*\n\n> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`
            }, { quoted: msg });

            await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });
        } catch (err) {
            console.error('Erreur togif:', err.message);
            await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
            await sock.sendMessage(jid, { text: '❌ Erreur lors de la conversion.' }, { quoted: msg });
        } finally {
            try { fs.unlinkSync(webpPath); } catch {}
            try { fs.unlinkSync(mp4Path); } catch {}
        }
    }
};
