const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Chemins vers ffmpeg (Render n'a pas ffmpeg en système par défaut)
let ffmpegPath = null;
try {
    ffmpegPath = require('ffmpeg-static');
    console.log('🎬 ffmpeg-static:', ffmpegPath);
} catch {
    // Fallback : utiliser ffmpeg du système (Render en a un)
    console.log('⚠️ ffmpeg-static non installé, utilisation du ffmpeg système');
}

// Détecter aussi yt-dlp dans ./bin (installé par build.sh sur Render)
const fs = require('fs');
const path = require('path');
let ytDlpBinary = 'yt-dlp';
const localYtDlp = path.join(__dirname, '..', '..', 'bin', 'yt-dlp');
if (fs.existsSync(localYtDlp)) {
    ytDlpBinary = localYtDlp;
    console.log('✅ yt-dlp local détecté:', ytDlpBinary);
}


const OUTPUT_DIR = path.join(__dirname, '..', 'tmp');
const COOKIES_FILE = path.join(__dirname, '..', 'cookies.txt');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function detectJsRuntime() {
    try {
        const deno = spawnSync('deno', ['--version'], { stdio: 'ignore' });
        if (deno.status === 0) return 'deno';
    } catch {}
    return 'node';
}

const JS_RUNTIME = detectJsRuntime();

function check() {
    return new Promise((resolve) => {
        const p = spawn(ytDlpBinary, ['--version']);
        p.on('close', (code) => resolve(code === 0));
        p.on('error', () => resolve(false));
    });
}

function getInfo(url) {
    return new Promise((resolve, reject) => {
        const args = ['-J', '--no-playlist', '--no-warnings', '--js-runtimes', JS_RUNTIME, url];
        if (fs.existsSync(COOKIES_FILE)) args.push('--cookies', COOKIES_FILE);

        const yt = spawn(ytDlpBinary, args);
        let out = '', err = '';
        yt.stdout.on('data', (d) => (out += d.toString()));
        yt.stderr.on('data', (d) => (err += d.toString()));
        yt.on('error', (e) => reject(new Error(`yt-dlp introuvable : ${e.message}`)));
        yt.on('close', (code) => {
            if (code !== 0) return reject(new Error(err.trim() || `yt-dlp code ${code}`));
            try { resolve(JSON.parse(out)); }
            catch { reject(new Error('Réponse JSON invalide')); }
        });
    });
}

/**
 * Télécharge une vidéo dans le dossier tmp/ avec un token unique
 * @returns {Promise<{token, filename, path, size}>}
 */
function download({ url, formatArgs, token }) {
    return new Promise((resolve, reject) => {
        const outTpl = path.join(OUTPUT_DIR, `${token}.%(ext)s`);
        const args = [...formatArgs];
        args.push('--js-runtimes', JS_RUNTIME);
        if (fs.existsSync(COOKIES_FILE)) args.push('--cookies', COOKIES_FILE);
        args.push('--no-playlist', '-o', outTpl, url);

        const before = new Set(fs.readdirSync(OUTPUT_DIR));

        const proc = spawn(ytDlpBinary, args);
        proc.stdout.on('data', (d) => process.stdout.write(d));
        proc.stderr.on('data', (d) => process.stderr.write(d));

        proc.on('error', (e) => reject(new Error(e.message)));
        proc.on('close', (code) => {
            if (code !== 0) return reject(new Error(`yt-dlp a échoué (code ${code})`));

            const after = fs.readdirSync(OUTPUT_DIR);
            const created = after.find((f) => !before.has(f) && f.startsWith(token));

            if (!created) return reject(new Error('Fichier non créé'));

            const fullPath = path.join(OUTPUT_DIR, created);
            const stat = fs.statSync(fullPath);
            const ext = path.extname(created).slice(1);

            resolve({
                token,
                filename: created,
                path: fullPath,
                size: stat.size,
                ext
            });
        });
    });
}

/**
 * Supprime un fichier par token
 */
function removeByToken(token) {
    try {
        const safe = String(token).replace(/[^a-f0-9]/gi, '');
        const files = fs.readdirSync(OUTPUT_DIR).filter((f) => f.startsWith(safe));
        files.forEach((f) => fs.unlinkSync(path.join(OUTPUT_DIR, f)));
        return true;
    } catch { return false; }
}

/**
 * Nettoyage des fichiers > maxAgeMs (défaut 30 min)
 */
function cleanup(maxAgeMs = 30 * 60 * 1000) {
    try {
        const now = Date.now();
        let count = 0;
        fs.readdirSync(OUTPUT_DIR).forEach((f) => {
            const full = path.join(OUTPUT_DIR, f);
            try {
                const stat = fs.statSync(full);
                if (now - stat.mtimeMs > maxAgeMs) {
                    fs.unlinkSync(full);
                    count++;
                }
            } catch {}
        });
        if (count > 0) console.log(`🧹 ${count} fichier(s) vidéo supprimé(s)`);
    } catch {}
}

module.exports = { check, getInfo, download, removeByToken, cleanup, OUTPUT_DIR, COOKIES_FILE, JS_RUNTIME, ffmpegPath, ytDlpBinary };
