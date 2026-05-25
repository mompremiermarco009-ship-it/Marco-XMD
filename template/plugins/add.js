// plugins/add.js
module.exports = {
    name: 'add',
    aliases: ['ajouter', 'invite'],
    description: 'Ajoute un membre au groupe (surveiller numéro)',
    usage: '.add 509xxxxxxxx',

    async execute(sock, message, args) {
        const jid = message.key.remoteJid;
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: '❌ Cette commande ne fonctionne que dans les groupes.' }, { quoted: message });
        }

        const rawNumber = args[0]?.replace(/[^0-9]/g, '');
        if (!rawNumber) {
            return sock.sendMessage(jid, { text: '❌ Veuillez fournir un numéro. Exemple : .add 50941131299' }, { quoted: message });
        }
        const target = rawNumber + '@s.whatsapp.net';

        try {
            const metadata = await sock.groupMetadata(jid);
            const participants = metadata.participants;
            const sender = message.key.participant || message.key.remoteJid;
            const senderInfo = participants.find(p => p.id === sender);
            if (!senderInfo || (senderInfo.admin !== 'admin' && senderInfo.admin !== 'superadmin')) {
                return sock.sendMessage(jid, { text: '❌ Vous devez être administrateur pour ajouter un membre.' }, { quoted: message });
            }

            // 🔧 RECHERCHE DU BOT PAR LID (prioritaire) puis par numéro
            const botLid = sock.user?.lid;
            const botNum = sock.user.id.split(':')[0].replace(/[^0-9]/g, '');
            let botInfo = null;
            if (botLid) {
                botInfo = participants.find(p => p.id === botLid);
            }
            if (!botInfo) {
                botInfo = participants.find(p => p.id.includes(botNum));
            }

            if (!botInfo || (botInfo.admin !== 'admin' && botInfo.admin !== 'superadmin')) {
                return sock.sendMessage(jid, { text: '❌ Le bot doit être administrateur pour ajouter un membre.' }, { quoted: message });
            }

            // Vérifier si déjà membre
            const exists = participants.some(p => p.id === target);
            if (exists) {
                return sock.sendMessage(jid, { text: '❌ Ce numéro est déjà dans le groupe.' }, { quoted: message });
            }

            // Ajouter
            await sock.groupParticipantsUpdate(jid, [target], 'add');
            await sock.sendMessage(jid, {
                text: `✅ @${rawNumber} a été ajouté au groupe.`,
                mentions: [target]
            }, { quoted: message });

        } catch (err) {
            console.error('Erreur plugin add:', err);
            await sock.sendMessage(jid, {
                text: `⚠️ Impossible d'ajouter ce numéro. Vérifiez que le numéro existe et accepte les invitations de groupe.`
            }, { quoted: message });
        }
    }
};
