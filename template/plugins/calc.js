// plugins/calc.js
const { create, all } = require('mathjs');
const math = create(all);

module.exports = {
    name: 'calc',
    aliases: ['calculer', 'math'],
    description: 'Effectue un calcul mathématique (expressions, fonctions)',
    usage: '.calc <expression>',

    async execute(sock, message, args) {
        const jid = message.key.remoteJid;
        const expr = (Array.isArray(args) ? args.join(' ') : args).trim();
        if (!expr) return sock.sendMessage(jid, { text: '❌ Donnez une expression à calculer.' }, { quoted: message });

        try {
            const result = math.evaluate(expr);
            await sock.sendMessage(jid, { text: `🧮 ${expr} = ${result}` }, { quoted: message });
        } catch (e) {
            await sock.sendMessage(jid, { text: `⚠️ Expression invalide : ${e.message}` }, { quoted: message });
        }
    }
};
