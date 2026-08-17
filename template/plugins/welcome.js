const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'welcome',
    alias: ['wlc'],
    category: 'admin',
    desc: 'Active ou désactive le message de bienvenue',
    async execute(sock, msg, args, cmd) {
        const config = sock.config;
        const jid = msg.key.remoteJid;
        const action = args[0]?.toLowerCase();

        if (action === 'on' || action === 'true') {
            config.welcome = true;
        } else if (action === 'off' || action === 'false') {
            config.welcome = false;
        } else {
            return sock.sendMessage(jid, { text: `Utilisation : ${config.prefix}welcome on/off` }, { quoted: msg });
        }

        const sessionID = sock.user.id.split(':')[0];
        const configPath = path.join(__dirname, '..', '..', 'sessions', sessionID, 'config.json');
        fs.mkdirSync(path.dirname(configPath), { recursive: true });
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

        await sock.sendMessage(jid, { text: `✅ Welcome ${config.welcome ? 'activé' : 'désactivé'}.` }, { quoted: msg });
    }
};
