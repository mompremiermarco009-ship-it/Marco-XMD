// plugins/roll.js
module.exports = {
    name: 'dice',
    aliases: ['roll', 'dé', 'jet'],
    description: 'Lancer un dé (par défaut 6 faces)',
    usage: '.roll [nombre de faces]',

    async execute(sock, message, args) {
        const jid = message.key.remoteJid;
        let faces = parseInt(args[0]) || 6;

        if (faces < 2 || faces > 100) {
            return sock.sendMessage(jid, { text: '❌ Le nombre de faces doit être entre 2 et 100.' }, { quoted: message });
        }

        const result = Math.floor(Math.random() * faces) + 1;
        await sock.sendMessage(jid, { text: `🎲 Dé ${faces} : *${result}*` }, { quoted: message });
    }
};
