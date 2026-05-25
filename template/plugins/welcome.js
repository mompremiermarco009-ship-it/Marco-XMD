const fs = require('fs');
const path = require('path');
const { isAuthorized } = require('../utils/auth');

module.exports = {
    name: "welcome",
    aliases: ["accueil"],
    desc: "Active/désactive le message de bienvenue (par session)",
    usage: ".welcome on/off",
    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        const cfg = sock.config || require('../config.json');

        if (!isAuthorized(sock, msg, cfg)) {
            return sock.sendMessage(jid, { text: "❌ Commande réservée au propriétaire." }, { quoted: msg });
        }

        const action = args[0]?.toLowerCase();
        if (action === 'on') {
            cfg.welcome = true;
        } else if (action === 'off') {
            cfg.welcome = false;
        } else {
            return sock.sendMessage(jid, {
                text: `⚙️ *Welcome* est actuellement *${cfg.welcome ? 'ON 🟢' : 'OFF 🔴'}*.\nUtilisation : .welcome on/off`
            }, { quoted: msg });
        }

        // Sauvegarde dans le fichier de config de la session
        const sessionID = sock.user.id.split(':')[0].replace(/[^0-9]/g, '');
        const sessionConfigPath = path.join(__dirname, '..', 'sessions', sessionID, 'config.json');
        try {
            fs.mkdirSync(path.dirname(sessionConfigPath), { recursive: true });
            fs.writeFileSync(sessionConfigPath, JSON.stringify(cfg, null, 2));
        } catch (e) {
            console.error('Erreur sauvegarde config session:', e.message);
        }

        sock.config = cfg; // mise à jour en mémoire
        await sock.sendMessage(jid, { text: `✅ Welcome *${cfg.welcome ? 'activé' : 'désactivé'}* pour cette session.` }, { quoted: msg });
    }
};
