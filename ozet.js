const fs = require('fs');
const path = require('path');

const IGNORE_DIRS = [
    '.git',
    'node_modules',
    'dist',
    'build',
    '.vscode',
    '.idea',
    '__pycache__',
    'venv',
    '.venv',
    'env',
    'site-packages'
];

const IGNORE_EXTS = [
    '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg',
    '.mp4', '.avi', '.mov', '.pdf', '.zip', '.tar', '.gz',
    '.exe', '.dll', '.so', '.dylib', '.bin', '.pyc', '.DS_Store'
];

// Tek bir dosyanın maksimum boyutu (örn. 500 KB üstü dev dosyaları atla)
const MAX_FILE_SIZE_BYTES = 500 * 1024;

const OUTPUT_FILE = 'ozet.txt';
const SCRIPT_NAME = path.basename(__filename);

function getFiles(dir, baseDir) {
    let results = [];
    let list;

    try {
        list = fs.readdirSync(dir);
    } catch {
        return results;
    }

    for (const file of list) {
        const fullPath = path.join(dir, file);
        let stat;

        try {
            stat = fs.lstatSync(fullPath);
        } catch {
            continue;
        }

        // Sembolik linkleri atla (sonsuz döngü veya dev klasör riskini önler)
        if (stat.isSymbolicLink()) {
            continue;
        }

        if (stat.isDirectory()) {
            if (!IGNORE_DIRS.includes(file)) {
                results = results.concat(getFiles(fullPath, baseDir));
            }
        } else if (stat.isFile()) {
            const ext = path.extname(file).toLowerCase();
            if (
                !IGNORE_EXTS.includes(ext) &&
                file !== OUTPUT_FILE &&
                file !== SCRIPT_NAME &&
                file !== 'ozet.xml'
            ) {
                results.push({ fullPath, size: stat.size });
            }
        }
    }

    return results;
}

try {
    const baseDir = __dirname;
    console.log(`📂 Taranıyor: ${baseDir}`);

    const files = getFiles(baseDir, baseDir);
    const outputPath = path.join(baseDir, OUTPUT_FILE);
    const stream = fs.createWriteStream(outputPath, { encoding: 'utf8' });

    stream.write('--- PROJE DOSYALARI ---\n\n');

    let addedCount = 0;

    for (const { fullPath, size } of files) {
        const relativePath = path.relative(baseDir, fullPath);

        if (size > MAX_FILE_SIZE_BYTES) {
            console.log(`  ! Büyük dosya atlandı (${Math.round(size / 1024)} KB): ${relativePath}`);
            continue;
        }

        try {
            const content = fs.readFileSync(fullPath, 'utf8');
            stream.write('================================================\n');
            stream.write(`DOSYA: ${relativePath}\n`);
            stream.write('================================================\n');
            stream.write(`${content}\n\n`);
            addedCount++;
            console.log(`  + Okundu: ${relativePath}`);
        } catch {
            console.log(`  - Okunamadı/Atlandı: ${relativePath}`);
        }
    }

    stream.end('--- SON ---\n');

    stream.on('finish', () => {
        console.log(`✅ Tamamlandı! ${addedCount} dosya ${OUTPUT_FILE} içine yazıldı.`);
    });
} catch (error) {
    console.error('❌ Bir hata oluştu:', error);
}