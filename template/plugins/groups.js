const { isAuthorized } = require("../utils/auth");

module.exports = {
    name: "groups",
    alias: ["glist"],
    category: "owner",
    desc: "Liste tous les groupes du bot",
    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        if (!isAuthorized(sock, msg)) {
            return sock.sendMessage(jid, { text: "❌ Commande réservée à l'owner." });
        }
        const groups = await sock.groupFetchAllParticipating();
        const groupList = Object.values(groups).map(g => `• ${g.subject} (${g.id})`).join('\n');
        const text = `📋 *Groupes actifs (${Object.keys(groups).length})* :\n\n${groupList || "Aucun"}`;
        await sock.sendMessage(jid, { text: text });
    }
};
