// events/reactMessage.js

// ---------- RÉACTIONS PAR COMMANDE (éditez ici) ----------
const commandEmoji = {
    // Menu & Infos
    menu:        "📜",
    owner:       "📜",
    marco:       "📜",
    info:        "ℹ️",
    info2:       "ℹ️",
    ping:        "🏓",
    stats:       "📊",
    groups:      "👥",
    ownermenu:   "🔒",
    ownerhelp:   "🔒",

    // Configuration
    public:      "🔓",
    self:        "🔒",
    access:      "🔑",
    setprefix:   "⚙️",

    // Groupe
    add:         "➕",
    tagall:      "👥",
    hidetag:     "👥",
    kick:        "👢",
    kickall:     "🧹",
    ban:         "🚫",
    unban:       "✅",
    leave:       "👋",
    open:        "🔓",
    close:       "🔒",
    promote:     "⬆️",
    demote:      "⬇️",
    delete:      "🗑️",
    del:         "🗑️",

    // Modération
    antilink:    "🔗",
    antimention: "🛡️",
    anticall:    "📵",
    warn:        "⚠️",
    warns:       "⚠️",
    resetwarn:   "🔄",
    blacklist:   "🚫",

    // Médias & Téléchargements
    play:        "🎵",
    song:        "🎵",
    mp3:         "🎵",
    ytdl:        "🎬",
    fb:          "📘",
    ig:          "📸",
    insta:       "📸",
    tiktok:      "🎵",
    spotify:     "🎧",
    shazam:      "🎶",
    anime:       "🎌",
    imagine:     "🖼️",
    apk:         "📱",
    apkdl:       "📦",
    gstatus:     "📸",

    // IA
    ai:          "🤖",
    gpt:         "🤖",
    gemini:      "✨",
    chatbot:     "💬",

    // Stickers
    sticker:     "🎨",

    // Outils
    qr:          "📱",
    base64:      "🔐",
    calc:        "🧮",
    password:    "🔑",
    lorem:       "📝",
    color:       "🎨",
    uuid:        "🆔",
    barcode:     "📊",
    translate:   "🌐",
    url:         "🔗",
    lyrics:      "📝",
    weather:     "🌤️",
    meteo:       "🌤️",

    // Jeux
    joke:        "😂",
    quiz:        "🧠",
    tiktaktoe:   "🎮",
    ttt:         "🎮",
    exttt:       "📖",
    xo:          "🎮",
    dice:        "🎲",

    // Groupes
    topmembers:  "🏆",
    groupsettings: "⚙️",
    gset:        "⚙️",
    groupinfo:   "ℹ️",
    grouplink:   "🔗",

    // Owner
    listbots:    "🤖",
    pair:        "🔐",
    removebot:   "🗑️",
    report:      "📝",

    // Statuts & Réactions
    reactstatus:      "😀",
    reactstatuslist:  "📋",

    // Sécurité
    block:       "🚫",
    unblock:     "✅",
};

const defaultEmoji = "🍷";

module.exports = {
    name: 'messages.upsert',
    async execute(sock, { messages }) {
        if (!messages || !messages.length) return;
        const msg = messages[0];
        if (!msg || !msg.message) return;

        // Récupération sécurisée du texte
        const texte =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            msg.message.imageMessage?.caption ||
            '';

        if (!texte) return;

        // Utiliser le préfixe de la session
        const cfg = sock.config || require('../config.json');
        const prefix = cfg.prefix || '.';
        if (!texte.startsWith(prefix)) return;

        const cmd = texte.slice(prefix.length).trim().split(/ +/)[0].toLowerCase();
        const emoji = commandEmoji[cmd] || defaultEmoji;

        try {
            await sock.sendMessage(msg.key.remoteJid, {
                react: {
                    text: emoji,
                    key: msg.key
                }
            });
        } catch (err) {
            // Réaction impossible (ex: pas admin, etc.) → on ignore
        }
    }
};
