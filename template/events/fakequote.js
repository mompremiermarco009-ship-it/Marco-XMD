/**
 * Génère une fausse citation (fake quote) pour les messages du bot
 * @returns {Object} Un objet quoted prêt à être utilisé dans sendMessage
 */
function createFakeQuote() {
    return {
        key: {
            remoteJid: "status@broadcast",
            participant: "0@s.whatsapp.net",
            fromMe: false,
            id: "FAKE_QUOTE_ID_" + Date.now()
        },
        message: {
            conversation: "𝐌𝐚𝐫𝐜𝐨-𝐗𝐌𝐃 🍷"
        }
    };
}

module.exports = createFakeQuote;
