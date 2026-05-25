/**
 * Ajoute les informations de newsletter (canal) à un message
 * @param {Object} content - Le contenu du message (text, image, etc.)
 * @returns {Object} Le contenu modifié avec contextInfo
 */
function addCanalButton(content) {
    const canalInfo = {
        isForwarded: true,
        forwardingScore: 1,
        forwardedNewsletterMessageInfo: {
            newsletterJid: "120363401081959362@newsletter",
            serverMessageId: 100,
            newsletterName: " 𝐦𝐚𝐫𝐜𝐨-𝐱𝐦𝐝 𝐨𝐟𝐟𝐢𝐜𝐢𝐚𝐥 📢"
        }
    };
    if (content.contextInfo) {
        Object.assign(content.contextInfo, canalInfo);
    } else {
        content.contextInfo = canalInfo;
    }
    return content;
}

module.exports = addCanalButton;
