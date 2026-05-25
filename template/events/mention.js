const fs = require('fs');
const path = require('path');
const { normalizeNumber } = require("../utils/auth");

module.exports = (sock) => {
    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;

        // Récupérer les mentions depuis contextInfo
        let mentionedJids = [];
        if (msg.message.contextInfo?.mentionedJid) {
            mentionedJids = msg.message.contextInfo.mentionedJid;
        }
        if (msg.message.extendedTextMessage?.contextInfo?.mentionedJid) {
            mentionedJids = msg.message.extendedTextMessage.contextInfo.mentionedJid;
        }

        // Normaliser le JID du bot
        let botJid = sock.user.id;
        if (botJid.includes(':')) botJid = botJid.split(':')[0];
        botJid = botJid + '@s.whatsapp.net';
        const botNumber = normalizeNumber(botJid);

        // Vérifier si le bot est mentionné
        const isMentioned = mentionedJids.some(jid => {
            const normalized = normalizeNumber(jid);
            return normalized === botNumber;
        });

        if (isMentioned) {
            const audioPath = path.join(__dirname, "../media/Phonk.mp3");
            if (fs.existsSync(audioPath)) {
                const audioBuffer = fs.readFileSync(audioPath);
                await sock.sendMessage(msg.key.remoteJid, {
                    audio: audioBuffer,
                    mimetype: "audio/mpeg",
                    ptt: false
                });
                console.log("🎵 Musique envoyée (mention du bot)");
            } else {
                console.log("❌ Phonk.mp3 introuvable");
            }
        }
    });
};
