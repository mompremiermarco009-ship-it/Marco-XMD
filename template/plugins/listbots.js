const { isSuperAdmin } = require("../utils/superAuth");

module.exports = {
    name: "listbots",
    aliases: ["sessions"],
    category: "owner",
    desc: "Liste toutes les sessions actives (super admin uniquement)",
    usage: ".listbots",
    async execute(sock, msg, args) {
        const sender = msg.key.participant || msg.key.remoteJid;
        if (!isSuperAdmin(sender)) {
            return sock.sendMessage(msg.key.remoteJid, { text: "❌ Commande réservée aux super administrateurs." }, { quoted: msg });
        }

        const sessionsDir = path.join(__dirname, "..", "sessions");
        const sessions = fs.existsSync(sessionsDir) ? fs.readdirSync(sessionsDir).filter(f => fs.statSync(path.join(sessionsDir, f)).isDirectory()) : [];
        const list = sessions.length ? sessions.join("\n") : "Aucune session active.";
        await sock.sendMessage(msg.key.remoteJid, { text: `📂 Sessions actives :\n${list}` }, { quoted: msg });
    }
};
