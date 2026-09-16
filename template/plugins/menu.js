// template/plugins/menu.js — Menu principal + sous-menus avec navigation par lettre
const { getUptimes } = require('../utils/uptime');

// Stocke le menu actuellement ouvert par chat (JID)
// Structure : sock._menuState = Map<jid, { menuId, timestamp }>
function getMenuState(sock) {
    if (!sock._menuState) sock._menuState = new Map();
    return sock._menuState;
}

// ─── Génère le menu principal ───
function buildMainMenu(sock) {
    const cfg = sock.config || {};
    const { global: globalUp, session: sessionUp } = getUptimes(sock);

    const botName = cfg.botName || 'MARCO-XMD';
    const ownerName = cfg.ownerName || 'Mr Marco';
    const prefix = cfg.prefix || '.';
    const emoji = cfg.emoji || '🍷';

    return `╔════════════════════╗
║   ${emoji}${botName}  MENU${emoji}
╚════════════════════╝

╭━━━〔 👤 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐭𝐢𝐨𝐧𝐬 〕━━━╮
┃  ${emoji}  𝐁𝐨𝐭     : ${botName}
┃  👑  𝐎𝐰𝐧𝐞𝐫   : ${ownerName}
┃  📦  𝐏𝐫𝐞𝐟𝐢𝐱  : ${prefix}
┃  ⏱️  𝐔𝐩𝐭𝐢𝐦𝐞  : ${sessionUp}
╰━━━━━━━━━━━━━━━━━━╯

╭━━━〔 📋 𝐂𝐚𝐭𝐞𝐠𝐨𝐫𝐢𝐞𝐬 〕━━━╮
┃  Ⓐ︎  📥  Downloader    
┃  Ⓑ︎  🔧  Utils         
┃  Ⓒ︎  👥  Groupes       
┃  Ⓓ︎  👑  Owner         
┃  Ⓔ︎  🎨  Stickers      
┃  Ⓕ︎  🎮  Jeux          
╰━━━━━━━━━━━━━━━━━━╯

🔡 _𝑅𝑒𝑝𝑜𝑛𝑑𝑒𝑧 𝑎𝑣𝑒𝑐 𝑙𝑎 𝑙𝑒𝑡𝑡𝑟𝑒_
_𝑑𝑒 𝑣𝑜𝑡𝑟𝑒 𝑐ℎ𝑜𝑖𝑥_

> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 𝑀𝑟 𝑀𝑎𝑟𝑐𝑜`;
}

// ─── Menu A : Downloader ───
function buildDownloaderMenu() {
    return `╔════════════════════╗
║ 📥  𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃𝐄𝐑  𝐌𝐄𝐍𝐔   📥
╚════════════════════╝

╭━━━〔 🎬 𝐕𝐢𝐝𝐞𝐨𝐬 〕━━━╮
┃  Ⓐ︎  ▶️  .play        
┃  Ⓑ︎  🎵  .song       
┃  Ⓒ︎  📥  .ytdl       
┃  Ⓓ︎  📱  .tiktok     
┃  Ⓔ︎  📸  .instagram  
╰━━━━━━━━━━━━━━━━━━╯

╭━━━〔 📄 𝐅𝐢𝐜𝐡𝐢𝐞𝐫𝐬 〕━━━╮
┃  Ⓕ︎  📦  .apk         
┃  Ⓖ︎  🖼️  .image       
┃  Ⓗ︎  🎬  .video       
╰━━━━━━━━━━━━━━━━━━╯

╭━━━〔 🔗 𝐎𝐮𝐭𝐢𝐥𝐬 〕━━━╮
┃  Ⓘ︎  🌐  Video Downloader 
┃  Ⓙ︎  🎵  Marco Lyrics     
┃  Ⓚ︎  🎙️  Voice Studio     
╰━━━━━━━━━━━━━━━━━━╯

⬅️ _𝑇𝑎𝑝𝑒𝑧 0 𝑝𝑜𝑢𝑟 𝑙𝑒 𝑚𝑒𝑛𝑢 𝑃𝑟𝑖𝑛𝑐𝑖𝑝𝑎𝑙𝑒_
🔡 _𝑟𝑒𝑝𝑜𝑛𝑑 𝑎𝑣𝑒𝑐 𝑙𝑎 𝑙𝑒𝑡𝑡𝑟𝑒 𝑑𝑒 𝑣𝑜𝑡𝑟𝑒 𝑐ℎ𝑜𝑖𝑥_
> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 𝑀𝑟 𝑀𝑎𝑟𝑐𝑜`;
}

