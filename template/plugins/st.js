const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const settings = require('../settings');
const webp = require('node-webpmux');
const crypto = require('crypto');

module.exports = {
    name: "stck",
    aliases: ["sticker2", "st"],
    desc: "Crée un sticker (version originale SUKUNA-XD)",
    usage: ".stck (répondre à une image/vidéo ou envoyer une image/vidéo avec la légende .stck)",
    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        const messageToQuote = msg;

        let targetMessage = msg;
        if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            const quotedInfo = msg.message.extendedTextMessage.contextInfo;
            targetMessage = {
                key: {
                    remoteJid: chatId,
                    id: quotedInfo.stanzaId,
                    participant: quotedInfo.participant
                },
                message: quotedInfo.quotedMessage
            };
        }

        const mediaMessage = targetMessage.message?.imageMessage || targetMessage.message?.videoMessage || targetMessage.message?.documentMessage;

        if (!mediaMessage) {
            await sock.sendMessage(chatId, {
                text: '❌ Réponds à une image/vidéo avec .stck, ou envoie une image/vidéo avec .stck comme légende.',
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363404780045050@newsletter',
                        newsletterName: '𝐌𝐚𝐫𝐜𝐨-𝐗𝐌𝐃',
                        serverMessageId: -1
                    }
                }
            }, { quoted: messageToQuote });
            return;
        }

        try {
            const mediaBuffer = await downloadMediaMessage(targetMessage, 'buffer', {}, {
                logger: undefined,
                reuploadRequest: sock.updateMediaMessage
            });

            if (!mediaBuffer) {
                await sock.sendMessage(chatId, {
                    text: '❌ Échec du téléchargement du média.',
                    contextInfo: { /* ... identique ... */ }
                }, { quoted: messageToQuote });
                return;
            }

            const tmpDir = path.join(process.cwd(), 'tmp');
            if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

            const tempInput = path.join(tmpDir, `temp_${Date.now()}`);
            const tempOutput = path.join(tmpDir, `sticker_${Date.now()}.webp`);
            fs.writeFileSync(tempInput, mediaBuffer);

            const isAnimated = mediaMessage.mimetype?.includes('gif') ||
                              mediaMessage.mimetype?.includes('video') ||
                              mediaMessage.seconds > 0;

            const ffmpegCommand = isAnimated
                ? `ffmpeg -i "${tempInput}" -vf "scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 75 -compression_level 6 "${tempOutput}"`
                : `ffmpeg -i "${tempInput}" -vf "scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 75 -compression_level 6 "${tempOutput}"`;

            await new Promise((resolve, reject) => {
                exec(ffmpegCommand, (error) => (error ? reject(error) : resolve()));
            });

            let webpBuffer = fs.readFileSync(tempOutput);

            // Fallback pour animés trop lourds (identique à l'original)
            if (isAnimated && webpBuffer.length > 1000 * 1024) {
                try {
                    const tempOutput2 = path.join(tmpDir, `sticker_fallback_${Date.now()}.webp`);
                    const fileSizeKB = mediaBuffer.length / 1024;
                    const isLargeFile = fileSizeKB > 5000;
                    const fallbackCmd = isLargeFile
                        ? `ffmpeg -y -i "${tempInput}" -t 2 -vf "scale=512:512:force_original_aspect_ratio=decrease,fps=8,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 30 -compression_level 6 -b:v 100k -max_muxing_queue_size 1024 "${tempOutput2}"`
                        : `ffmpeg -y -i "${tempInput}" -t 3 -vf "scale=512:512:force_original_aspect_ratio=decrease,fps=12,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 45 -compression_level 6 -b:v 150k -max_muxing_queue_size 1024 "${tempOutput2}"`;
                    await new Promise((resolve, reject) => {
                        exec(fallbackCmd, (error) => error ? reject(error) : resolve());
                    });
                    if (fs.existsSync(tempOutput2)) {
                        webpBuffer = fs.readFileSync(tempOutput2);
                        try { fs.unlinkSync(tempOutput2); } catch {}
                    }
                } catch {}
            }

            webpBuffer = fs.readFileSync(tempOutput);

            const img = new webp.Image();
            await img.load(webpBuffer);

            const json = {
                'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
                'sticker-pack-name': settings.packname || 'MARCO-XMD',
                'emojis': ['🔖']
            };
            const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
            const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
            const exif = Buffer.concat([exifAttr, jsonBuffer]);
            exif.writeUIntLE(jsonBuffer.length, 14, 4);
            img.exif = exif;

            let finalBuffer = await img.save(null);

            // Dernier recours : redimensionnement 320px
            if (isAnimated && finalBuffer.length > 900 * 1024) {
                try {
                    const tempOutput3 = path.join(tmpDir, `sticker_small_${Date.now()}.webp`);
                    const smallCmd = `ffmpeg -y -i "${tempInput}" -t 2 -vf "scale=320:320:force_original_aspect_ratio=decrease,fps=8,pad=320:320:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 30 -compression_level 6 -b:v 80k -max_muxing_queue_size 1024 "${tempOutput3}"`;
                    await new Promise((resolve, reject) => {
                        exec(smallCmd, (error) => error ? reject(error) : resolve());
                    });
                    if (fs.existsSync(tempOutput3)) {
                        const smallWebp = fs.readFileSync(tempOutput3);
                        const img2 = new webp.Image();
                        await img2.load(smallWebp);
                        const json2 = { 'sticker-pack-id': crypto.randomBytes(32).toString('hex'), 'sticker-pack-name': settings.packname || 'MARCO-XMD', 'emojis': ['🤖'] };
                        const exifAttr2 = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
                        const jsonBuffer2 = Buffer.from(JSON.stringify(json2), 'utf8');
                        const exif2 = Buffer.concat([exifAttr2, jsonBuffer2]);
                        exif2.writeUIntLE(jsonBuffer2.length, 14, 4);
                        img2.exif = exif2;
                        finalBuffer = await img2.save(null);
                        try { fs.unlinkSync(tempOutput3); } catch {}
                    }
                } catch {}
            }

            await sock.sendMessage(chatId, { sticker: finalBuffer }, { quoted: messageToQuote });

            try { fs.unlinkSync(tempInput); fs.unlinkSync(tempOutput); } catch {}
        } catch (error) {
            console.error('Erreur sticker (stck):', error);
            await sock.sendMessage(chatId, { text: '❌ Échec de la création du sticker.' }, { quoted: messageToQuote });
        }
    }
};
