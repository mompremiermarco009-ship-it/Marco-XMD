// plugins/warn.js
const fs = require('fs');
const path = require('path');

const getWarnsPath = (groupId) => path.join(__dirname, '..', 'data', `warns_${groupId}.json`);

function readWarns(groupId) {
    const file = getWarnsPath(groupId);
    if (!fs.existsSync(file)) return {};
    try {
        return JSON.parse(fs.readFileSync(file, 'utf-8'));
    } catch { return {}; }
}

function saveWarns(groupId, data) {
    const file = getWarnsPath(groupId);
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

module.exports = {
    name: 'warn',
    aliases: ['avertir'],
    description: 'Donne un avertissement à un membre (admin)',
    usage: '.warn @user [raison]',

    async execute(sock, message, args, { config }) {
        const jid = message.key.remoteJid;
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: '❌ Uniquement dans un groupe.' }, { quoted: message });
        }

        const metadata = await sock.groupMetadata(jid);
        const sender = message.key.participant;
        const senderInfo = metadata.participants.find(p => p.id === sender);
        if (!senderInfo || (senderInfo.admin !== 'admin' && senderInfo.admin !== 'superadmin')) {
            return sock.sendMessage(jid, { text: '❌ Seuls les administrateurs peuvent avertir.' }, { quoted: message });
        }

        const mentions = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (!mentions.length) {
            return sock.sendMessage(jid, { text: '❌ Mentionnez le membre à avertir.' }, { quoted: message });
        }
        const target = mentions[0];

        const reason = args.join(' ').trim() || 'Aucune raison spécifiée';
        const warns = readWarns(jid);
        if (!warns[target]) warns[target] = [];
        warns[target].push({ reason, date: new Date().toISOString(), by: sender });
        saveWarns(jid, warns);

        const count = warns[target].length;
        await sock.sendMessage(jid, {
            text: `⚠️ Avertissement pour @${target.split('@')[0]} (${count}/3)\n📝 Raison : ${reason}`,
            mentions: [target]
        }, { quoted: message });

        if (count >= 3) {
            try {
                await sock.groupParticipantsUpdate(jid, [target], 'remove');
                await sock.sendMessage(jid, { text: `🚫 @${target.split('@')[0]} a été expulsé après 3 avertissements.`, mentions: [target] });
                delete warns[target];
                saveWarns(jid, warns);
            } catch (err) {
                console.error('Erreur kick auto:', err);
            }
        }
    },

    // Exportation des fonctions pour les autres plugins
    readWarns,
    saveWarns
};
