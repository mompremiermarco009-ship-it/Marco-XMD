const { downloadMediaMessage } = require("@whiskeysockets/baileys");

module.exports = {
    name: "viewonce",
    alias: ["vv", "v", "view"],
    desc: "Lit un message éphémère (view once)",
    usage: ".viewonce (en répondant à un message view once)",
    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;

        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quotedMsg) {
            return sock.sendMessage(jid, { text: "❌ Réponds à un message 'view once'." }, { quoted: msg });
        }

        let mediaBuffer = null;
        let type = null;

        // Détection viewOnce (structure récente Baileys)
        if (quotedMsg.viewOnceMessageV2?.message?.imageMessage) {
            mediaBuffer = await downloadMediaMessage({ message: quotedMsg }, "buffer", {});
            type = "image";
        } else if (quotedMsg.viewOnceMessageV2?.message?.videoMessage) {
            mediaBuffer = await downloadMediaMessage({ message: quotedMsg }, "buffer", {});
            type = "video";
        } else if (quotedMsg.imageMessage?.viewOnce) {
            mediaBuffer = await downloadMediaMessage({ message: quotedMsg }, "buffer", {});
            type = "image";
        } else if (quotedMsg.videoMessage?.viewOnce) {
            mediaBuffer = await downloadMediaMessage({ message: quotedMsg }, "buffer", {});
            type = "video";
        }

        if (!mediaBuffer) {
            return sock.sendMessage(jid, { text: "❌ Le message cité n'est pas un 'view once' valide." }, { quoted: msg });
        }

        try {
            let caption = quotedMsg.imageMessage?.caption || quotedMsg.videoMessage?.caption || "";
            if (caption) caption += "\n\n";
            caption += "> by Marco-XMD\n> Powered by Mr Marco";

            if (type === "image") {
                await sock.sendMessage(jid, { image: mediaBuffer, caption }, { quoted: msg });
            } else if (type === "video") {
                await sock.sendMessage(jid, { video: mediaBuffer, caption }, { quoted: msg });
            }
        } catch (err) {
            console.error("Erreur viewonce:", err);
            await sock.sendMessage(jid, { text: "❌ Impossible de lire le message view once." }, { quoted: msg });
        }
    }
};
