module.exports = {
    name: 'instagram',
    match: (url) => /instagram\.com|instagr\.am/i.test(url),
    formatArgs: (format, quality) => {
        if (format === 'mp3') {
            return [
                '-x', '--audio-format', 'mp3',
                '--audio-quality', quality === '320' ? '0' : '5',
                '--impersonate', 'chrome',
            ];
        }
        const h = quality === '360' ? 360 : 720;
        return [
            '-f', `best[height<=${h}][ext=mp4]/best[height<=${h}]/best`,
            '--merge-output-format', 'mp4',
            '--impersonate', 'chrome',
        ];
    },
};
