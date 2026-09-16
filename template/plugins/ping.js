const { getUptimes } = require('../utils/uptime');

module.exports = {
    name: "ping",
    aliases: ["p", "pong"],
    category: "general",
    desc: "Affiche la latence, l'uptime global et l'uptime de la session",
    async execute(sock, msg, args, cmd) {
        const cfg = sock.config || {};
        const jid = msg.key.remoteJid;
        const start = Date.now();

        // Message de mesure
        const sent = await sock.sendMessage(jid, {
            text: `🏓 *${cfg.botName || 'MARCO-XMD'}* : mesure en cours...`
        }, { quoted: msg });

        const latency = Date.now() - start;
        const { global, session } = getUptimes(sock);
        const platform = process.platform;
        const memUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);

        const text = `⚡ *${cfg.botName || 'MARCO-XMD'} PING*\n\n` +
            `📡 *Latence* : ${latency} ms\n` +
            `🌐 *Uptime global* : ${global}\n` +
            `🔌 *Uptime session* : ${session}\n` +
            `💻 *Plateforme* : ${platform}\n` +
            `💾 *Mémoire* : ${memUsage} Mo\n\n` +
            `> Powered by ©Mr Marco`;

        try {
            await sock.sendMessage(jid, { text, edit: sent.key });
        } catch {
            await sock.sendMessage(jid, { text }, { quoted: msg });
        }
    }
};
