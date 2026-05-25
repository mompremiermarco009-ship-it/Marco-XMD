async function openGroup(sock, msg, args) {
    const jid = msg.key.remoteJid;

    if (!jid.endsWith("@g.us")) return;

    try {
        const groupMetadata = await sock.groupMetadata(jid);
        const participants = groupMetadata.participants;
        const sender = msg.key.participant || msg.key.remoteJid;

        const botId = sock.user.id.split(":")[0] + "@s.whatsapp.net";
        const isBotAdmin = participants.find(p => p.id === botId)?.admin !== null;
        const isSenderAdmin = participants.find(p => p.id === sender)?.admin !== null;

        if (!isBotAdmin) return sock.sendMessage(jid, { text: "❌ Je dois être **admin** pour réouvrir le groupe." }, { quoted: msg });
        if (!isSenderAdmin) return sock.sendMessage(jid, { text: "❌ Seuls les **admins** peuvent ouvrir le groupe." }, { quoted: msg });

        // 3. Ouvrir le groupe (Tout le monde peut parler)
        await sock.groupSettingUpdate(jid, "not_announcement");

        await sock.sendMessage(jid, {
            text: "🔓 **GROUPE OUVERT**\nTous les membres peuvent maintenant envoyer des messages.\n> Powered by ©Mr Marco"
        }, { quoted: msg });

    } catch (e) {
        console.error("Erreur Open Group:", e);
        await sock.sendMessage(jid, { text: "❌ Une erreur est survenue lors de l'ouverture." }, { quoted: msg });
    }
}

module.exports = {
    name: "open",
    alias: ["unmute", "ouvrir", "unlock"],
    category: "admin",
    execute: openGroup
};
