const { downloadMediaMessage, prepareWAMessageMedia, generateWAMessageFromContent } = require("@whiskeysockets/baileys");

module.exports = {
    name: "groupstatus",
    alias: ["gstatus", "gs"],
    category: "group",
    desc: "Publie un vrai statut (story) dans le groupe (image, vidéo ou texte)",
    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        if (!jid.endsWith("@g.us")) {
            return sock.sendMessage(jid, { text: "❌ Cette commande ne peut être utilisée que dans un groupe." });
        }

        const signature = "\n\n> by Marco-XMD \n> by Mr Marco";
        let text = args.join(" ");
        let caption = text ? text + signature : signature;
        const quotedMessage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        let mediaBuffer = null;
        let mediaType = null;

        if (msg.message?.imageMessage) {
            mediaBuffer = await downloadMediaMessage(msg, "buffer", {});
            mediaType = "image";
            caption = (msg.message.imageMessage.caption || text) + signature;
        } else if (quotedMessage?.imageMessage) {
            const mockMsg = { message: { imageMessage: quotedMessage.imageMessage } };
            mediaBuffer = await downloadMediaMessage(mockMsg, "buffer", {});
            mediaType = "image";
            caption = (quotedMessage.imageMessage.caption || text) + signature;
        } else if (msg.message?.videoMessage) {
            mediaBuffer = await downloadMediaMessage(msg, "buffer", {});
            mediaType = "video";
            caption = (msg.message.videoMessage.caption || text) + signature;
        } else if (quotedMessage?.videoMessage) {
            const mockMsg = { message: { videoMessage: quotedMessage.videoMessage } };
            mediaBuffer = await downloadMediaMessage(mockMsg, "buffer", {});
            mediaType = "video";
            caption = (quotedMessage.videoMessage.caption || text) + signature;
        }

        try {
            let innerMessage;

            if (mediaBuffer && mediaType) {
                // Préparer le média via l'API officielle (upload si nécessaire)
                const preparedMedia = await prepareWAMessageMedia(
                    { [mediaType]: mediaBuffer },
                    { upload: sock.waUploadToServer || sock.uploadToServer }
                );

                // Construire le contenu du statut avec le média préparé et la légende
                innerMessage = {
                    ...preparedMedia,
                    caption: caption,
                };
            } else if (text.trim().length > 0) {
                innerMessage = { text: caption };
            } else {
                return sock.sendMessage(jid, {
                    text: "❌ *Utilisation correcte :*\n• `.gstatus Votre texte`.\n• Répondez à une image/vidéo avec `.gstatus`."
                });
            }

            // Générer le message complet pour le statut de groupe
            const generated = generateWAMessageFromContent(
                jid,
                { groupStatusMessage: innerMessage },
                { userJid: sock.user.id, quoted: msg }
            );

            // Envoyer le paquet directement
            await sock.relayMessage(jid, generated.message, {
                messageId: generated.key.id
            });

            await sock.sendMessage(jid, { text: "✅ Statut publié avec succès dans le groupe !" });
        } catch (err) {
            console.error("Erreur groupstatus :", err);
            await sock.sendMessage(jid, {
                text: `❌ Erreur lors de l'envoi.\n*Raison technique :* ${err.message || err}`
            });
        }
    }
};
