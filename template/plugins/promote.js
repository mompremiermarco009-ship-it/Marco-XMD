// plugins/promote.js
const { isAuthorized, normalizeNumber } = require("../utils/auth");
const config = require("../config.json");

module.exports = {
    name: "promote",
    aliases: ["admin", "addadmin", "setadmin"],
    description: "Promouvoir un membre en administrateur (admin ou owner seulement)",
    usage: ".promote @user ou .promote <numéro>",

    async execute(sock, message, args) {
        const jid = message.key.remoteJid;
        if (!jid.endsWith("@g.us")) {
            return sock.sendMessage(jid, { text: "❌ Cette commande ne fonctionne que dans les groupes." }, { quoted: message });
        }

        let target;
        const mentions = message.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        if (mentions && mentions.length > 0) {
            target = mentions[0];
        } else if (args[0]) {
            const raw = normalizeNumber(args[0]);
            if (!raw) {
                return sock.sendMessage(jid, { text: "❌ Numéro invalide." }, { quoted: message });
            }
            target = raw + "@s.whatsapp.net";
        } else {
            return sock.sendMessage(jid, { text: "❌ Veuillez mentionner un membre ou donner un numéro." }, { quoted: message });
        }

        try {
            const metadata = await sock.groupMetadata(jid);
            const participants = metadata.participants;
            const sender = message.key.participant || message.key.remoteJid;

            const isOwner = isAuthorized(sock, message, config);
            let isGroupAdmin = false;
            if (!isOwner) {
                const senderInfo = participants.find(p => p.id === sender);
                if (senderInfo && (senderInfo.admin === "admin" || senderInfo.admin === "superadmin")) {
                    isGroupAdmin = true;
                }
            }

            if (!isOwner && !isGroupAdmin) {
                return sock.sendMessage(jid, { text: "❌ Vous devez être administrateur du groupe ou propriétaire du bot pour utiliser cette commande." }, { quoted: message });
            }

            // 🔧 RECHERCHE DU BOT PAR LID (prioritaire) puis par numéro
            const botLid = sock.user?.lid;
            const botNum = sock.user.id.split(":")[0].replace(/[^0-9]/g, '');
            let botInfo = null;
            if (botLid) {
                botInfo = participants.find(p => p.id === botLid);
            }
            if (!botInfo) {
                botInfo = participants.find(p => p.id.includes(botNum));
            }

            if (!botInfo || (botInfo.admin !== "admin" && botInfo.admin !== "superadmin")) {
                return sock.sendMessage(jid, { text: "❌ Le bot doit être administrateur pour promouvoir un membre." }, { quoted: message });
            }

            const targetInfo = participants.find(p => p.id === target);
            if (!targetInfo) {
                return sock.sendMessage(jid, { text: "❌ Ce membre ne fait pas partie du groupe." }, { quoted: message });
            }

            if (targetInfo.admin === "admin" || targetInfo.admin === "superadmin") {
                return sock.sendMessage(jid, { text: "❌ Ce membre est déjà administrateur." }, { quoted: message });
            }

            await sock.groupParticipantsUpdate(jid, [target], "promote");
            await sock.sendMessage(jid, {
                text: `✅ @${target.split("@")[0]} est maintenant administrateur.`,
                mentions: [target]
            }, { quoted: message });

        } catch (err) {
            console.error("Erreur plugin promote:", err);
            await sock.sendMessage(jid, { text: "⚠️ Une erreur est survenue lors de la promotion." }, { quoted: message });
        }
    }
};
