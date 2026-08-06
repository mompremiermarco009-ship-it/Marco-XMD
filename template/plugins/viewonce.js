const { downloadMediaMessage } = require("@whiskeysockets/baileys");

module.exports = {
    name: "viewonce",
    aliases: ["v", "vv", "vo"],
    desc: "Lit un message éphémère (view once) - image, vidéo ou audio",
    usage: ".viewonce (en répondant à un message view once)",
    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        let mediaBuffer = null;
        let isVideo = false;
        let isAudio = false;

        try {
            // Cas 1 : message direct viewOnceMessageV2
            if (msg.message?.viewOnceMessageV2?.message) {
                const vo = msg.message.viewOnceMessageV2.message;
                if (vo.imageMessage) {
                    mediaBuffer = await downloadMediaMessage(msg, "buffer", {});
                } else if (vo.videoMessage) {
                    mediaBuffer = await downloadMediaMessage(msg, "buffer", {});
                    isVideo = true;
                } else if (vo.audioMessage) {
                    mediaBuffer = await downloadMediaMessage(msg, "buffer", {});
                    isAudio = true;
                }
            }
            // Cas 2 : message cité avec viewOnceMessageV2
            else if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.viewOnceMessageV2?.message) {
                const quoted = msg.message.extendedTextMessage.contextInfo.quotedMessage;
                const vo = quoted.viewOnceMessageV2.message;
                if (vo.imageMessage) {
                    mediaBuffer = await downloadMediaMessage({ message: quoted }, "buffer", {});
                } else if (vo.videoMessage) {
                    mediaBuffer = await downloadMediaMessage({ message: quoted }, "buffer", {});
                    isVideo = true;
                } else if (vo.audioMessage) {
                    mediaBuffer = await downloadMediaMessage({ message: quoted }, "buffer", {});
                    isAudio = true;
                }
            }
            // Cas 3 : message cité avec média direct (flag viewOnce)
            else if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage ||
                     msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage ||
                     msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.audioMessage) {
                const quoted = msg.message.extendedTextMessage.contextInfo.quotedMessage;
                if (quoted.imageMessage) {
                    mediaBuffer = await downloadMediaMessage({ message: quoted }, "buffer", {});
                } else if (quoted.videoMessage) {
                    mediaBuffer = await downloadMediaMessage({ message: quoted }, "buffer", {});
                    isVideo = true;
                } else if (quoted.audioMessage) {
                    mediaBuffer = await downloadMediaMessage({ message: quoted }, "buffer", {});
                    isAudio = true;
                }
            }

            if (!mediaBuffer) {
                return sock.sendMessage(jid, { text: "❌ Aucun message éphémère détecté. Répondez à un message view once avec .viewonce" }, { quoted: msg });
            }

            // Envoi selon le type détecté
            if (isVideo) {
                await sock.sendMessage(jid, { video: mediaBuffer }, { quoted: msg });
            } else if (isAudio) {
                await sock.sendMessage(jid, {
                    audio: mediaBuffer,
                    mimetype: "audio/ogg; codecs=opus",
                    ptt: false
                }, { quoted: msg });
            } else {
                await sock.sendMessage(jid, { image: mediaBuffer }, { quoted: msg });
            }
        } catch (err) {
            console.error("Erreur viewonce:", err.message);
            await sock.sendMessage(jid, { text: "❌ Impossible de lire ce message éphémère. Il a peut-être déjà été vu ou expiré." }, { quoted: msg });
        }
    }
};
