const { isAuthorized } = require('../utils/auth');

module.exports = {
    name: 'groups',
    aliases: ['groupes', 'listgroups', 'grouplist'],
    category: 'group',
    desc: 'Liste tous les groupes où le bot est membre',
    usage: '.groups',

    async execute(sock, msg) {
        const jid = msg.key.remoteJid;
        const cfg = sock.config || {};
        const owner = cfg.ownerName || '𝑀𝑟 𝑀𝑎𝑟𝑐𝑜';

        if (!isAuthorized(sock, msg, cfg)) {
            return sock.sendMessage(jid, { text: '❌ Commande réservée au propriétaire.' }, { quoted: msg });
        }

        try {
            await sock.sendMessage(jid, { react: { text: '🔍', key: msg.key } });

            const groups = await sock.groupFetchAllParticipating();
            const list = Object.values(groups);

            if (list.length === 0) {
                return sock.sendMessage(jid, {
                    text: `❌ Aucun groupe.\n\n> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`
                }, { quoted: msg });
            }

            let text = `╔════════════════════════╗\n`;
            text += `║  📚  𝐆𝐑𝐎𝐔𝐏𝐄𝐒 (${list.length})\n`;
            text += `╚════════════════════════╝\n\n`;

            for (let i = 0; i < list.length; i++) {
                const g = list[i];
                const count = g.participants?.length || 0;
                text += `┃  *${i + 1}.* ${g.subject || 'Sans nom'}\n`;
                text += `┃     🆔 \`${g.id}\`\n`;
                text += `┃     👥 ${count} membres\n\n`;

                if (text.length > 3500) {
                    await sock.sendMessage(jid, { text }, { quoted: msg });
                    text = '';
                    await new Promise(r => setTimeout(r, 500));
                }
            }

            if (text.trim()) {
                text += `> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`;
                await sock.sendMessage(jid, { text }, { quoted: msg });
            }
        } catch (err) {
            console.error('Erreur groups:', err.message);
            await sock.sendMessage(jid, { text: `❌ Erreur.\n\n> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}` }, { quoted: msg });
        }
    }
};
