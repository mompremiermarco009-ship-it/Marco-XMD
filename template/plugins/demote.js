const { isAuthorized, isGroupAdmin, isBotAdmin, normalizeNumber, extractTarget } = require('../utils/auth');

module.exports = {
    name: 'demote',
    aliases: ['unadmin', 'removeadmin', 'deladmin'],
    category: 'group',
    desc: 'Rétrograde un admin en simple membre',
    usage: '.demote @user / .demote <numéro>',

    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        const cfg = sock.config || {};
        const owner = cfg.ownerName || '𝑀𝑟 𝑀𝑎𝑟𝑐𝑜';

        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: '❌ Uniquement dans un groupe.' }, { quoted: msg });
        }

        const target = extractTarget(msg, args);
        if (!target) {
            return sock.sendMessage(jid, { text: '❌ Mentionnez ou donnez un numéro.' }, { quoted: msg });
        }

        const senderJid = msg.key.participant || msg.key.remoteJid;
        const senderAdmin = await isGroupAdmin(sock, jid, senderJid);
        const isOwner = isAuthorized(sock, msg, cfg);
        const botAdmin = await isBotAdmin(sock, jid);

        if (!senderAdmin && !isOwner) return sock.sendMessage(jid, { text: '❌ Vous devez être admin.' }, { quoted: msg });
        if (!botAdmin) return sock.sendMessage(jid, { text: '❌ Je dois être admin.' }, { quoted: msg });

        try {
            const meta = await sock.groupMetadata(jid);
            const targetP = meta.participants.find(p => p.id === target);
            if (!targetP) return sock.sendMessage(jid, { text: '❌ Ce membre n\'est pas dans le groupe.' }, { quoted: msg });
            if (targetP.admin !== 'admin' && targetP.admin !== 'superadmin') {
                return sock.sendMessage(jid, { text: '❌ Ce membre n\'est pas administrateur.' }, { quoted: msg });
            }

            await sock.groupParticipantsUpdate(jid, [target], 'demote');

            const text = `╔════════════════════════╗\n` +
                         `║   ⬇️  𝐑𝐞́𝐭𝐫𝐨𝐠𝐫𝐚𝐝𝐚𝐭𝐢𝐨𝐧\n` +
                         `╚════════════════════════╝\n\n` +
                         `┃  ⬇️  @${normalizeNumber(target)} n'est plus admin.\n\n` +
                         `> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`;

            await sock.sendMessage(jid, { text, mentions: [target] }, { quoted: msg });
        } catch (err) {
            console.error('Erreur demote:', err.message);
            await sock.sendMessage(jid, { text: '⚠️ Erreur lors de la rétrogradation.' }, { quoted: msg });
        }
    }
};
