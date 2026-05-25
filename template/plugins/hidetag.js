const config = require("../config.json");

module.exports = {
    name: "hidetag",
    alias: ["ht", "tag", "h"],
    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        if (!jid.endsWith("@g.us")) return;

        // 1. Récupérer tous les membres du groupe
        const metadata = await sock.groupMetadata(jid);
        const participants = metadata.participants.map(p => p.id);

        // 2. Vérifier si on répond à un message (quoted)
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const messageType = quoted ? Object.keys(quoted)[0] : null;

        // 3. LOGIQUE DE RENVOI EXACT
        if (quoted) {
            // Le bot renvoie EXACTEMENT le message cité avec les mentions cachées
            await sock.sendMessage(jid, {
                forward: { key: msg.message.extendedTextMessage.contextInfo.stanzaId, message: quoted },
                contextInfo: {
                    mentionedJid: participants,
                    forwardingScore: 1,
                    isForwarded: true
                }
            });
        } else {
            // Si pas de reply, on envoie le texte des arguments ou un message par défaut
            let text = args.join(" ") || "📢 *Notification de groupe*";
            await sock.sendMessage(jid, {
                text: text,
                mentions: participants
            });
        }
    }
};
