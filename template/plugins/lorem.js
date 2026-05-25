// plugins/lorem.js
const { LoremIpsum } = require('lorem-ipsum');

const lorem = new LoremIpsum({
    sentencesPerParagraph: { max: 8, min: 4 },
    wordsPerSentence: { max: 16, min: 4 }
});

module.exports = {
    name: 'lorem',
    aliases: ['ipsum', 'fauxtexte'],
    description: 'Génère un ou plusieurs paragraphes de Lorem Ipsum',
    usage: '.lorem <nombre de paragraphes>',

    async execute(sock, message, args) {
        const jid = message.key.remoteJid;
        const count = parseInt(args[0]) || 1;
        if (count < 1 || count > 10) {
            return sock.sendMessage(jid, { text: '❌ Nombre de paragraphes entre 1 et 10.' }, { quoted: message });
        }
        const text = lorem.generateParagraphs(count);
        await sock.sendMessage(jid, { text: `📝 Lorem Ipsum (${count} paragraphe(s)) :\n\n${text}` }, { quoted: message });
    }
};
