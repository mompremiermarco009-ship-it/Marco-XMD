const { isAuthorized, isGroupAdmin, isBotAdmin, normalizeNumber } = require('../utils/auth');

module.exports = {
    name: 'add',
    aliases: ['ajouter', 'invite'],
    category: 'group',
    desc: 'Ajoute un ou plusieurs membres au groupe',
    usage: '.add <numéro> [<numéro>] ou .add @user',

    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        const cfg = sock.config || {};
        const owner = cfg.ownerName || '𝑀𝑟 𝑀𝑎𝑟𝑐𝑜';

        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: '❌ Commande utilisable uniquement dans un groupe.' }, { quoted: msg });
        }

        // Récupérer les numéros et mentions
        const rawNumbers = args.map(a => normalizeNumber(a)).filter(n => n.length >= 10);
        const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

        if (rawNumbers.length === 0 && mentions.length === 0) {
            return sock.sendMessage(jid, {
                text: `❌ *Utilisation :*\n• .add 509xxxxxxxx\n• .add @user\n\n> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`
            }, { quoted: msg });
        }

        // Vérifier les permissions
        const senderJid = msg.key.participant || msg.key.remoteJid;
        const senderAdmin = await isGroupAdmin(sock, jid, senderJid);
        const isOwner = isAuthorized(sock, msg, cfg);
        const botAdmin = await isBotAdmin(sock, jid);

        if (!senderAdmin && !isOwner) {
            return sock.sendMessage(jid, { text: '❌ Vous devez être admin du groupe.' }, { quoted: msg });
        }
        if (!botAdmin) {
            return sock.sendMessage(jid, { text: '❌ Je dois être admin pour ajouter des membres.' }, { quoted: msg });
        }

        // Construire la liste des cibles
        let targets = rawNumbers.map(n => n + '@s.whatsapp.net');
        for (const m of mentions) {
            if (!targets.includes(m)) targets.push(m);
        }

        try {
            const meta = await sock.groupMetadata(jid);
            const participants = meta.participants.map(p => p.id);

            const alreadyMember = targets.filter(t => participants.includes(t));
            const toAdd = targets.filter(t => !participants.includes(t));

            if (toAdd.length === 0) {
                return sock.sendMessage(jid, { text: '❌ Tous ces membres sont déjà dans le groupe.' }, { quoted: msg });
            }

            await sock.groupParticipantsUpdate(jid, toAdd, 'add');

            let text = `╔════════════════════════╗\n`;
            text += `║   ✅  𝐀𝐣𝐨𝐮𝐭𝐞́(𝐬)\n`;
            text += `╚════════════════════════╝\n\n`;

            for (const t of toAdd) text += `┃  ✅  @${t.split('@')[0]}\n`;

            if (alreadyMember.length > 0) {
                text += `\n╭━━━〔 ⚠️ 𝐃𝐞́𝐣𝐚̀ 𝐦𝐞𝐦𝐛𝐫𝐞𝐬 〕━━━╮\n`;
                for (const t of alreadyMember) text += `┃  ⚠️  @${t.split('@')[0]}\n`;
                text += `╰━━━━━━━━━━━━━━━━━━━━╯\n`;
            }

            text += `\n> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`;

            await sock.sendMessage(jid, { text, mentions: toAdd }, { quoted: msg });
        } catch (err) {
            console.error('Erreur add:', err.message);
            await sock.sendMessage(jid, { text: `⚠️ Impossible d'ajouter. Vérifiez que les numéros acceptent les invitations.\n\n> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}` }, { quoted: msg });
        }
    }
};
