// events/welcome.js
const fs = require("fs");
const path = require("path");

module.exports = {
    name: "group-participants.update",
    async execute(sock, update) {
        if (!sock.readyAt) return;
        if (Date.now() - sock.readyAt < 5000) return;

        // Lire la config à jour depuis le fichier de la session
        const cfgPath = path.join(__dirname, "..", "config.json");
        const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf-8"));

        if (!cfg.welcome && !cfg.goodbye) return;

        const { id, participants, action } = update;

        // Vérifier si le groupe est exclu
        if (cfg.excludedWelcomeGroups && cfg.excludedWelcomeGroups.includes(id)) return;

        for (let participant of participants) {
            let user = typeof participant === "string" ? participant : (participant.id || participant);
            if (!user.includes('@')) user = user + '@s.whatsapp.net';

            let userName = user.split('@')[0];
            try {
                const name = await sock.getName(user);
                if (name) userName = name;
            } catch (e) {}

            const mentionText = `@${user.split('@')[0]}`;
            const displayName = `${userName} (${mentionText})`;

            if (action === "add" && cfg.welcome) {
                const imgPath = path.join(__dirname, "../media/logowelcome.jpg");
                const imgBuffer = fs.existsSync(imgPath) ? fs.readFileSync(imgPath) : null;

                const caption = `┌─────────────────────
┝ ➩ 🍷 𝐁𝐢𝐞𝐧𝐯𝐞𝐧𝐮𝐞 ${displayName} 🍷
┝─────────────────────
┝ ➩ *Marco-XMD* vous souhaite la bienvenue
┝ ➩ Amuse-toi bien 😉
└─────────────────────
> Powered by ©Mr Marco`;

                await sock.sendMessage(id, {
                    image: imgBuffer || undefined,
                    caption: caption,
                    mentions: [user]
                }).catch(() => {});
            }

            if (action === "remove" && cfg.goodbye) {
                const imgPath = path.join(__dirname, "../media/logogoodbye.jpg");
                const imgBuffer = fs.existsSync(imgPath) ? fs.readFileSync(imgPath) : null;

                const caption = `┌─────────────────────
┝ ➩ 🍷 ❌ Au revoir ${displayName} 🍷
┝─────────────────────
┝ ➩ *Marco-XMD* fait ses adieux 😭
┝ ➩ Priez pour ${displayName} 🍷
└─────────────────────
> Powered by ©Mr Marco`;

                await sock.sendMessage(id, {
                    image: imgBuffer || undefined,
                    caption: caption,
                    mentions: [user]
                }).catch(() => {});
            }
        }
    }
};
