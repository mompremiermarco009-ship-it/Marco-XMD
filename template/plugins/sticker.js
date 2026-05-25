const { downloadContentFromMessage } = require("gifted-baileys");
const sharp = require("sharp");
const config = require("../config.json");

module.exports = {
    name: "sticker",
    alias: ["s", "stiker"],
    category: "general",
    desc: "Convertit une image en sticker MARCO-XMD",
    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        
        let messageType = Object.keys(msg.message)[0];
        let quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        let mime = "";
        let message = null;

        if (msg.message?.imageMessage) {
            message = msg.message.imageMessage;
            mime = "image";
        } else if (quoted?.imageMessage) {
            message = quoted.imageMessage;
            mime = "image";
        } else if (msg.message?.videoMessage) {
            message = msg.message.videoMessage;
            mime = "video";
        } else if (quoted?.videoMessage) {
            message = quoted.videoMessage;
            mime = "video";
        }

        if (!message) {
            return sock.sendMessage(jid, { text: `❌ Veuillez envoyer ou répondre à une image ou une vidéo courte avec *${config.prefix}sticker*` }, { quoted: msg });
        }

        try {
            await sock.sendMessage(jid, { text: "⏳ *MARCO-XMD* : Conversion en sticker..." }, { quoted: msg });

            const stream = await downloadContentFromMessage(message, mime);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            const stickerBuffer = await sharp(buffer)
                .resize(512, 512, {
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .webp()
                .toBuffer();

            await sock.sendMessage(jid, {
                sticker: stickerBuffer,
                packname: config.botName,
                author: config.ownerName
            }, { quoted: msg });

        } catch (err) {
            console.error("Erreur sticker:", err);
            await sock.sendMessage(jid, { text: `❌ Erreur lors de la création du sticker.\n\n_Détails: ${err.message}_` }, { quoted: msg });
        }
    }
};
