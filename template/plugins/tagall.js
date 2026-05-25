// plugins/tagall.js
const config = require('../config.json');

module.exports = {
    name: 'tagall',
    aliases: ['everyone', 'all', 'tous', 'tag'],
    description: 'Mentionne tous les membres du groupe avec un message',
    usage: '.tagall [message]',

    async execute(sock, message, args) {
        const jid = message.key.remoteJid;
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: '❌ Cette commande ne fonctionne que dans les groupes.' }, { quoted: message });
        }

        try {
            const metadata = await sock.groupMetadata(jid);
            const participants = metadata.participants.map(p => p.id);
            const groupName = metadata.subject;
            const membersCount = metadata.participants.length;
            const adminsCount = metadata.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin').length;
            const messageText = args.join(' ') || 'Salut tout le monde !';

            // Construction d'une liste de mentions bien formatée
            const mentionList = participants.map(p => `┝ ➩ @${p.split('@')[0]}`).join('\n');

            const caption = `┌─────────────────────
┝ ➩ 👥 *TAG ALL*
└─────────────────────
┝ ➩ Groupe : *${groupName}*
┝ ➩ Membres : ${membersCount}
┝ ➩ Admins : ${adminsCount}
┝ ➩ Message : ${messageText}
└─────────────────────
${mentionList}
└─────────────────────
> Powered by ©Mr Marco`;

            // Essayer de récupérer la photo de groupe
            let profilePicUrl = null;
            try {
                profilePicUrl = await sock.profilePictureUrl(jid, 'image');
            } catch (e) {
                // Pas de photo, on envoie juste le texte
            }

            if (profilePicUrl) {
                await sock.sendMessage(jid, {
                    image: { url: profilePicUrl },
                    caption: caption,
                    mentions: participants
                }, { quoted: message });
            } else {
                await sock.sendMessage(jid, {
                    text: caption,
                    mentions: participants
                }, { quoted: message });
            }

        } catch (err) {
            console.error('Erreur plugin tagall:', err);
            await sock.sendMessage(jid, { text: '⚠️ Impossible de récupérer la liste des membres.' }, { quoted: message });
        }
    }
};
