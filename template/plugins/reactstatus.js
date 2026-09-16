const fs = require('fs');
const path = require('path');
const { isAuthorized } = require('../utils/auth');

module.exports = {
    name: 'reactstatus',
    aliases: ['autostatus', 'reactstatut'],
    category: 'owner',
    desc: 'Active ou désactive la réaction auto aux statuts',
    usage: '.reactstatus on/off',

    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        const cfg = sock.config || {};
        const owner = cfg.ownerName || '𝑀𝑟 𝑀𝑎𝑟𝑐𝑜';
        const prefix = cfg.prefix || '.';

        if (!isAuthorized(sock, msg, cfg)) {
            return sock.sendMessage(jid, { text: '❌ Réservé au propriétaire.' }, { quoted: msg });
        }

        const action = (args[0] || '').toLowerCase();
        const enable = action === 'on' || action === 'true' || action === '1';
        const disable = action === 'off' || action === 'false' || action === '0';

        if (!enable && !disable) {
            const status = cfg.reactstatus ? '🟢 ACTIVÉ' : '🔴 DÉSACTIVÉ';
            return sock.sendMessage(jid, {
                text: `╔════════════════════════╗\n` +
                      `║   👀  𝐑𝐄𝐀𝐂𝐓 𝐒𝐓𝐀𝐓𝐔𝐒\n` +
                      `╚════════════════════════╝\n\n` +
                      `┃  Statut : ${status}\n\n` +
                      `╭━━━〔 𝐔𝐭𝐢𝐥𝐢𝐬𝐚𝐭𝐢𝐨𝐧 〕━━━╮\n` +
                      `┃  Ⓐ︎  ${prefix}reactstatus on\n` +
                      `┃  Ⓑ︎  ${prefix}reactstatus off\n` +
                      `╰━━━━━━━━━━━━━━━━━━━━╯\n\n` +
                      `> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`
            }, { quoted: msg });
        }

        cfg.reactstatus = enable;

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
                  `║   👀  𝐑𝐄𝐀𝐂𝐓 𝐒𝐓𝐀𝐓𝐔𝐒\n` +
                  `╚════════════════════════╝\n\n` +
                  `┃  ${enable ? '🟢 Activée' : '🔴 Désactivée'}\n\n` +
                  `> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`
        }, { quoted: msg });
    }
};
