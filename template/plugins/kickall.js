const { isAuthorized, isBotAdmin, normalizeNumber } = require('../utils/auth');
const delay = ms => new Promise(res => setTimeout(res, ms));

module.exports = {
    name: 'kickall',
    aliases: ['purge'],
    category: 'group',
    desc: 'Expulse tous les non-admins (owner uniquement)',
    usage: '.kickall',

    async execute(sock, msg) {
        const jid = msg.key.remoteJid;
        const cfg = sock.config || {};
        const owner = cfg.ownerName || '𝑀𝑟 𝑀𝑎𝑟𝑐𝑜';

        if (!jid.endsWith('@g.us')) return;
        if (!isAuthorized(sock, msg, cfg)) {
            return sock.sendMessage(jid, { text: '❌ Commande réservée au propriétaire.' }, { quoted: msg });
        }

        const botAdmin = await isBotAdmin(sock, jid);
        if (!botAdmin) {
            return sock.sendMessage(jid, { text: '❌ Je dois être admin pour faire ça.' }, { quoted: msg });
        }

        try {
            const meta = await sock.groupMetadata(jid);
            const participants = meta.participants;
            const botNumber = normalizeNumber(sock.user.id);
            const ownerNum = normalizeNumber(cfg.ownerNumber);

            const victims = participants.filter(p => {
                const num = normalizeNumber(p.id);
                const isAdmin = p.admin === 'admin' || p.admin === 'superadmin';
                const isBot = num === botNumber;
                const isOwner = num === ownerNum;
                return !isAdmin && !isBot && !isOwner;
            }).map(p => p.id);

            if (victims.length === 0) {
                return sock.sendMessage(jid, { text: '✨ Le groupe est déjà purifié.' }, { quoted: msg });
            }

            await sock.sendMessage(jid, {
                text: `🛡️ *𝐍𝐄𝐓𝐓𝐎𝐘𝐀𝐆𝐄*\n\nCibles : ${victims.length}\n\n> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`
            }, { quoted: msg });

            for (let i = 0; i < victims.length; i += 100) {
                const chunk = victims.slice(i, i + 100);
                await sock.groupParticipantsUpdate(jid, chunk, 'remove');
                await delay(2500);
            }

            await sock.sendMessage(jid, { text: `✅ *𝐄́𝐏𝐔𝐑𝐀𝐓𝐈𝐎𝐍 𝐓𝐄𝐑𝐌𝐈𝐍𝐄́𝐄*` });
        } catch (err) {
            console.error('Erreur kickall:', err.message);
            await sock.sendMessage(jid, { text: '❌ Erreur lors de l\'épuration.' });
        }
    }
};
