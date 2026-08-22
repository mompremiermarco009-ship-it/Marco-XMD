// plugins/add.js – version améliorée multi-numéros et mentions
module.exports = {
    name: 'add',
    aliases: ['ajouter', 'invite'],
    description: 'Ajoute un ou plusieurs membres au groupe',
    usage: '.add <num1> <num2> ... ou .add @user @user2',
    async execute(sock, message, args) {
        const jid = message.key.remoteJid;
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: '❌ Cette commande ne fonctionne que dans les groupes.' }, { quoted: message });
        }

        const rawNumbers = args.map(a => a.replace(/[^0-9]/g, '')).filter(n => n.length >= 10);
        const mentions = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

        if (rawNumbers.length === 0 && mentions.length === 0) {
            return sock.sendMessage(jid, { text: '❌ Veuillez fournir au moins un numéro ou mentionner un membre.\nExemple : .add 509xxxxxxxx 509yyyyyyyy' }, { quoted: message });
        }

        let targets = rawNumbers.map(n => n + '@s.whatsapp.net');
        for (const m of mentions) {
            if (!targets.includes(m)) targets.push(m);
        }

        try {
            const metadata = await sock.groupMetadata(jid);
            const participants = metadata.participants;

            const sender = message.key.participant || message.key.remoteJid;
            const senderInfo = participants.find(p => p.id === sender);
            if (!senderInfo || (senderInfo.admin !== 'admin' && senderInfo.admin !== 'superadmin')) {
                return sock.sendMessage(jid, { text: '❌ Vous devez être administrateur pour ajouter des membres.' }, { quoted: message });
            }

            const botLid = sock.user?.lid || '';
            const botJid = sock.user?.id || '';
            const botNum = botJid.split(':')[0].replace(/[^0-9]/g, '');
            let botInfo = participants.find(p => p.id === botLid || p.id === botJid || p.id.includes(botNum));

            if (!botInfo || (botInfo.admin !== 'admin' && botInfo.admin !== 'superadmin')) {
                return sock.sendMessage(jid, { text: '❌ Le bot doit être administrateur pour ajouter des membres.' }, { quoted: message });
            }

            const alreadyMember = targets.filter(t => participants.some(p => p.id === t));
            const toAdd = targets.filter(t => !participants.some(p => p.id === t));

            if (toAdd.length === 0) {
                return sock.sendMessage(jid, { text: '❌ Tous ces membres sont déjà dans le groupe.' }, { quoted: message });
            }

            await sock.groupParticipantsUpdate(jid, toAdd, 'add');

            let reply = '✅ Membres ajoutés :\n';
            for (const t of toAdd) {
                reply += `- @${t.split('@')[0]}\n`;
            }
            if (alreadyMember.length > 0) {
                reply += '\n⚠️ Déjà membres :\n';
                for (const t of alreadyMember) {
                    reply += `- @${t.split('@')[0]}\n`;
                }
            }

            await sock.sendMessage(jid, {
                text: reply,
                mentions: toAdd
            }, { quoted: message });

        } catch (err) {
            console.error('Erreur plugin add:', err);
            await sock.sendMessage(jid, {
                text: `⚠️ Impossible d'ajouter ces numéros. Vérifiez que les numéros sont valides et acceptent les invitations de groupe.\nErreur : ${err.message}`
            }, { quoted: message });
        }
    }
};
