const fs = require('fs');
const path = require('path');
const { isAuthorized } = require('../utils/auth');

module.exports = {
    name: 'setprefix',
    aliases: ['prefix', 'changeprefix'],
    category: 'owner',
    desc: 'Change le préfixe des commandes',
    usage: '.setprefix <nouveau_préfixe>',

    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        const cfg = sock.config || {};
        const owner = cfg.ownerName || '𝑀𝑟 𝑀𝑎𝑟𝑐𝑜';

        if (!isAuthorized(sock, msg, cfg)) {
            return sock.sendMessage(jid, { text: '❌ Réservé au propriétaire.' }, { quoted: msg });
        }

        if (!args[0]) {
            return sock.sendMessage(jid, {
                text: `❌ *Utilisation :*\n` +
                      `• .setprefix !\n` +
                      `• .setprefix #\n\n` +
                      `Préfixe actuel : *${cfg.prefix || '.'}*\n\n` +
                      `> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`
            }, { quoted: msg });
        }

        const newPrefix = args[0];
        if (newPrefix.length > 3) {
            return sock.sendMessage(jid, { text: '❌ Maximum 3 caractères.' }, { quoted: msg });
        }

        const oldPrefix = cfg.prefix || '.';
        cfg.prefix = newPrefix;

        try {
            const sessionID = sock.user.id.split(':')[0].replace(/[^0-9]/g, '');
            const configPath = path.join(__dirname, '..', '..', 'sessions', sessionID, 'config.json');
            fs.mkdirSync(path.dirname(configPath), { recursive: true });
            fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2));
        } catch (err) {
            console.error('Erreur sauvegarde:', err.message);
        }

        await sock.sendMessage(jid, {
            text: `╔════════════════════════╗\n` +
                  `║   ⚙️  𝐏𝐑𝐄́𝐅𝐈𝐗𝐄 𝐂𝐇𝐀𝐍𝐆𝐄́\n` +
                  `╚════════════════════════╝\n\n` +
                  `┃  📦  Ancien : *${oldPrefix}*\n` +
                  `┃  🆕  Nouveau : *${newPrefix}*\n\n` +
                  `💡 Exemple : *${newPrefix}menu*\n\n` +
                  `> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`
        }, { quoted: msg });
    }
};
