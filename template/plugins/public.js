const fs = require('fs');
const path = require('path');
const { isAuthorized } = require('../utils/auth');

module.exports = {
    name: 'public',
    alias: ['prive', 'privé', 'self'],
    category: 'owner',
    desc: 'Bascule entre le mode public et privé (par session)',
    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;

        // Vérifier que l'utilisateur est autorisé (propriétaire de la session)
        if (!isAuthorized(sock, msg, sock.config)) {
            return sock.sendMessage(jid, { text: '❌ Commande réservée au propriétaire.' }, { quoted: msg });
        }

        // Récupérer la config actuelle de la session
        const cfg = sock.config || require('../config.json');
        const action = args[0]?.toLowerCase();

        if (action === 'on' || action === 'public') {
            cfg.publicMode = true;
        } else if (action === 'off' || action === 'self' || action === 'prive' || action === 'privé') {
            cfg.publicMode = false;
        } else {
            const status = cfg.publicMode ? "PUBLIC" : "PRIVÉ";
            return sock.sendMessage(jid, {
                text: `⚙️ *MODE ACTUEL : ${status}*\n\nUtilisation :\n- .public on  → mode public\n- .public off → mode privé`
            }, { quoted: msg });
        }

        // Sauvegarder dans le fichier de config de la session
        const sessionID = sock.user.id.split(':')[0].replace(/[^0-9]/g, '');
        const sessionConfigPath = path.join(__dirname, '..', 'sessions', sessionID, 'config.json');
        try {
            fs.mkdirSync(path.dirname(sessionConfigPath), { recursive: true });
            fs.writeFileSync(sessionConfigPath, JSON.stringify(cfg, null, 2));
        } catch (e) {
            console.error('Erreur sauvegarde config session:', e.message);
        }

        // Mettre à jour la config en mémoire
        sock.config = cfg;

        const newStatus = cfg.publicMode ? 'PUBLIC' : 'PRIVÉ';
        await sock.sendMessage(jid, { text: `✅ Mode *${newStatus}* activé pour cette session.` }, { quoted: msg });
    }
};
