// plugins/uuid.js
const crypto = require('crypto');

module.exports = {
    name: 'uuid',
    aliases: ['guid', 'uid'],
    description: 'Génère un UUID v4 (identifiant unique universel)',
    usage: '.uuid',

    async execute(sock, message) {
        const jid = message.key.remoteJid;
        const uuid = crypto.randomUUID?.() || // Node >= 19, ou fallback
            'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
                const r = crypto.randomBytes(1)[0] % 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        await sock.sendMessage(jid, { text: `🆔 UUID v4 :\n\`\`\`${uuid}\`\`\`` }, { quoted: message });
    }
};
