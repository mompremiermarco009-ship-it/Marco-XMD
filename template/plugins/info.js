const fs = require('fs');
const path = require('path');

module.exports = {
    name: "info",
    alias: ["about", "status"],
    category: "general",
    desc: "Affiche les informations du bot (par session + uptime global)",
    async execute(sock, msg, args) {
        const cfg = sock.config || require("../config.json");

        // Uptime de la session
        const sessionStart = sock.startTime || Date.now();
        const sessionUptime = Date.now() - sessionStart;
        const sH = Math.floor(sessionUptime / 3600000);
        const sM = Math.floor((sessionUptime % 3600000) / 60000);
        const sS = Math.floor((sessionUptime % 60000) / 1000);

        // Uptime global
        const globalStart = global.startTime || Date.now();
        const globalUptime = Date.now() - globalStart;
        const gH = Math.floor(globalUptime / 3600000);
        const gM = Math.floor((globalUptime % 3600000) / 60000);
        const gS = Math.floor((globalUptime % 60000) / 1000);

        let pluginsCount = 0;
        try {
            const pluginsDir = path.join(__dirname);
            if (fs.existsSync(pluginsDir)) {
                pluginsCount = fs.readdirSync(pluginsDir).filter(f => f.endsWith(".js")).length;
            }
        } catch (e) {}

        const info = `🤖 *${cfg.botName}*
📌 Version : ${cfg.version || "2.0.0"}
👑 Owner : ${cfg.ownerName || cfg.ownerNumber || "N/A"}
🌍 Mode : ${cfg.publicMode ? "Public" : "Privé"}
📦 Préfixe : ${cfg.prefix || "."}
⏱️ Uptime session : ${sH}h ${sM}m ${sS}s
🌐 Uptime global : ${gH}h ${gM}m ${gS}s
📚 Plugins : ${pluginsCount}
> Powered by Mr Marco`;

        await sock.sendMessage(msg.key.remoteJid, { text: info }, { quoted: msg });
    }
};
