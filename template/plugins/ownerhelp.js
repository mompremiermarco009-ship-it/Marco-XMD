const fs = require("fs");
const path = require("path");
const { isAuthorized } = require("../utils/auth");

module.exports = {
    name: "ownerhelp",
    alias: ["ownerguide"],
    category: "owner",
    desc: "Affiche la liste complète des commandes",
    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        const cfg = sock.config || JSON.parse(fs.readFileSync("./config.json"));

        if (!isAuthorized(sock, msg, cfg)) {
            return sock.sendMessage(jid, { text: "❌ Commande réservée au propriétaire." }, { quoted: msg });
        }

        const etatWelcome = cfg.welcome ? "🟢 ON" : "🔴 OFF";
        const etatStatus = cfg.reactstatus ? "🟢 ON" : "🔴 OFF";
        const etatPublic = cfg.publicMode ? "🟢 PUBLIC" : "🔒 PRIVÉ";

        const caption = `> ┌───〔🔒𝐎𝐖𝐍𝐄𝐑 𝐇𝐄𝐋𝐏〕────
┝ ➩🌍 Mode : ${etatPublic}
┝ ➩📢 Welcome : ${etatWelcome}
┝ ➩👀 Auto-Status : ${etatStatus}
└─────────────────────
┌─────────────────────
📜 *Commandes générales*
• .menu / .help → Menu principal
• .ownermenu / .marco → Menu propriétaire
• .ping → Latence du bot
• .info / .info2 → Infos du bot
• .public on/off → Mode public/privé
• .setprefix <symbole> → Change le préfixe (max 3 caractères)
└─────────────────────
┌───〔👥 *Groupe*〕────
• .add <numéro> → Ajoute un membre
• .tagall / .tag → Mentionne tous les membres
• .hidetag → Tag invisible
• .promote / .demote → Promouvoir/rétrograder
• .kick / .ban → Expulse un membre
• .kickall → Expulse les non‑admins
• .leave / .quit → Fait quitter le bot
• .open / .close → Ouvre/ferme le groupe
• .gstatus → Publie un statut
• .delete / .del → Supprime un message (répondre)
└─────────────────────
┌───〔🛡️ *Modération & Anti‑spam*〕────
• .antilink on/off/set → Anti‑liens
• .antimention on/off → Anti‑mentions
• .anticall on/off → Bloque les appels
• .warn / .warns → Avertissements
• .resetwarn → Réinitialise les warns
• .blacklist → Gère la liste noire
└─────────────────────
┌───〔🎨 *Médias & Téléchargement*〕────
• .sticker / .s → Crée un sticker
• .play → Télécharge une musique (YouTube)
• .song → Télécharge musique (multi‑API)
• .ytdl → Télécharge vidéo YouTube
• .fb → Télécharge vidéo Facebook
• .ig / .insta → Télécharge média Instagram
• .tiktok / .tt → Télécharge vidéo TikTok
• .apk → Recherche application Play Store
• .apkdl → Télécharge un fichier APK
• .spotify → Télécharge musique Spotify
• .shazam → Reconnaît une musique
• .anime → GIFs/Stickers animés
└─────────────────────
┌───〔🤖 *Intelligence Artificielle*〕────
• .ai / .gpt / .gemini → IA (OpenRouter)
• .chatbot on/off → Active l'IA de groupe
• .imagine → Génère une image par IA
└─────────────────────
┌───〔🔧 *Outils & Jeux*〕────
• .calc → Calculatrice
• .barcode → Génère un code‑barres
• .uuid → UUID aléatoire
• .lorem → Texte Lorem Ipsum
• .base64 → Encode/décode Base64
• .translate → Traduction
• .flip → Pile ou face
• .roll → Lancer de dés
• .timer → Minuteur
• .quiz → Quiz
• .joke → Blague
• .tiktaktoe → Morpion
└─────────────────────
┌───〔⚙️ *Configuration propriétaire*〕────
• .reactstatus on/off
• .welcome on/off
• .listbots → Liste les sessions
• .removebot <session> → Supprime une session
• .pair <numéro> → Ajoute un bot secondaire
└─────────────────────
┌───〔🛡️ *Événements automatiques*〕────
• Anti‑suppression
• Anti‑liens
• Welcome / Goodbye
• Réactions statuts
• Mentions → Audio
• Connexion → Image + musique + auto‑join
└─────────────────────
> Menu complet réservé au propriétaire 🔑
> by Mr Marco 🍷`;

        // Essayer d'envoyer avec l'image locale (fiable)
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
