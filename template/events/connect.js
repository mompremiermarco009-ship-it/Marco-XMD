// events/connect.js — message de connexion avec logo URL
module.exports = {
    name: "connection.update",
    async execute(sock, update) {
        if (update.connection !== "open") return;
        if (!sock.isReady) return;

        const cfg = sock.config || {};
        const myJid = sock.user.id.replace(/:\d+/, "") + "@s.whatsapp.net";
        const emoji = cfg.emoji || "🍷";
        const botName = cfg.botName || "Bot";
        const prefix = cfg.prefix || ".";
        const logoConnect = cfg.logoConnect;

        // Message avec logo si URL définie
        if (logoConnect) {
            await sock.sendMessage(myJid, {
                image: { url: logoConnect },
                caption: `${emoji} *${botName}* est en ligne.\n\nTape *${prefix}menu* pour voir les commandes.`
            }).catch(() => {});
        } else {
            await sock.sendMessage(myJid, {
                text: `${emoji} *${botName}* est en ligne.\n\nTape *${prefix}menu* pour voir les commandes.`
            }).catch(() => {});
        }

        console.log(`✅ Connexion signalée pour ${myJid}`);
    }
};
