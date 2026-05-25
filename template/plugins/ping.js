const config = require("../config.json");

module.exports = {
    name: "ping",
    alias: ["p", "pong"],
    category: "general",
    desc: "Affiche la latence du bot MARCO-XMD",
    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        const start = Date.now();

        // Message initial avec branding
        const { key } = await sock.sendMessage(jid, { text: `🚀 *MARCO-XMD* : Analyse de la latence...` }, { quoted: msg });

        const latency = Date.now() - start;
        const platform = process.platform;
        const uptime = Math.floor((Date.now() - (global.startTime || Date.now())) / 1000);
        
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = uptime % 60;

        const finalText = `⚡ *MARCO-XMD PING*\n\n` +
                          `📡 *Latence* : ${latency} ms\n` +
                          `💻 *Plateforme* : ${platform}\n` +
                          `⏱️ *Uptime* : ${hours}h ${minutes}m ${seconds}s\n\n` +
                          `> _Powered by @Mr Marco._`;

        // Mise à jour du message (si possible via edit, sinon nouvel envoi)
        try {
            await sock.sendMessage(jid, { text: finalText, edit: key });
        } catch (e) {
            await sock.sendMessage(jid, { text: finalText }, { quoted: msg });
        }
    }
};