// ─── Menu B : Utils ───
function buildUtilsMenu() {
    return `╔════════════════════╗
║  🔧  𝐔𝐓𝐈𝐋𝐒  𝐌𝐄𝐍𝐔   🔧
╚════════════════════╝

╭━━━〔 🧩 𝐎𝐮𝐭𝐢𝐥𝐬 〕━━━╮
┃  Ⓐ︎  🔍  .qr          
┃  Ⓑ︎  🎫  .jid         
┃  Ⓒ︎  🔢  .calc        
┃  Ⓓ︎  📊  .barcode     
┃  Ⓔ︎  🆔  .uuid        
╰━━━━━━━━━━━━━━━━━━╯

╭━━━〔 📝 𝐓𝐞𝐱𝐭𝐞 〕━━━╮
┃  Ⓕ︎  🔐  .base64      
┃  Ⓖ︎  🎨  .color       
┃  Ⓗ︎  📖  .lorem       
┃  Ⓘ︎  🌍  .translate   
┃  Ⓙ︎  ⏱️  .timer       
╰━━━━━━━━━━━━━━━━━━╯

╭━━━〔 ℹ️ 𝐈𝐧𝐟𝐨 〕━━━╮
┃  Ⓚ︎  🏓  .ping        
┃  Ⓛ︎  📊  .stats       
┃  Ⓜ︎  ℹ️  .info        
┃  Ⓝ︎  🌐  .repo        
╰━━━━━━━━━━━━━━━━━━╯

⬅️ _𝑇𝑎𝑝𝑒𝑧 0 𝑝𝑜𝑢𝑟 𝑙𝑒 𝑚𝑒𝑛𝑢 𝑃𝑟𝑖𝑛𝑐𝑖𝑝𝑎𝑙𝑒_
🔡 _𝑟𝑒𝑝𝑜𝑛𝑑 𝑎𝑣𝑒𝑐 𝑙𝑎 𝑙𝑒𝑡𝑡𝑟𝑒 𝑑𝑒 𝑣𝑜𝑡𝑟𝑒 𝑐ℎ𝑜𝑖𝑥_
> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 𝑀𝑟 𝑀𝑎𝑟𝑐𝑜`;
}

// ─── Menu C : Groupes ───
function buildGroupesMenu() {
    return `╔════════════════════╗
║  👥  𝐆𝐑𝐎𝐔𝐏𝐄𝐒  𝐌𝐄𝐍𝐔   👥
╚════════════════════╝

╭━━━〔 🛠️ 𝐌𝐨𝐝𝐞𝐫𝐚𝐭𝐢𝐨𝐧 〕━━━╮
┃  Ⓐ︎  ➕  .add         
┃  Ⓑ︎  👢  .kick        
┃  Ⓒ︎  🧹  .kickall     
┃  Ⓓ︎  ⬆️  .promote     
┃  Ⓔ︎  ⬇️  .demote      
╰━━━━━━━━━━━━━━━━━━╯

╭━━━〔 📢 𝐀𝐧𝐧𝐨𝐧𝐜𝐞𝐬 〕━━━╮
┃  Ⓕ︎  📢  .tagall      
┃  Ⓖ︎  📣  .hidetag     
┃  Ⓗ︎  🌐  .groups      
╰━━━━━━━━━━━━━━━━━━╯

╭━━━〔 🔧 𝐂𝐨𝐧𝐭𝐫𝐨̂𝐥𝐞 〕━━━╮
┃  Ⓘ︎  🔓  .open        
┃  Ⓙ︎  🔒  .close       
┃  Ⓚ︎  🚪  .leaveall    
╰━━━━━━━━━━━━━━━━━━╯

⬅️ _𝑇𝑎𝑝𝑒𝑧 0 𝑝𝑜𝑢𝑟 𝑙𝑒 𝑚𝑒𝑛𝑢 𝑃𝑟𝑖𝑛𝑐𝑖𝑝𝑎𝑙𝑒_
🔡 _𝑟𝑒𝑝𝑜𝑛𝑑 𝑎𝑣𝑒𝑐 𝑙𝑎 𝑙𝑒𝑡𝑡𝑟𝑒 𝑑𝑒 𝑣𝑜𝑡𝑟𝑒 𝑐ℎ𝑜𝑖𝑥_
> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 𝑀𝑟 𝑀𝑎𝑟𝑐𝑜`;
}

