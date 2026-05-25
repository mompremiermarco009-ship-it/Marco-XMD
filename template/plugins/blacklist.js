const fs = require('fs');
const { isAuthorized, normalizeNumber } = require("../utils/auth");

module.exports = {
    name: "blacklist",
    alias: ["bl"],
    category: "owner",
    desc: "Gère la blacklist (ajout/suppression/affichage)",
    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        if (!isAuthorized(sock, msg)) {
            return sock.sendMessage(jid, { text: "❌ Commande réservée à l'owner." });
        }
        let config = JSON.parse(fs.readFileSync('./config.json'));
        if (!config.blacklist) config.blacklist = [];

        const action = args[0]?.toLowerCase();
        const target = args[1] ? normalizeNumber(args[1]) : null;

        if (action === "add" && target) {
            if (!config.blacklist.includes(target)) config.blacklist.push(target);
            fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
            return sock.sendMessage(jid, { text: `✅ ${target} ajouté à la blacklist.` });
        }
        if (action === "remove" && target) {
            config.blacklist = config.blacklist.filter(n => n !== target);
            fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
            return sock.sendMessage(jid, { text: `✅ ${target} retiré de la blacklist.` });
        }
        if (action === "list") {
            const list = config.blacklist.length ? config.blacklist.join('\n') : "Aucun";
            return sock.sendMessage(jid, { text: `🚫 *Blacklist* :\n${list}` });
        }
        return sock.sendMessage(jid, { text: "❌ Utilisation : .blacklist add <num> / remove <num> / list" });
    }
};
