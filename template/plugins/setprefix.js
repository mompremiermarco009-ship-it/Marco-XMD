const fs = require('fs');
const path = require('path');

module.exports = {
    name: "setprefix",
    aliases: ["prefix"],
    category: "owner",
    desc: "Changer le préfixe des commandes (par session)",
    usage: ".setprefix !",
    async execute(sock, msg, args) {
        const newPrefix = args[0];
        if (!newPrefix || newPrefix.length > 3) return sock.sendMessage(msg.key.remoteJid, { text: "❌ Préfixe invalide (max 3 caractères)." }, { quoted: msg });

        // Chemin correct dans l’architecture : plugins/../config.json = sessions/<ID>/config.json
        const configPath = path.join(__dirname, "..", "config.json");
        let cfg;
        try {
            cfg = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        } catch {
            return sock.sendMessage(msg.key.remoteJid, { text: "❌ Fichier de configuration introuvable." }, { quoted: msg });
        }

        cfg.prefix = newPrefix;
        fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2));

        // Met à jour la config en mémoire (utilisée par certains événements)
        sock.config = cfg;

        await sock.sendMessage(msg.key.remoteJid, { text: `✅ Préfixe changé en : *${newPrefix}*` }, { quoted: msg });
    }
};
