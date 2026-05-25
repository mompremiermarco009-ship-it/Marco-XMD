const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const { UploadFileUgu, TelegraPh } = require('../lib/uploader');

async function getMediaBufferAndExt(message) {
    const m = message.message || {};
    if (m.imageMessage) {
        const stream = await downloadContentFromMessage(m.imageMessage, 'image');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        return { buffer: Buffer.concat(chunks), ext: '.jpg' };
    }
    if (m.videoMessage) {
        const stream = await downloadContentFromMessage(m.videoMessage, 'video');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        return { buffer: Buffer.concat(chunks), ext: '.mp4' };
    }
    if (m.audioMessage) {
        const stream = await downloadContentFromMessage(m.audioMessage, 'audio');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        return { buffer: Buffer.concat(chunks), ext: '.mp3' };
    }
    if (m.documentMessage) {
        const stream = await downloadContentFromMessage(m.documentMessage, 'document');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        const fileName = m.documentMessage.fileName || 'file.bin';
        const ext = path.extname(fileName) || '.bin';
        return { buffer: Buffer.concat(chunks), ext };
    }
    if (m.stickerMessage) {
        const stream = await downloadContentFromMessage(m.stickerMessage, 'sticker');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        return { buffer: Buffer.concat(chunks), ext: '.webp' };
    }
    return null;
}

async function getQuotedMediaBufferAndExt(message) {
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;
    if (!quoted) return null;
    return getMediaBufferAndExt({ message: quoted });
}

module.exports = {
    name: "url",
    aliases: ["upload", "geturl"],
    desc: "Convertit un média en lien URL (image, vidéo, audio, sticker, document)",
    usage: ".url (envoyer un média ou répondre à un média)",
    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;

        try {
            let media = await getMediaBufferAndExt(msg);
            if (!media) media = await getQuotedMediaBufferAndExt(msg);

            if (!media) {
                return sock.sendMessage(chatId, {
                    text: 'Envoyez ou répondez à un média (image, vidéo, audio, sticker, document) pour obtenir une URL.'
                }, { quoted: msg });
            }

            const tempDir = path.join(__dirname, '..', 'temp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
            const tempPath = path.join(tempDir, `${Date.now()}${media.ext}`);
            fs.writeFileSync(tempPath, media.buffer);

            let url = '';
            try {
                if (media.ext === '.jpg' || media.ext === '.png' || media.ext === '.webp') {
                    try {
                        url = await TelegraPh(tempPath);
                    } catch {
                        const res = await UploadFileUgu(tempPath);
                        url = typeof res === 'string' ? res : (res.url || res.url_full || JSON.stringify(res));
                    }
                } else {
                    const res = await UploadFileUgu(tempPath);
                    url = typeof res === 'string' ? res : (res.url || res.url_full || JSON.stringify(res));
                }
            } finally {
                setTimeout(() => {
                    try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch {}
                }, 2000);
            }

            if (!url) {
                return sock.sendMessage(chatId, { text: 'Échec de l\'upload du média.' }, { quoted: msg });
            }

            await sock.sendMessage(chatId, { text: `🔗 ${url}` }, { quoted: msg });
        } catch (error) {
            console.error('[URL] error:', error?.message || error);
            await sock.sendMessage(chatId, { text: 'Erreur lors de la conversion en URL.' }, { quoted: msg });
        }
    }
};