// ─── Menu D : Owner ───
function buildOwnerMenu() {
    return `╔════════════════════╗
║   👑  𝐎𝐖𝐍𝐄𝐑  𝐌𝐄𝐍𝐔   👑
╚════════════════════╝

╭━━━〔 ⚙️ 𝐂𝐨𝐧𝐟𝐢𝐠 〕━━━╮
┃  Ⓐ︎  🔓  .public      
┃  Ⓑ︎  🔐  .self        
┃  Ⓒ︎  ⚙️  .setprefix   
┃  Ⓓ︎  👀  .reactstatus 
╰━━━━━━━━━━━━━━━━━━╯

╭━━━〔 🤖 𝐁𝐨𝐭𝐬 〕━━━╮
┃  Ⓔ︎  🔑  .pair        
┃  Ⓕ︎  📋  .listbots    
┃  Ⓖ︎  🗑️  .removebot   
╰━━━━━━━━━━━━━━━━━━╯

╭━━━〔 🛡️ 𝐒𝐞́𝐜𝐮𝐫𝐢𝐭𝐞́ 〕━━━╮
┃  Ⓗ︎  🚫  .block       
┃  Ⓘ︎  ✅  .unblock     
╰━━━━━━━━━━━━━━━━━━╯

⬅️ _𝑇𝑎𝑝𝑒𝑧 0 𝑝𝑜𝑢𝑟 𝑙𝑒 𝑚𝑒𝑛𝑢 𝑃𝑟𝑖𝑛𝑐𝑖𝑝𝑎𝑙𝑒_
🔡 _𝑟𝑒𝑝𝑜𝑛𝑑 𝑎𝑣𝑒𝑐 𝑙𝑎 𝑙𝑒𝑡𝑡𝑟𝑒 𝑑𝑒 𝑣𝑜𝑡𝑟𝑒 𝑐ℎ𝑜𝑖𝑥_
> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 𝑀𝑟 𝑀𝑎𝑟𝑐𝑜`;
}

// ─── Menu E : Stickers ───
function buildStickersMenu() {
    return `╔════════════════════╗
║  🎨  𝐒𝐓𝐈𝐂𝐊𝐄𝐑𝐒  𝐌𝐄𝐍𝐔  🎨
╚════════════════════╝

╭━━━〔 🖼️ 𝐂𝐫𝐞́𝐚𝐭𝐢𝐨𝐧 〕━━━╮
┃  Ⓐ︎  🎨  .sticker     
┃  Ⓑ︎  📸  .gstatus     
┃  Ⓒ︎  👁️  .viewonce    
╰━━━━━━━━━━━━━━━━━━╯

╭━━━〔 🔄 𝐂𝐨𝐧𝐯𝐞𝐫𝐬𝐢𝐨𝐧 〕━━━╮
┃  Ⓓ︎  🖼️  .toimage     
┃  Ⓔ︎  📹  .togif       
╰━━━━━━━━━━━━━━━━━━╯

⬅️ _𝑇𝑎𝑝𝑒𝑧 0 𝑝𝑜𝑢𝑟 𝑙𝑒 𝑚𝑒𝑛𝑢 𝑃𝑟𝑖𝑛𝑐𝑖𝑝𝑎𝑙𝑒_
🔡 _𝑟𝑒𝑝𝑜𝑛𝑑 𝑎𝑣𝑒𝑐 𝑙𝑎 𝑙𝑒𝑡𝑡𝑟𝑒 𝑑𝑒 𝑣𝑜𝑡𝑟𝑒 𝑐ℎ𝑜𝑖𝑥_
> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 𝑀𝑟 𝑀𝑎𝑟𝑐𝑜`;
}

// ─── Menu F : Jeux ───
function buildJeuxMenu() {
    return `╔════════════════════╗
║    🎮  𝐉𝐄𝐔𝐗  𝐌𝐄𝐍𝐔   🎮
╚════════════════════╝

╭━━━〔 🧠 𝐑𝐞́𝐟𝐥𝐞𝐱𝐢𝐨𝐧 〕━━━╮
┃  Ⓐ︎  ❓  .quiz        
┃  Ⓑ︎  ⭕  .ttt         
┃  Ⓒ︎  🧩  .memory      
╰━━━━━━━━━━━━━━━━━━╯

╭━━━〔 😂 𝐋𝐨𝐢𝐬𝐢𝐫 〕━━━╮
┃  Ⓓ︎  😂  .joke        
┃  Ⓔ︎  🎲  .dice        
┃  Ⓕ︎  🎯  .flip        
╰━━━━━━━━━━━━━━━━━━╯

╭━━━〔 🌐 𝐉𝐞𝐮𝐱 𝐰𝐞𝐛 〕━━━╮
┃  Ⓖ︎  🎮  .games.html  
┃  Ⓗ︎  🐍  Snake        
┃  Ⓘ︎  🏓  Pong        
╰━━━━━━━━━━━━━━━━━━╯

⬅️ _𝑇𝑎𝑝𝑒𝑧 0 𝑝𝑜𝑢𝑟 𝑙𝑒 𝑚𝑒𝑛𝑢 𝑃𝑟𝑖𝑛𝑐𝑖𝑝𝑎𝑙𝑒_
🔡 _𝑟𝑒𝑝𝑜𝑛𝑑 𝑎𝑣𝑒𝑐 𝑙𝑎 𝑙𝑒𝑡𝑡𝑟𝑒 𝑑𝑒 𝑣𝑜𝑡𝑟𝑒 𝑐ℎ𝑜𝑖𝑥_
> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 𝑀𝑟 𝑀𝑎𝑟𝑐𝑜`;
}

