const { isAuthorized } = require("../utils/auth");

module.exports = {
    name: "leave",
    alias: ["bye"],
    category: "owner",
    desc: "Fait quitter le bot du groupe (owner only)",
    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        if (!isAuthorized(sock, msg)) {
            return sock.sendMessage(jid, { text: "❌ Commande réservée à l'owner." });
        }
        if (!jid.endsWith("@g.us")) {
            return sock.sendMessage(jid, { text: "❌ Utilisable uniquement dans un groupe." });
        }
        await sock.sendMessage(jid, { text: "👋 Au revoir les loser !" });
        await sock.groupLeave(jid);
    }
};
