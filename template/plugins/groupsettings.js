// plugins/groupsettings.js
module.exports = {
    name: "groupsettings",
    aliases: ["gset", "groupset"],
    desc: "Modifie les paramètres du groupe (nom, description, photo)",
    usage: ".gset setname <nom> / setdesc <desc> / setpp (répondre à une image)",
    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        if (!jid.endsWith("@g.us")) {
            return sock.sendMessage(jid, { text: "❌ Cette commande ne fonctionne que dans les groupes." }, { quoted: msg });
        }

        const sender = msg.key.participant || jid;
        try {
            const metadata = await sock.groupMetadata(jid);
            const participants = metadata.participants;
            const senderInfo = participants.find(p => p.id === sender);
            if (!senderInfo || (senderInfo.admin !== "admin" && senderInfo.admin !== "superadmin")) {
                return sock.sendMessage(jid, { text: "❌ Vous devez être administrateur." }, { quoted: msg });
            }
            const botLid = sock.user?.lid;
            const botNum = sock.user.id.split(":")[0].replace(/[^0-9]/g, "");
            let botInfo = botLid ? participants.find(p => p.id === botLid) : null;
            if (!botInfo) botInfo = participants.find(p => p.id.includes(botNum));
            if (!botInfo || (botInfo.admin !== "admin" && botInfo.admin !== "superadmin")) {
                return sock.sendMessage(jid, { text: "❌ Le bot doit être administrateur." }, { quoted: msg });
            }
        } catch (e) {
            return sock.sendMessage(jid, { text: "❌ Impossible de vérifier les droits." }, { quoted: msg });
        }

        const sub = (args[0] || "").toLowerCase();
        if (sub === "setname") {
            const newName = args.slice(1).join(" ");
            if (!newName) return sock.sendMessage(jid, { text: "❌ Donnez un nouveau nom." }, { quoted: msg });
            await sock.groupUpdateSubject(jid, newName);
            await sock.sendMessage(jid, { text: `✅ Nom du groupe changé en *${newName}*` }, { quoted: msg });
        } else if (sub === "setdesc") {
            const newDesc = args.slice(1).join(" ");
            if (!newDesc) return sock.sendMessage(jid, { text: "❌ Donnez une nouvelle description." }, { quoted: msg });
            await sock.groupUpdateDescription(jid, newDesc);
            await sock.sendMessage(jid, { text: "✅ Description mise à jour." }, { quoted: msg });
        } else if (sub === "setpp") {
            let imageBuffer = null;
            if (msg.message?.imageMessage) {
                imageBuffer = await sock.downloadMediaMessage(msg, "buffer", {});
            } else if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) {
                const quoted = msg.message.extendedTextMessage.contextInfo.quotedMessage;
                imageBuffer = await sock.downloadMediaMessage({ message: quoted }, "buffer", {});
            }
            if (!imageBuffer) return sock.sendMessage(jid, { text: "❌ Répondez à une image ou envoyez une image avec la commande." }, { quoted: msg });
            await sock.updateProfilePicture(jid, imageBuffer);
            await sock.sendMessage(jid, { text: "✅ Photo de groupe mise à jour." }, { quoted: msg });
        } else {
            await sock.sendMessage(jid, { text: "❌ Utilisation : .gset setname/setdesc/setpp" }, { quoted: msg });
        }
    }
};
