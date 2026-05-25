// events/antidelete.js
const { normalizeNumber } = require("../utils/auth");

module.exports = (sock) => {
    sock.ev.on("message.delete", async (deleteEvent) => {
        try {
            const { remoteJid, fromMe, id, participant } = deleteEvent.keys[0];
            if (fromMe) return; // ignorer les suppressions du bot

            const deletedMsg = await sock.loadMessage(remoteJid, id);
            if (!deletedMsg) return;

            const sender = participant || remoteJid;
            const senderNumber = sender.split("@")[0];
            const isGroup = remoteJid.endsWith("@g.us");
            const now = new Date();
            const heure = now.toLocaleTimeString();
            const date = now.toLocaleDateString();

            // --- Déterminer le lieu (groupe ou privé) ---
            let lieu = "";
            if (isGroup) {
                let groupName = remoteJid;
                try {
                    const meta = await sock.groupMetadata(remoteJid);
                    groupName = meta.subject;
                } catch (e) {}
                lieu = `Groupe : ${groupName} (${remoteJid})`;
            } else {
                lieu = "Message privé";
            }

            // --- Extraire le contenu complet selon le type ---
            let contenu = "";
            const msg = deletedMsg.message;
            if (msg.conversation) {
                contenu = msg.conversation;
            } else if (msg.extendedTextMessage?.text) {
                contenu = msg.extendedTextMessage.text;
            } else if (msg.imageMessage) {
                contenu = `[Image] ${msg.imageMessage.caption || "sans légende"}`;
            } else if (msg.videoMessage) {
                contenu = `[Vidéo] ${msg.videoMessage.caption || "sans légende"}`;
            } else if (msg.audioMessage) {
                contenu = `[Audio] ${msg.audioMessage.title || "fichier audio"}`;
            } else if (msg.documentMessage) {
                contenu = `[Document] ${msg.documentMessage.fileName || "fichier"}`;
            } else if (msg.stickerMessage) {
                contenu = `[Sticker]`;
            } else if (msg.contactMessage) {
                contenu = `[Contact] ${msg.contactMessage.displayName || "carte de visite"}`;
            } else if (msg.locationMessage) {
                contenu = `[Localisation] Lat: ${msg.locationMessage.degreesLatitude}, Lon: ${msg.locationMessage.degreesLongitude}`;
            } else if (msg.liveLocationMessage) {
                contenu = `[Localisation en direct]`;
            } else if (msg.pollCreationMessage) {
                contenu = `[Sondage] ${msg.pollCreationMessage.name}`;
            } else {
                contenu = "[Message non textuel ou non supporté]";
            }

            // --- Envoyer la notification au bot lui-même (son propre JID) ---
            const myJid = sock.user.id.split(":")[0] + "@s.whatsapp.net";
            await sock.sendMessage(myJid, {
                text: `⚠️ *Message supprimé*\n\n📅 ${date} - ${heure}\n📍 ${lieu}\n👤 @${senderNumber}\n📝 *Contenu :*\n${contenu}`,
                mentions: [sender]
            });

            console.log(`♻️ Notification de suppression envoyée au bot (${myJid})`);
        } catch (err) {
            console.error("❌ Erreur dans antidelete.js :", err);
        }
    });
};
