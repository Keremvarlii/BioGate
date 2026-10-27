const fs = require('fs');
const path = require('path');

const IGNORE_DIRS = ['.git', 'node_modules', 'dist', 'build', '.vscode'];
const IGNORE_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.mp4', '.pdf', '.zip', '.DS_Store'];
const OUTPUT_FILE = 'ozet.txt'; // <-- Artık düz metin belgesi!
const SCRIPT_NAME = path.basename(__filename);

function getFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat && stat.isDirectory()) {
            if (!IGNORE_DIRS.includes(file)) {
                results = results.concat(getFiles(fullPath));
            }
        } else {
            const ext = path.extname(file).toLowerCase();
            if (!IGNORE_EXTS.includes(ext) && file !== OUTPUT_FILE && file !== SCRIPT_NAME && file !== 'ozet.xml') {
                results.push(fullPath);
            }
        }
    });
    return results;
}

try {
    const baseDir = __dirname;
    console.log(`📂 Şurası taranıyor: ${baseDir}`);
    
    const files = getFiles(baseDir);
    let textContent = '--- PROJE DOSYALARI ---\n\n';
    
    files.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        const relativePath = path.relative(baseDir, file);
        
        textContent += `================================================\n`;
        textContent += `DOSYA: ${relativePath}\n`;
        textContent += `================================================\n`;
        textContent += `${content}\n\n`;
        
        console.log(`  + Okundu: ${relativePath}`);
    });
    
    const outputPath = path.join(baseDir, OUTPUT_FILE);
    fs.writeFileSync(outputPath, textContent, 'utf8');
    console.log(`✅ Başarılı! Toplam \({files.length} dosya birleştirildi ve\){OUTPUT_FILE} oluşturuldu.`);
} catch (error) {
    console.error("❌ Bir hata oluştu:", error);
}