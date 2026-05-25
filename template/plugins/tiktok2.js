const axios = require("axios");

function cleanUrl(u) {
    if (!u || !/^https?:\/\//i.test(u.trim())) return null;
    return u.trim().replace(/\s+/g, "");
}

async function getJson(url) {
    return axios.get(url, {
        timeout: 25000,
        headers: {
            accept: "application/json, text/plain, */*",
            "user-agent": "Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 Chrome/120 Safari/537.36"
        },
        validateStatus: () => true
    });
}

// API 1 : tele-social
async function fetchTeleSocial(tiktokUrl) {
    const api = `https://tele-social.vercel.app/down?url=${encodeURIComponent(tiktokUrl)}`;
    const res = await getJson(api);
    if (res.status < 200 || res.status >= 300) return { ok: false, reason: `HTTP ${res.status}` };
    const root = res.data;
    const statut = root?.statut === true || root?.statut === "vrai" || root?.status === true;
    const dataObj = root?.données || root?.donnees || root?.data || root?.result;
    if (!statut || !dataObj) return { ok: false, reason: root?.message || root?.error || "données introuvables" };

    const medias = dataObj?.méta?.médias || dataObj?.meta?.medias || dataObj?.meta?.médias || dataObj?.méta?.medias || null;
    const m0 = Array.isArray(medias) ? medias[0] : medias;
    const org = cleanUrl(m0?.org);
    const wm = cleanUrl(m0?.wm);
    const hd = cleanUrl(m0?.hd);

    if (!org && !wm && !hd) return { ok: false, reason: "aucun lien vidéo (org/wm/hd)" };

    return {
        ok: true,
        provider: "tele-social",
        info: {
            title: dataObj?.title || "Vidéo TikTok",
            authorNick: dataObj?.auteur?.["surnom"] || dataObj?.auteur?.nickname || "N/A",
            authorUser: dataObj?.auteur?.["nom d'utilisateur"] || dataObj?.auteur?.username || "N/A",
            likes: dataObj?.like,
            comments: dataObj?.commentaire,
            shares: dataObj?.part,
            views: dataObj?.repro,
            published: dataObj?.publié,
            sizes: { org: m0?.size_org, wm: m0?.size_wm, hd: m0?.size_hd }
        },
        links: { org, wm, hd }
    };
}

// API 2 : tikwm
async function fetchTikwmFallback(tiktokUrl) {
    const api = `https://www.tikwm.com/api/?url=${encodeURIComponent(tiktokUrl)}&hd=1`;
    const res = await getJson(api);
    if (res.status < 200 || res.status >= 300) return { ok: false, reason: `TikWM HTTP ${res.status}` };
    const root = res.data;
    if (!root || root.code !== 0 || !root.data) return { ok: false, reason: root?.msg || "TikWM: réponse invalide" };

    const d = root.data;
    const hd = cleanUrl(d?.hdplay);
    const org = cleanUrl(d?.play);
    const wm = cleanUrl(d?.wmplay);

    if (!org && !wm && !hd) return { ok: false, reason: "TikWM: aucun lien vidéo" };

    return {
        ok: true,
        provider: "tikwm",
        info: {
            title: d?.title || "Vidéo TikTok",
            authorNick: d?.author?.nickname || "N/A",
            authorUser: d?.author?.unique_id ? `@${d.author.unique_id}` : "N/A",
            likes: d?.digg_count,
            comments: d?.comment_count,
            shares: d?.share_count,
            views: d?.play_count,
            published: d?.create_time ? new Date(d.create_time * 1000).toLocaleDateString("fr-FR") : "N/A",
            sizes: { org: null, wm: null, hd: null }
        },
        links: { org, wm, hd }
    };
}

function formatStats(v) {
    return v === undefined || v === null ? "N/A" : String(v);
}

function buildMessage(info, links) {
    const title = info.title || "Vidéo TikTok";
    const authorLine = `${info.authorNick || "N/A"} (${info.authorUser || "N/A"})`;
    const line1 = links.org ? `1) 📼 Vidéo ORG${info.sizes?.org ? ` (${info.sizes.org})` : ""}\n${links.org}` : `1) 📼 Vidéo ORG\n—`;
    const line2 = links.wm ? `2) 💧 Vidéo WM${info.sizes?.wm ? ` (${info.sizes.wm})` : ""}\n${links.wm}` : `2) 💧 Vidéo WM\n—`;
    const line3 = links.hd ? `3) ⚡ Vidéo HD${info.sizes?.hd ? ` (${info.sizes.hd})` : ""}\n${links.hd}` : `3) ⚡ Vidéo HD\n—`;

    return (
`╭━━━〔 🎥 TIKTOK 〕━━━╮
┃ 👤 Auteur : \`${authorLine}\`
┃ ❤️ Likes : \`${formatStats(info.likes)}\`
┃ 💬 Com : \`${formatStats(info.comments)}\`
┃ 🔁 Part : \`${formatStats(info.shares)}\`
┃ 👁️ Vues : \`${formatStats(info.views)}\`
┃ 📅 Publié : \`${formatStats(info.published)}\`
╰━━━━━━━━━━━━━━━━━━━━╯

📝 *Titre :*
${title}

📎 *Choisis un lien :*
${line1}

${line2}

${line3}

♠️ MARCO-XMD
> By Mr Marco`
    );
}

module.exports = {
    name: "tiktok2",
    aliases: ["tt2", "tik2"],
    desc: "Télécharge une vidéo TikTok (liens multiples)",
    usage: ".tiktok2 <url>",
    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const url = (args[0] || '').trim();
        if (!url) {
            return sock.sendMessage(chatId, { text: '❌ Donne un lien TikTok.\nExemple : .tiktok2 https://vm.tiktok.com/xxxx' }, { quoted: msg });
        }

        try { await sock.sendMessage(chatId, { react: { text: "🔄", key: msg.key } }); } catch {}

        let result = await fetchTeleSocial(url);
        if (!result.ok) result = await fetchTikwmFallback(url);

        if (!result.ok) {
            try { await sock.sendMessage(chatId, { react: { text: "❌", key: msg.key } }); } catch {}
            return sock.sendMessage(chatId, { text: `❌ API erreur : ${result.reason || 'impossible de récupérer la vidéo'}.` }, { quoted: msg });
        }

        const message = buildMessage(result.info, result.links);
        await sock.sendMessage(chatId, { text: message }, { quoted: msg });

        try { await sock.sendMessage(chatId, { react: { text: "✅", key: msg.key } }); } catch {}
    }
};
