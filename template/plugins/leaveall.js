const fs = require('fs');
const path = require('path');
const { isAuthorized } = require('../utils/auth');

module.exports = {
    name: 'leaveall',
    aliases: ['quittetout', 'leavegroups'],
    category: 'owner',
    desc: 'Quitte tous les groupes sauf ceux à conserver',
    usage: '.leaveall [confirm]',

    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        const cfg = sock.config || {};
        const owner = cfg.ownerName || '𝑀𝑟 𝑀𝑎𝑟𝑐𝑜';

        if (!isAuthorized(sock, msg, cfg)) {
            return sock.sendMessage(jid, { text: '❌ Réservé au propriétaire.' }, { quoted: msg });
        }

        const force = args[0]?.toLowerCase() === 'confirm';

        try {
            const groups = await sock.groupFetchAllParticipating();
            const list = Object.values(groups);

            if (list.length === 0) {
                return sock.sendMessage(jid, { text: 'ℹ️ Aucun groupe.' }, { quoted: msg });
            }

            const keepGroups = Array.isArray(cfg.keepGroups) ? cfg.keepGroups : [];

            let toLeave = [];
            if (force || keepGroups.length === 0) {
                toLeave = list;
                if (!force && keepGroups.length === 0) {
                    return sock.sendMessage(jid, {
                        text: `⚠️ Aucun groupe à conserver.\nTapez *.leaveall confirm* pour quitter TOUS les groupes.\n\n> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`
                    }, { quoted: msg });
                }
            } else {
                toLeave = list.filter(g => !keepGroups.includes(g.id));
            }

            if (toLeave.length === 0) {
                return sock.sendMessage(jid, { text: '✅ Déjà uniquement dans les groupes à conserver.' }, { quoted: msg });
            }

            await sock.sendMessage(jid, { text: `🔄 Départ de ${toLeave.length} groupe(s)...` }, { quoted: msg });

            let ok = 0, fail = 0;
            for (const g of toLeave) {
                try {
                    await sock.groupLeave(g.id);
                    ok++;
                    await new Promise(r => setTimeout(r, 2000));
                } catch {
                    fail++;
                }
            }

            let text = `╔════════════════════════╗\n`;
            text += `║   🚪  𝐑𝐄́𝐒𝐔𝐋𝐓𝐀𝐓\n`;
            text += `╚════════════════════════╝\n\n`;
            text += `┃  ✅  Quittés : ${ok}\n`;
            text += `┃  ❌  Échecs  : ${fail}\n`;
            if (keepGroups.length > 0) text += `┃  🛡️  Conservés : ${keepGroups.length}\n`;
            text += `\n> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`;

            await sock.sendMessage(jid, { text }, { quoted: msg });
        } catch (err) {
            console.error('Erreur leaveall:', err.message);
            await sock.sendMessage(jid, { text: '❌ Erreur.' }, { quoted: msg });
        }
    }
};
