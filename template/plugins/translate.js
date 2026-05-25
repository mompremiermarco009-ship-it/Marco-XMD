const fetch = require('node-fetch');

module.exports = {
    name: "translate",
    aliases: ["trt", "trad"],
    desc: "Traduit un texte (réponse ou direct)",
    usage: ".translate <texte> <langue> ou .translate <langue> (en répondant à un message)",
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        try {
            // Montrer "en train d'écrire..."
            await sock.presenceSubscribe(chatId);
            await sock.sendPresenceUpdate('composing', chatId);

            let textToTranslate = '';
            let lang = '';

            const quotedMessage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (quotedMessage) {
                textToTranslate = quotedMessage.conversation ||
                                quotedMessage.extendedTextMessage?.text ||
                                quotedMessage.imageMessage?.caption ||
                                quotedMessage.videoMessage?.caption ||
                                '';
                lang = args.join(' ').trim(); // la langue est le reste des arguments
            } else {
                const full = args.join(' ').trim().split(' ');
                if (full.length < 2) {
                    return sock.sendMessage(chatId, {
                        text: `*TRADUCTEUR*\n\nUsage :\n1. Répondre à un message avec : .translate <langue>\n2. Ou taper : .translate <texte> <langue>\n\nExemple :\n.translate Bonjour en\n.translate Hello fr\n\nCodes de langue :\nfr, en, es, de, it, pt, ru, ja, ko, zh, ar, hi`,
                        quoted: msg
                    });
                }
                lang = full.pop();
                textToTranslate = full.join(' ');
            }

            if (!textToTranslate) {
                return sock.sendMessage(chatId, {
                    text: '❌ Aucun texte à traduire. Fournissez un texte ou répondez à un message.',
                    quoted: msg
                });
            }

            let translatedText = null;

            // API 1 : Google Translate
            try {
                const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(textToTranslate)}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data?.[0]?.[0]?.[0]) {
                        translatedText = data[0][0][0];
                    }
                }
            } catch (e) {}

            // API 2 : MyMemory
            if (!translatedText) {
                try {
                    const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=auto|${lang}`);
                    if (response.ok) {
                        const data = await response.json();
                        if (data?.responseData?.translatedText) {
                            translatedText = data.responseData.translatedText;
                        }
                    }
                } catch (e) {}
            }

            // API 3 : Dreaded
            if (!translatedText) {
                try {
                    const response = await fetch(`https://api.dreaded.site/api/translate?text=${encodeURIComponent(textToTranslate)}&lang=${lang}`);
                    if (response.ok) {
                        const data = await response.json();
                        if (data?.translated) {
                            translatedText = data.translated;
                        }
                    }
                } catch (e) {}
            }

            if (!translatedText) {
                throw new Error('Toutes les APIs de traduction ont échoué');
            }

            await sock.sendMessage(chatId, {
                text: `${translatedText}`
            }, { quoted: msg });

        } catch (error) {
            console.error('Erreur traduction:', error);
            await sock.sendMessage(chatId, {
                text: '❌ Échec de la traduction. Réessayez plus tard.',
                quoted: msg
            });
        }
    }
};
