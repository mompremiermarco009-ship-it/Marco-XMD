// plugins/jid.js
module.exports = {
    name: 'jid',
    aliases: ['getjid', 'groupid', 'channelid'],
    description: 'Affiche le JID du groupe actuel ou extrait le JID d\'un lien WhatsApp',
    usage: '.jid [lien]',

    async execute(sock, message, args, { config }) {
        const jid = message.key.remoteJid;
        const input = args[0]?.trim();

        // 1. Si aucun argument, on retourne le JID du contexte actuel (groupe ou chaîne)
        if (!input) {
            if (jid.endsWith('@g.us') || jid.includes('@newsletter')) {
                return sock.sendMessage(jid, { text: `📌 JID : *${jid}*` }, { quoted: message });
            }
            // Si on est en privé, donner un exemple
            return sock.sendMessage(jid, {
                text: '❌ En privé, utilisez la commande avec un lien.\nExemple : *.jid https://chat.whatsapp.com/xyz* ou *.jid https://whatsapp.com/channel/xyz*'
            }, { quoted: message });
        }

        // 2. Lien de groupe WhatsApp
        const groupMatch = input.match(/https:\/\/chat\.whatsapp\.com\/([A-Za-z0-9]+)/);
        if (groupMatch) {
            try {
                const code = groupMatch[1];
                const info = await sock.groupGetInviteInfo(code);
                return sock.sendMessage(jid, {
                    text: `📌 Lien détecté (groupe)\n🔗 Code : ${code}\n🆔 JID : *${info.id}*`
                }, { quoted: message });
            } catch (err) {
                return sock.sendMessage(jid, {
                    text: `❌ Impossible d'obtenir le JID du groupe. Vérifiez le lien ou les permissions.`
                }, { quoted: message });
            }
        }

        // 3. Lien de chaîne WhatsApp
        const channelMatch = input.match(/https:\/\/whatsapp\.com\/channel\/([A-Za-z0-9]+)/);
        if (channelMatch) {
            const channelId = channelMatch[1];
            const channelJid = channelId + '@newsletter';
            return sock.sendMessage(jid, {
                text: `📌 Lien détecté (chaîne)\n🆔 JID : *${channelJid}*`
            }, { quoted: message });
        }

        // 4. Format JID déjà fourni (ex: 123456789@g.us)
        if (input.includes('@g.us') || input.includes('@newsletter')) {
            return sock.sendMessage(jid, { text: `📌 JID : *${input}*` }, { quoted: message });
        }

        // 5. Lien non reconnu
        return sock.sendMessage(jid, {
            text: '❌ Lien non reconnu. Fournissez un lien de groupe (chat.whatsapp.com) ou de chaîne (whatsapp.com/channel).'
        }, { quoted: message });
    }
};
