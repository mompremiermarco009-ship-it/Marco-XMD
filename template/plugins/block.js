const { isAuthorized, normalizeNumber } = require("../utils/auth");

module.exports = {
    name: "block",
    alias: ["unblock"],
    async execute(sock, msg, args, cmd, originalCmd) {
        const jid = msg.key.remoteJid;
        if (!isAuthorized(sock, msg)) {
            return sock.sendMessage(jid, { text: "❌ Vous n'êtes pas autorisé." }, { quoted: msg });
        }

        let targetJid = null;

        // 1. Si c'est une conversation privée (pas de @g.us)
        if (!jid.endsWith('@g.us')) {
            targetJid = jid; // l'autre participant
        }
        // 2. Sinon, groupe : recherche par réponse, mention ou argument
        else {
            if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
                targetJid = msg.message.extendedTextMessage.contextInfo.participant;
            } else if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
                targetJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
            } else if (args.length > 0) {
                let number = normalizeNumber(args[0]);
                if (number) targetJid = number + "@s.whatsapp.net";
            }
        }

        if (!targetJid) {
            return sock.sendMessage(jid, { text: "❌ Utilisation : en privé, tapez .block ; en groupe, mentionnez ou répondez." }, { quoted: msg });
        }

        const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        if (targetJid === botJid) {
            return sock.sendMessage(jid, { text: "❌ Je ne peux pas me bloquer moi-même." }, { quoted: msg });
        }

        const action = originalCmd === "unblock" ? "unblock" : "block";
        try {
            await sock.updateBlockStatus(targetJid, action);
            const message = action === "block" ? `🔒 Utilisateur bloqué.` : `🔓 Utilisateur débloqué.`;
            await sock.sendMessage(jid, { text: message }, { quoted: msg });
        } catch (error) {
            console.error("Erreur block/unblock :", error);
            await sock.sendMessage(jid, { text: "❌ Erreur lors de l'action." }, { quoted: msg });
        }
    }
};
