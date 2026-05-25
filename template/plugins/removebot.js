const fs = require("fs-extra");
const path = require("path");
const { isSuperAdmin } = require("../utils/superAuth");

module.exports = {
    name: "removebot",
    aliases: ["delsession"],
    category: "owner",
    desc: "Supprime une session bot (super admin uniquement)",
    usage: ".removebot 509xxxxxx",
    async execute(sock, msg, args) {
        const sender = msg.key.participant || msg.key.remoteJid;
        if (!isSuperAdmin(sender)) {
            return sock.sendMessage(msg.key.remoteJid, { text: "❌ Commande réservée aux super administrateurs." }, { quoted: msg });
        }

        const target = args[0]?.replace(/[^0-9]/g, '');
        if (!target) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Numéro de session invalide." }, { quoted: msg });

        const sessionPath = path.join(__dirname, "..", "sessions", target);
        if (fs.existsSync(sessionPath)) {
            await fs.remove(sessionPath);
            await sock.sendMessage(msg.key.remoteJid, { text: `✅ Session ${target} supprimée.` }, { quoted: msg });
        } else {
            await sock.sendMessage(msg.key.remoteJid, { text: `❌ Session ${target} introuvable.` }, { quoted: msg });
        }
    }
};
