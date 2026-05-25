// events/messages.upsert.js
const { isAuthorized } = require("../utils/auth");
const path = require("path");
const fs = require("fs");

module.exports = {
    name: "messages.upsert",
    async execute(sock, { messages }, { plugins, config }) {
        // Lire la config à jour depuis le fichier de la session
        const cfgPath = path.join(__dirname, "..", "config.json");
        const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf-8"));

        for (const msg of messages) {
            if (!msg.message) continue;
            if (msg.key.remoteJid === "status@broadcast") continue;

            if (!sock.readyAt) continue;

            const msgTime = msg.messageTimestamp * 1000;
            if (isNaN(msgTime) || msgTime < sock.readyAt) continue;

            const jid = msg.key.remoteJid;
            const isGroup = jid.endsWith("@g.us");
            const sender = isGroup ? msg.key.participant : jid;

            // Mode privé
            if (!cfg.publicMode && !msg.key.fromMe && !isAuthorized(sock, msg, cfg)) continue;

            let texte = "";
            const m = msg.message;
            if (m.conversation) texte = m.conversation;
            else if (m.extendedTextMessage) texte = m.extendedTextMessage.text;
            else if (m.imageMessage) texte = m.imageMessage.caption;
            else if (m.videoMessage) texte = m.videoMessage.caption;
            else if (m.documentMessage) texte = m.documentMessage.caption;
            if (!texte) continue;

            const prefix = cfg.prefix || ".";
            if (!texte.startsWith(prefix)) continue;

            const args = texte.slice(prefix.length).trim().split(/ +/);
            const cmd = args.shift()?.toLowerCase();
            if (!cmd) continue;
            const commandArgs = args;

            let plugin = plugins.get(cmd);
            if (!plugin) {
                for (const p of plugins.values()) {
                    if ((p.alias && p.alias.includes(cmd)) || (p.aliases && p.aliases.includes(cmd))) {
                        plugin = p;
                        break;
                    }
                }
            }

            if (plugin && typeof plugin.execute === "function") {
                try {
                    await plugin.execute(sock, msg, commandArgs, cmd);
                    console.log(`✅ [${cfg.botName}] Commande exécutée : ${cmd}`);
                } catch (err) {
                    console.error(`❌ Erreur plugin ${cmd}:`, err);
                }
            }
        }
    }
};
