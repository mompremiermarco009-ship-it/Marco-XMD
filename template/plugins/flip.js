// plugins/flip.js
module.exports = {
    name: 'flip',
    aliases: ['pileouface', 'piece', 'coin'],
    description: 'Pile ou face',
    usage: '.flip',

    async execute(sock, message) {
        const jid = message.key.remoteJid;
        const result = Math.random() < 0.5 ? '🪙 Pile' : '🪙 Face';
        await sock.sendMessage(jid, { text: result }, { quoted: message });
    }
};
