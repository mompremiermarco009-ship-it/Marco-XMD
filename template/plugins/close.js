async function closeGroup(sock, msg, args) {
    const jid = msg.key.remoteJid;

    if (!jid.endsWith("@g.us")) return;

    try {
        const groupMetadata = await sock.groupMetadata(jid);
        const participants = groupMetadata.participants;

        // --- DETECTION CORRECTE DU BOT ET DE L'ADMIN ---
        const botId = sock.user.id.includes(':') ? sock.user.id.split(':')[0] + '@s.whatsapp.net' : sock.user.id;
        const sender = msg.key.participant || msg.key.remoteJid;

        const isBotAdmin = participants.find(p => p.id === botId)?.admin !== null;
        const isSenderAdmin = participants.find(p => p.id === sender)?.admin !== null;

        // --- VERIFICATIONS ---
        if (!isBotAdmin) {
            return sock.sendMessage(jid, { text: "❌ Erreur : Je dois être **admin** du groupe pour modifier les paramètres." }, { quoted: msg });
        }

        if (!isSenderAdmin) {
            return sock.sendMessage(jid, { text: "❌ Seuls les **administrateurs** peuvent utiliser cette commande." }, { quoted: msg });
        }

        // --- ACTION REELLE ---
        await sock.groupSettingUpdate(jid, "announcement");

        await sock.sendMessage(jid, {
            text: "🔒 **GROUPE FERMÉ**\nSeuls les administrateurs peuvent désormais envoyer des messages.\n > Powered by ©Mr Marco"
        }, { quoted: msg });

    } catch (e) {
        console.error("❌ Erreur Close Group:", e);
        await sock.sendMessage(jid, { text: "❌ Impossible de fermer le groupe. Vérifiez mes permissions." }, { quoted: msg });
    }
}

module.exports = {
    name: "close",
    alias: ["lock", "fermer"],
    category: "admin",
    execute: closeGroup
};
