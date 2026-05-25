const os = require('os');
const fs = require('fs');

let messageCount = 0;
let commandCount = 0;

// Incrémenter ces compteurs dans index.js (voir note après)
module.exports = {
    name: "stats",
    alias: ["stat"],
    category: "general",
    desc: "Affiche les statistiques du bot",
    async execute(sock, msg, args) {
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        const memUsage = process.memoryUsage().heapUsed / 1024 / 1024;
        const platform = os.platform();
        let config = {};
        try { config = JSON.parse(fs.readFileSync('./config.json')); } catch(e) {}
        const stats = `📊 *STATISTIQUES Marco-XMD*
⏱️ Uptime : ${hours}h ${minutes}m ${seconds}s
💾 Mémoire : ${memUsage.toFixed(2)} Mo
📨 Messages traités : ${messageCount}
⚙️ Commandes exécutées : ${commandCount}
🌍 Mode : ${config.publicMode ? "Public" : "Privé"}
🖥️ Plateforme : ${platform}
> Powered by Mr Marco🍷`;
        await sock.sendMessage(msg.key.remoteJid, { text: stats });
    }
};
