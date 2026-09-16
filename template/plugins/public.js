const fs = require('fs');
const path = require('path');
const { isAuthorized } = require('../utils/auth');

module.exports = {
    name: 'public',
    aliases: ['self', 'prive', 'privé'],
    category: 'owner',
    desc: 'Bascule entre le mode public et privé',
    usage: '.public on/off  ou  .self on/off',

    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        const cfg = sock.config || {};
        const owner = cfg.ownerName || '𝑀𝑟 𝑀𝑎𝑟𝑐𝑜';
        const prefix = cfg.prefix || '.';

        if (!isAuthorized(sock, msg, cfg)) {
            return sock.sendMessage(jid, { text: '❌ Réservé au propriétaire.' }, { quoted: msg });
        }

        const action = (args[0] || '').toLowerCase();
        const modePublic = action === 'on' || action === 'public';
        const modePrive = action === 'off' || action === 'self' || action === 'prive' || action === 'privé';

        if (!modePublic && !modePrive) {
            const current = cfg.publicMode ? 'PUBLIC' : 'PRIVÉ';
            return sock.sendMessage(jid, {
                text: `╔════════════════════════╗\n` +
                      `║   ⚙️  𝐌𝐎𝐃𝐄 𝐀𝐂𝐓𝐔𝐄𝐋\n` +
                      `╚════════════════════════╝\n\n` +
                      `┃  🌍  Mode : *${current}*\n\n` +
                      `╭━━━〔 𝐔𝐭𝐢𝐥𝐢𝐬𝐚𝐭𝐢𝐨𝐧 〕━━━╮\n` +
                      `┃  Ⓐ︎  ${prefix}public on\n` +
                      `┃  Ⓑ︎  ${prefix}self off\n` +
                      `╰━━━━━━━━━━━━━━━━━━━━╯\n\n` +
                      `> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`
            }, { quoted: msg });
        }

        cfg.publicMode = modePublic;

        try {
            const sessionID = sock.user.id.split(':')[0].replace(/[^0-9]/g, '');
            const configPath = path.join(__dirname, '..', '..', 'sessions', sessionID, 'config.json');
            fs.mkdirSync(path.dirname(configPath), { recursive: true });
            fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2));
        } catch (err) {
            console.error('Erreur sauvegarde:', err.message);
        }

        const emoji = modePublic ? '🌍' : '🔐';
        const label = modePublic ? 'PUBLIC' : 'PRIVÉ';
        const info = modePublic
            ? 'Tout le monde peut utiliser le bot.'
            : 'Seul le propriétaire peut utiliser le bot.';

        await sock.sendMessage(jid, {
            text: `╔════════════════════════╗\n` +
                  `║   ${emoji}  𝐌𝐎𝐃𝐄 ${label}\n` +
                  `╚════════════════════════╝\n\n` +
                  `┃  ${emoji}  ${info}\n\n` +
                  `> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`
        }, { quoted: msg });
    }
};
