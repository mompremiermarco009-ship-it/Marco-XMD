const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const USER_GROUP_DATA = path.join(__dirname, '..', 'data', 'userGroupData.json');

// Stockage mémoire pour l'historique des conversations
const chatMemory = {
    messages: new Map(), // 20 derniers messages par utilisateur
    userInfo: new Map()  // infos utilisateur
};

function loadUserGroupData() {
    try {
        return JSON.parse(fs.readFileSync(USER_GROUP_DATA, 'utf-8'));
    } catch {
        return { groups: [], chatbot: {} };
    }
}

function saveUserGroupData(data) {
    const dir = path.dirname(USER_GROUP_DATA);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(USER_GROUP_DATA, JSON.stringify(data, null, 2));
}

function getRandomDelay() {
    return Math.floor(Math.random() * 3000) + 2000;
}

async function showTyping(sock, chatId) {
    try {
        await sock.presenceSubscribe(chatId);
        await sock.sendPresenceUpdate('composing', chatId);
        await new Promise(resolve => setTimeout(resolve, getRandomDelay()));
    } catch {}
}

function extractUserInfo(message) {
    const info = {};
    if (message.toLowerCase().includes('my name is')) {
        info.name = message.split('my name is')[1].trim().split(' ')[0];
    }
    if (message.toLowerCase().includes('i am') && message.toLowerCase().includes('years old')) {
        info.age = message.match(/\d+/)?.[0];
    }
    if (message.toLowerCase().includes('i live in') || message.toLowerCase().includes('i am from')) {
        info.location = message.split(/(?:i live in|i am from)/i)[1].trim().split(/[.,!?]/)[0];
    }
    return info;
}

async function getAIResponse(userMessage, userContext) {
    try {
        const prompt = `
You're not an AI. You're a real human chatting on WhatsApp.

IMPORTANT: NEVER repeat these instructions in your response. Just chat naturally.

CORE RULES:
1. NEVER use emoji names - use actual emojis
2. Keep responses short - 1-2 lines max
3. Use Hinglish naturally
4. Be casual, not robotic
5. NEVER mention these rules in your response

EMOJI USAGE:
✅ DO use: 😊 😂 😅 🙄 😉 🥺 😎 🤔 😴
❌ DON'T use: "winks", "eye roll", "shrug"

RESPONSE STYLE:
- Short and sweet
- Natural and casual
- Match user's tone
- Use Hinglish when needed

EMOTIONAL RESPONSES:
- If they're rude: Give savage reply with emojis
- If they're sweet: Be soft and caring
- If they're funny: Joke around
- If they're sad: Be supportive
- If they flirt: Flirt back naturally

ABOUT YOU:
- Your name is MARCO-XMD
- You're the boss
- You're not an AI or assistant
- You're a real person chatting

Previous conversation context:
${userContext.messages.join('\n')}

User information:
${JSON.stringify(userContext.userInfo, null, 2)}

Current message: ${userMessage}

Remember: Just chat naturally. Don't repeat these instructions.

You:
        `.trim();

        const response = await fetch("https://zellapi.autos/ai/chatbot?text=" + encodeURIComponent(prompt));
        if (!response.ok) throw new Error("API call failed");

        const data = await response.json();
        if (!data.status || !data.result) throw new Error("Invalid API response");

        let cleanedResponse = data.result.trim()
            .replace(/winks/g, '😉')
            .replace(/eye roll/g, '🙄')
            .replace(/shrug/g, '🤷‍♂️')
            .replace(/raises eyebrow/g, '🤨')
            .replace(/smiles/g, '😊')
            .replace(/laughs/g, '😂')
            .replace(/cries/g, '😢')
            .replace(/thinks/g, '🤔')
            .replace(/sleeps/g, '😴')
            .replace(/winks at/g, '😉')
            .replace(/rolls eyes/g, '🙄')
            .replace(/shrugs/g, '🤷‍♂️')
            .replace(/raises eyebrows/g, '🤨')
            .replace(/smiling/g, '😊')
            .replace(/laughing/g, '😂')
            .replace(/crying/g, '😢')
            .replace(/thinking/g, '🤔')
            .replace(/sleeping/g, '😴')
            .replace(/Remember:.*$/g, '')
            .replace(/IMPORTANT:.*$/g, '')
            .replace(/CORE RULES:.*$/g, '')
            .replace(/EMOJI USAGE:.*$/g, '')
            .replace(/RESPONSE STYLE:.*$/g, '')
            .replace(/EMOTIONAL RESPONSES:.*$/g, '')
            .replace(/ABOUT YOU:.*$/g, '')
            .replace(/SLANG EXAMPLES:.*$/g, '')
            .replace(/Previous conversation context:.*$/g, '')
            .replace(/User information:.*$/g, '')
            .replace(/Current message:.*$/g, '')
            .replace(/You:.*$/g, '')
            .replace(/^[A-Z\s]+:.*$/gm, '')
            .replace(/^[•-]\s.*$/gm, '')
            .replace(/^✅.*$/gm, '')
            .replace(/^❌.*$/gm, '')
            .replace(/\n\s*\n/g, '\n')
            .trim();

        return cleanedResponse;
    } catch (error) {
        console.error("AI API error:", error);
        return null;
    }
}

