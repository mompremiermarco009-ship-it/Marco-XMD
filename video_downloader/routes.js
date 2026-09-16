// video_downloader/routes.js — API Video Downloader (Option C : temporaire)
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const ytdlp = require('./lib/ytdlp');

const router = express.Router();

// Charger les plugins
const PLUGINS = [];
const pluginsDir = path.join(__dirname, 'plugins');
if (fs.existsSync(pluginsDir)) {
    fs.readdirSync(pluginsDir).forEach((file) => {
        if (!file.endsWith('.js')) return;
        PLUGINS.push(require(path.join(pluginsDir, file)));
    });
}

// ─── Utils ───
function fmtDuration(sec) {
    if (!sec && sec !== 0) return '—';
    const s = Math.floor(sec % 60);
    const m = Math.floor((sec / 60) % 60);
    const h = Math.floor(sec / 3600);
    return h > 0
        ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
        : `${m}:${String(s).padStart(2, '0')}`;
}

function fmtViews(n) {
    if (n === null || n === undefined) return '—';
    if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return String(n);
}

function mimeOf(ext) {
    return {
        'mp4': 'video/mp4', 'webm': 'video/webm', 'mkv': 'video/x-matroska',
        'mov': 'video/quicktime',
        'mp3': 'audio/mpeg', 'm4a': 'audio/mp4', 'wav': 'audio/wav',
        'ogg': 'audio/ogg', 'opus': 'audio/opus',
    }[ext] || 'application/octet-stream';
}

// ─── GET /api/video/info ───
router.get('/api/video/info', async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: 'Paramètre url manquant' });

    const plugin = PLUGINS.find((p) => p.match(url));
    if (!plugin) return res.status(400).json({ error: 'Plateforme non supportée' });

    try {
        const info = await ytdlp.getInfo(url);
        res.json({
            title: info.title || 'Vidéo',
            thumbnail: info.thumbnail || (info.thumbnails?.slice(-1)[0]?.url ?? ''),
            duration: fmtDuration(info.duration),
            views: fmtViews(info.view_count),
            author: info.uploader || info.channel || info.creator || '—',
            platform: plugin.name
        });
    } catch (err) {
        console.error('info error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ─── GET /api/video/download ───
router.get('/api/video/download', async (req, res) => {
    const { url, format, quality } = req.query;
    if (!url) return res.status(400).json({ error: 'Paramètre url manquant' });

    const plugin = PLUGINS.find((p) => p.match(url));
    if (!plugin) return res.status(400).json({ error: 'Plateforme non supportée' });

    const fmt = format || 'mp4';
    const qual = quality || '720';
    const token = crypto.randomBytes(16).toString('hex');

    console.log(`⬇️  [${plugin.name}] ${fmt}/${qual} → token ${token.substring(0, 8)}...`);

    try {
        const result = await ytdlp.download({
            url,
            formatArgs: plugin.formatArgs(fmt, qual),
            token
        });

        console.log(`✅ Fichier: ${result.filename} (${(result.size / 1024 / 1024).toFixed(1)} MB)`);

        res.json({
            ok: true,
            token: result.token,
            ext: result.ext,
            size: result.size,
            streamUrl: `/api/video/stream?token=${result.token}`,
            downloadUrl: `/api/video/file?token=${result.token}`
        });
    } catch (err) {
        console.error('download error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ─── GET /api/video/stream?token=... ───
router.get('/api/video/stream', (req, res) => {
    const token = req.query.token;
    if (!token) return res.status(400).end('token manquant');

    const safe = String(token).replace(/[^a-f0-9]/gi, '');
    const files = fs.readdirSync(ytdlp.OUTPUT_DIR).filter((f) => f.startsWith(safe));
    if (!files.length) return res.status(404).end('Not found');

    const filePath = path.join(ytdlp.OUTPUT_DIR, files[0]);
    const stat = fs.statSync(filePath);
    const ext = path.extname(filePath).slice(1).toLowerCase();
    const mime = mimeOf(ext);
    const range = req.headers.range;

    if (range) {
        const m = /bytes=(\d*)-(\d*)/.exec(range);
        const start = m[1] ? parseInt(m[1]) : 0;
        const end = m[2] ? parseInt(m[2]) : stat.size - 1;
        res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${stat.size}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': end - start + 1,
            'Content-Type': mime,
        });
        fs.createReadStream(filePath, { start, end }).pipe(res);
    } else {
        res.writeHead(200, {
            'Content-Length': stat.size,
            'Content-Type': mime,
            'Accept-Ranges': 'bytes',
        });
        fs.createReadStream(filePath).pipe(res);
    }
});

// ─── GET /api/video/file?token=... ───
router.get('/api/video/file', (req, res) => {
    const token = req.query.token;
    if (!token) return res.status(400).end('token manquant');

    const safe = String(token).replace(/[^a-f0-9]/gi, '');
    const files = fs.readdirSync(ytdlp.OUTPUT_DIR).filter((f) => f.startsWith(safe));
    if (!files.length) return res.status(404).end('Not found');

    const filePath = path.join(ytdlp.OUTPUT_DIR, files[0]);
    const stat = fs.statSync(filePath);
    const ext = path.extname(filePath).slice(1).toLowerCase();
    const niceName = `marco_video_${Date.now()}.${ext}`;

    res.writeHead(200, {
        'Content-Length': stat.size,
        'Content-Type': mimeOf(ext),
        'Content-Disposition': `attachment; filename="${niceName}"`,
    });
    fs.createReadStream(filePath).pipe(res);
});

// ─── DELETE /api/video/:token ───
router.delete('/api/video/:token', (req, res) => {
    const ok = ytdlp.removeByToken(req.params.token);
    res.json({ ok });
});

// Nettoyage auto toutes les 5 minutes (fichiers > 30 min)
setInterval(() => ytdlp.cleanup(30 * 60 * 1000), 5 * 60 * 1000);

module.exports = router;
