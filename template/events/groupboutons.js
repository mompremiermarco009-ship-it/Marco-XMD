// events/groupboutons.js
const config = require("../config.json");

module.exports = async (sock, jid, msg) => {
    try {
        if (!config.addGroupButton) return;

        await sock.sendMessage(jid, {
            text: `👥 Rejoins le groupe officiel pour discuter et partager !`,
            contextInfo: {
                isForwarded: true,
                forwardingScore: 1,
                forwardedNewsletterMessageInfo: {
                    // Remplace par ton vrai group JID
                    newsletterJid: "120363401081959362@g.us",
                    serverMessageId: 200,
                    newsletterName: "Groupe officiel 💬"
                }
            }
        }, { quoted: msg });
    } catch (err) {
        console.error("Erreur groupboutons :", err);
    }
};