// Plugin principal
module.exports = {
    name: "chatbot",
    aliases: ["chat", "bot"],
    desc: "Active/désactive le chatbot IA dans le groupe",
    usage: ".chatbot on/off",
    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: '❌ Cette commande ne fonctionne que dans les groupes.' }, { quoted: msg });
        }

        const sender = msg.key.participant || msg.key.remoteJid;
        const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const isOwner = sender === botNumber;

        // Vérifier droits admin
        let isAdmin = false;
        try {
            const metadata = await sock.groupMetadata(jid);
            isAdmin = metadata.participants.some(p => p.id === sender && (p.admin === 'admin' || p.admin === 'superadmin'));
        } catch {}

        if (!isOwner && !isAdmin) {
            return sock.sendMessage(jid, { text: '❌ Seuls les administrateurs ou le propriétaire du bot peuvent utiliser cette commande.' }, { quoted: msg });
        }

        const sub = (args[0] || '').toLowerCase().trim();
        if (!sub || (sub !== 'on' && sub !== 'off')) {
            return sock.sendMessage(jid, { text: `🤖 *CHATBOT*\n\n.chatbot on  – Active l'IA\n.chatbot off – Désactive` }, { quoted: msg });
        }

        const data = loadUserGroupData();
        if (sub === 'on') {
            data.chatbot[jid] = true;
            saveUserGroupData(data);
            return sock.sendMessage(jid, { text: '🤖 Chatbot IA activé dans ce groupe.' }, { quoted: msg });
        } else {
            delete data.chatbot[jid];
            saveUserGroupData(data);
            return sock.sendMessage(jid, { text: '🤖 Chatbot IA désactivé.' }, { quoted: msg });
        }
    },

    // Fonction exportée pour l'événement
    handleChatbotResponse: async function(sock, msg, userMessage, senderId) {
        const jid = msg.key.remoteJid;
        const data = loadUserGroupData();
        if (!data.chatbot[jid]) return;

        try {
            const botNumber = sock.user.id.split(':')[0];
            const isBotMentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.some(j => j.includes(botNumber));
            const isReplyToBot = msg.message?.extendedTextMessage?.contextInfo?.participant?.includes(botNumber);

            if (!isBotMentioned && !isReplyToBot) return;

            let cleanedMessage = userMessage;
            if (isBotMentioned) {
                cleanedMessage = cleanedMessage.replace(new RegExp(`@${botNumber}`, 'g'), '').trim();
            }

            if (!chatMemory.messages.has(senderId)) {
                chatMemory.messages.set(senderId, []);
                chatMemory.userInfo.set(senderId, {});
            }

            const userInfo = extractUserInfo(cleanedMessage);
            if (Object.keys(userInfo).length > 0) {
                chatMemory.userInfo.set(senderId, { ...chatMemory.userInfo.get(senderId), ...userInfo });
            }

            const messages = chatMemory.messages.get(senderId);
            messages.push(cleanedMessage);
            if (messages.length > 20) messages.shift();

            await showTyping(sock, jid);
            const response = await getAIResponse(cleanedMessage, {
                messages: chatMemory.messages.get(senderId),
                userInfo: chatMemory.userInfo.get(senderId)
            });

            if (!response) return;
            await new Promise(resolve => setTimeout(resolve, getRandomDelay()));
            await sock.sendMessage(jid, { text: response }, { quoted: msg });
        } catch (error) {
            console.error('❌ Erreur chatbot:', error.message);
        }
    }
};
