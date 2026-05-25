const fs = require("fs");
const path = require("path");
const { isAuthorized } = require("../utils/auth");

module.exports = {
    name: "ownermenu",
    alias: ["controlmenu", "owner", "marco"],
    category: "owner",
    desc: "Menu réservé au propriétaire",
    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        const cfg = sock.config || JSON.parse(fs.readFileSync("./config.json"));

        if (!isAuthorized(sock, msg, cfg)) {
            return sock.sendMessage(jid, { text: "❌ Menu réservé au propriétaire." }, { quoted: msg });
        }

        const etatWelcome = cfg.welcome ? "🟢 ON" : "🔴 OFF";
        const etatStatus = cfg.reactstatus ? "🟢 ON" : "🔴 OFF";
        const etatPublic = cfg.publicMode ? "🟢 PUBLIC" : "🔒 PRIVÉ (owner only)";

        // Liste mise à jour avec les nouvelles commandes
        const ownerControls = [
            "allowlink <numéro> on/off",
            "allowlinklist",
            "mutelist",
            "alllist",
            "unmute <numéro>",
            "resetwarn <numéro>",
            "reactstatus on/off",
            "reactstatus exclude <numéro>",
            "reactstatuslist",
            "welcome on/off",
            "welcome exclude",
            "welcomelist",
            "antilink on/off/set",
            "anticall on/off/status",
            "antimention on/off/status",
            "chatbot on/off",
            "delete / del (répondre)",
            "add <numéro>",
            "kick @user",
            "promote @user",
            "demote @user",
            "public on/off",
            "setprefix <caractère>",
            "listbots",
            "removebot <session>",
            "leave"
        ];

        const buildMenuSection = arr => arr.map(cmd => `┝ ➩ ${cmd}`).join("\n") + "\n";
        const caption = `┌───〔🔒 *OWNER MENU* 〕────
┝ ⚙️ *Configuration actuelle*
┝ 🌍 Mode : ${etatPublic}
┝ 📢 Welcome : ${etatWelcome}
┝ 👀 Auto-Status : ${etatStatus}
└─────────────────────
┌───〔 *COMMANDES* 〕────
${buildMenuSection(ownerControls)}└─────────────────────
> Menu réservé au propriétaire 🔑
> by Mr Marco 🍷`;

        // Image locale (fonctionnait parfaitement)
        const imgPath = path.join(__dirname, "..", "media", "owner.jpg");
        if (fs.existsSync(imgPath)) {
            try {
                const imgBuffer = fs.readFileSync(imgPath);
                await sock.sendMessage(jid, { image: imgBuffer, caption }, { quoted: msg });
                return;
            } catch {}
        }
        // Fallback texte
        await sock.sendMessage(jid, { text: caption }, { quoted: msg });
    }
};