// ─── Tableau de correspondance (menu ouvert → lettre → commande) ───
const MENU_ACTIONS = {
    'main': {
        'A': { action: 'menu', target: 'downloader' },
        'B': { action: 'menu', target: 'utils' },
        'C': { action: 'menu', target: 'groupes' },
        'D': { action: 'menu', target: 'owner' },
        'E': { action: 'menu', target: 'stickers' },
        'F': { action: 'menu', target: 'jeux' }
    },
    'downloader': {
        'A': { action: 'cmd', value: 'play' },
        'B': { action: 'cmd', value: 'song' },
        'C': { action: 'cmd', value: 'ytdl' },
        'D': { action: 'cmd', value: 'tiktok' },
        'E': { action: 'cmd', value: 'instagram' },
        'F': { action: 'cmd', value: 'apk' },
        'G': { action: 'cmd', value: 'image' },
        'H': { action: 'cmd', value: 'video' },
        'I': { action: 'web', value: '/video_downloader/' },
        'J': { action: 'web', value: '/marco_lyrics/' },
        'K': { action: 'web', value: '/voice_studio/' }
    },
    'utils': {
        'A': { action: 'cmd', value: 'qr' },
        'B': { action: 'cmd', value: 'jid' },
        'C': { action: 'cmd', value: 'calc' },
        'D': { action: 'cmd', value: 'barcode' },
        'E': { action: 'cmd', value: 'uuid' },
        'F': { action: 'cmd', value: 'base64' },
        'G': { action: 'cmd', value: 'color' },
        'H': { action: 'cmd', value: 'lorem' },
        'I': { action: 'cmd', value: 'translate' },
        'J': { action: 'cmd', value: 'timer' },
        'K': { action: 'cmd', value: 'ping' },
        'L': { action: 'cmd', value: 'stats' },
        'M': { action: 'cmd', value: 'info' },
        'N': { action: 'cmd', value: 'repo' }
    },
    'groupes': {
        'A': { action: 'cmd', value: 'add' },
        'B': { action: 'cmd', value: 'kick' },
        'C': { action: 'cmd', value: 'kickall' },
        'D': { action: 'cmd', value: 'promote' },
        'E': { action: 'cmd', value: 'demote' },
        'F': { action: 'cmd', value: 'tagall' },
        'G': { action: 'cmd', value: 'hidetag' },
        'H': { action: 'cmd', value: 'groups' },
        'I': { action: 'cmd', value: 'open' },
        'J': { action: 'cmd', value: 'close' },
        'K': { action: 'cmd', value: 'leaveall' }
    },
    'owner': {
        'A': { action: 'cmd', value: 'public' },
        'B': { action: 'cmd', value: 'self' },
        'C': { action: 'cmd', value: 'setprefix' },
        'D': { action: 'cmd', value: 'reactstatus' },
        'E': { action: 'cmd', value: 'pair' },
        'F': { action: 'cmd', value: 'listbots' },
        'G': { action: 'cmd', value: 'removebot' },
        'H': { action: 'cmd', value: 'block' },
        'I': { action: 'cmd', value: 'unblock' }
    },
    'stickers': {
        'A': { action: 'cmd', value: 'sticker' },
        'B': { action: 'cmd', value: 'gstatus' },
        'C': { action: 'cmd', value: 'viewonce' },
        'D': { action: 'cmd', value: 'toimage' },
        'E': { action: 'cmd', value: 'togif' }
    },
    'jeux': {
        'A': { action: 'cmd', value: 'quiz' },
        'B': { action: 'cmd', value: 'ttt' },
        'C': { action: 'cmd', value: 'memory' },
        'D': { action: 'cmd', value: 'joke' },
        'E': { action: 'cmd', value: 'dice' },
        'F': { action: 'cmd', value: 'flip' },
        'G': { action: 'web', value: '/games.html' },
        'H': { action: 'cmd', value: 'snake' },
        'I': { action: 'cmd', value: 'pong' }
    }
};

