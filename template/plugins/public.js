const fs = require('fs');
const path = require('path');
const { isAuthorized } = require('../utils/auth');

module.exports = {
    name: 'public',
    alias: ['prive', 'privé', 'self'],
    category: 'owner',
    desc: 'Bascule entre le mode public et privé',
    async execute(sock, msg, args, cmd) {
        const config = sock.config;
        const jid = msg.key.remoteJid;

        if (!isAuthorized(sock, msg, config)) {
            return sock.sendMessage(jid, { text: '❌ Commande réservée au propriétaire.' }, { quoted: msg });
        }

        const action = args[0]?.toLowerCase();
        if (action === 'on' || action === 'public') {
            config.publicMode = true;
        } else if (action === 'off' || action === 'self' || action === 'prive' || action === 'privé') {
            config.publicMode = false;
        } else {
            const status = config.publicMode ? 'PUBLIC' : 'PRIVÉ';
            return sock.sendMessage(jid, { text: `Mode actuel : *${status}*` }, { quoted: msg });
        }

        const sessionID = sock.user.id.split(':')[0];
        const configPath = path.join(__dirname, '..', '..', 'sessions', sessionID, 'config.json');
        fs.mkdirSync(path.dirname(configPath), { recursive: true });
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

        await sock.sendMessage(jid, { text: `✅ Mode ${config.publicMode ? 'PUBLIC' : 'PRIVÉ'} activé.` }, { quoted: msg });
    }
};
