const { isAuthorized, isGroupAdmin, isBotAdmin, normalizeNumber, extractTarget } = require('../utils/auth');

module.exports = {
    name: 'kick',
    aliases: ['expulser', 'remove'],
    category: 'group',
    desc: 'Expulse un membre du groupe',
    usage: '.kick @user / .kick <numéro> / répondre + .kick',

    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        const cfg = sock.config || {};
        const owner = cfg.ownerName || '𝑀𝑟 𝑀𝑎𝑟𝑐𝑜';

        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: '❌ Commande utilisable uniquement dans un groupe.' }, { quoted: msg });
        }

        const target = extractTarget(msg, args);
        if (!target) {
            return sock.sendMessage(jid, {
                text: `❌ *Utilisation :*\n• .kick @user\n• .kick 509xxxxxxxx\n• Répondez à un message + .kick\n\n> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`
            }, { quoted: msg });
        }

        const senderJid = msg.key.participant || msg.key.remoteJid;
        const senderAdmin = await isGroupAdmin(sock, jid, senderJid);
        const isOwner = isAuthorized(sock, msg, cfg);
        const botAdmin = await isBotAdmin(sock, jid);

        if (!senderAdmin && !isOwner) {
            return sock.sendMessage(jid, { text: '❌ Vous devez être admin du groupe.' }, { quoted: msg });
        }
        if (!botAdmin) {
            return sock.sendMessage(jid, { text: '❌ Je dois être admin pour expulser.' }, { quoted: msg });
        }

        try {
            const meta = await sock.groupMetadata(jid);
            const targetParticipant = meta.participants.find(p => p.id === target);

            if (!targetParticipant) {
                return sock.sendMessage(jid, { text: '❌ Ce membre n\'est pas dans le groupe.' }, { quoted: msg });
            }

            const targetNumber = normalizeNumber(target);
            const botNumber = normalizeNumber(sock.user.id);
            const ownerNum = normalizeNumber(cfg.ownerNumber);

            if (targetParticipant.admin === 'admin' || targetParticipant.admin === 'superadmin') {
                return sock.sendMessage(jid, { text: '🚫 Impossible d\'expulser un administrateur.' }, { quoted: msg });
            }
            if (targetNumber === botNumber) {
                return sock.sendMessage(jid, { text: '🚫 Je ne peux pas m\'auto-expulser.' }, { quoted: msg });
            }
            if (targetNumber === ownerNum) {
                return sock.sendMessage(jid, { text: '🚫 Impossible d\'expulser le propriétaire.' }, { quoted: msg });
            }

            await sock.groupParticipantsUpdate(jid, [target], 'remove');

            const text = `╔════════════════════════╗\n` +
                         `║   👢  𝐄𝐱𝐩𝐮𝐥𝐬𝐢𝐨𝐧\n` +
                         `╚════════════════════════╝\n\n` +
                         `┃  👢  @${targetNumber} a été expulsé.\n\n` +
                         `> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`;

            await sock.sendMessage(jid, { text, mentions: [target] }, { quoted: msg });
        } catch (err) {
            console.error('Erreur kick:', err.message);
            await sock.sendMessage(jid, { text: '⚠️ Erreur lors de l\'expulsion.' }, { quoted: msg });
        }
    }
};