// ─── Builders par menu ───
const MENU_BUILDERS = {
    'main': buildMainMenu,
    'downloader': buildDownloaderMenu,
    'utils': buildUtilsMenu,
    'groupes': buildGroupesMenu,
    'owner': buildOwnerMenu,
    'stickers': buildStickersMenu,
    'jeux': buildJeuxMenu
};

// ─── Envoie un menu avec logo ───
async function sendMenu(sock, jid, menuId, quotedMsg = null) {
    const cfg = sock.config || {};
    const builder = MENU_BUILDERS[menuId] || MENU_BUILDERS['main'];
    const text = builder(sock);
    const logo = cfg.botLogo || cfg.logo;

    try {
        if (logo) {
            await sock.sendMessage(jid, { image: { url: logo }, caption: text }, quotedMsg ? { quoted: quotedMsg } : {});
        } else {
            await sock.sendMessage(jid, { text }, quotedMsg ? { quoted: quotedMsg } : {});
        }
    } catch {
        // Fallback texte
        await sock.sendMessage(jid, { text }, quotedMsg ? { quoted: quotedMsg } : {});
    }
}

// ─── Plugin ───
module.exports = {
    name: 'menu',
    aliases: ['help', 'h', 'aide'],
    category: 'general',
    desc: 'Affiche le menu principal avec navigation par lettre',
    usage: '.menu',

    async execute(sock, msg, args, cmd) {
        const jid = msg.key.remoteJid;

        // Initialiser l'écouteur de lettres (une seule fois par socket)
        if (!sock._menuListenerAttached) {
            sock._menuListenerAttached = true;

            sock.ev.on('messages.upsert', async ({ messages }) => {
                const m = messages[0];
                if (!m || !m.message) return;
                if (m.key.fromMe) return;

                // Ne traiter que les messages venant du même chat
                const mJid = m.key.remoteJid;
                const states = getMenuState(sock);
                const state = states.get(mJid);
                if (!state) return;

                // Extraire le texte
                const text = (
                    m.message.conversation ||
                    m.message.extendedTextMessage?.text ||
                    ''
                ).trim();

                if (!text) return;

                // Expiration (5 minutes)
                if (Date.now() - state.timestamp > 5 * 60 * 1000) {
                    states.delete(mJid);
                    return;
                }

                // Retour au menu principal si "0"
                if (text === '0') {
                    states.set(mJid, { menuId: 'main', timestamp: Date.now() });
                    await sendMenu(sock, mJid, 'main', m);
                    return;
                }

                // Détecter une lettre (A-Z, insensible à la casse)
                const letter = text.toUpperCase().match(/^([A-Z])$/)?.[1];
                if (!letter) return;

                const actions = MENU_ACTIONS[state.menuId];
                if (!actions) return;

                const action = actions[letter];
                if (!action) return;

                // ─── Action : ouvrir un sous-menu ───
                if (action.action === 'menu') {
                    states.set(mJid, { menuId: action.target, timestamp: Date.now() });
                    await sendMenu(sock, mJid, action.target, m);
                    return;
                }

                // ─── Action : exécuter une commande ───
                if (action.action === 'cmd') {
                    const targetCmd = action.value;
                    const plugin = sock.commands.get(targetCmd);

                    if (!plugin) {
                        await sock.sendMessage(mJid, {
                            text: `❌ La commande *${targetCmd}* n'est pas disponible.`
                        }, { quoted: m });
                        return;
                    }

                    // Fermer le menu actuel
                    states.delete(mJid);

                    try {
                        await plugin.execute(sock, m, [], targetCmd);
                    } catch (err) {
                        console.error(`❌ Erreur menu → ${targetCmd}:`, err.message);
                        await sock.sendMessage(mJid, {
                            text: `❌ Erreur lors de l'exécution de *${targetCmd}*.`
                        }, { quoted: m });
                    }
                    return;
                }

                // ─── Action : lien web ───
                if (action.action === 'web') {
                    const cfg = sock.config || {};
                    const port = process.env.PORT || 10000;
                    const baseUrl = cfg.publicUrl || `http://localhost:${port}`;
                    const url = `${baseUrl}${action.value}`;

                    states.delete(mJid);
                    await sock.sendMessage(mJid, {
                        text: `🌐 *Lien direct :*\n${url}`
                    }, { quoted: m });
                    return;
                }
            });
        }

        // Ouvrir le menu principal
        const states = getMenuState(sock);
        states.set(jid, { menuId: 'main', timestamp: Date.now() });

        await sendMenu(sock, jid, 'main', msg);
    }
};
