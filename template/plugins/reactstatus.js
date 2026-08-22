const fs = require('fs');
const path = require('path');

module.exports = {
    name: "reactstatus",
    aliases: ["reactstatut"],
    category: "owner",
    desc: "Active ou désactive la réaction automatique aux statuts",
    usage: ".reactstatus on/off",
    async execute(sock, msg, args, cmd) {
        const config = sock.config;
        const jid = msg.key.remoteJid;
        const action = args[0]?.toLowerCase();

        if (action === 'on' || action === 'true') {
            config.reactstatus = true;
        } else if (action === 'off' || action === 'false') {
            config.reactstatus = false;
        } else {
            return sock.sendMessage(jid, { text: `Utilisation : ${config.prefix}reactstatus on/off` }, { quoted: msg });
        }

        const sessionID = sock.user.id.split(':')[0];
        const configPath = path.join(__dirname, '..', '..', 'sessions', sessionID, 'config.json');
        fs.mkdirSync(path.dirname(configPath), { recursive: true });
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

        await sock.sendMessage(jid, { text: `✅ Réaction aux statuts ${config.reactstatus ? 'activée' : 'désactivée'}.` }, { quoted: msg });
    }
};
