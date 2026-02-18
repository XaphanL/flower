// ===== CONFIG =====
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQoLpailAcrQVPQ9aYlVF5yb0qgJiZvQG21Ux9wVIpWzg9_QFDWYu8bwglwGC1qZXZ5OrLSDMrdD9X1/pub?output=csv";

// ===== UTILS =====
function convertDriveLink(url) {
    const match = url.match(/\/d\/(.*?)\/view/);
    return match ? `https://drive.google.com/uc?export=view&id=${match[1]}` : url;
}

// Простая стемминг-функция для русских слов
function stemWord(word) {
    return word.toLowerCase().replace(/[^\wа-яё]/g, '');
}

// ===== STATE =====
let flowers = [];
let meanings = [];

// ===== CSV PARSER =====
async function loadCSV() {
    const response = await fetch(CSV_URL);
    const text = await response.text();
    const lines = text.trim().split("\n");
    const headers = lines[0].split(",");
    
    flowers = [];
    meanings = [];
    
    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); // учёт кавычек
        
        const name = cols[0].replace(/"/g,'').trim();
        const role = cols[1].replace(/"/g,'').trim();
        const values = cols[2].replace(/"/g,'').trim();
        const img = convertDriveLink(cols[3].replace(/"/g,'').trim());
        const meaning = cols[4].replace(/"/g,'').trim();
        const keywords = cols[5].replace(/"/g,'').trim();
        
        flowers.push({ name, role, values, img });
        meanings.push({ meaning, keywords: keywords.split(',').map(s => s.trim()) });
    }

    console.log("===== DEBUG =====");
    console.log("Flowers:", flowers);
    console.log("Meanings:", meanings);
    console.log("=================");
}

// ===== FLOWER MATCH =====
function generateBouquet(inputText) {
    const words = inputText.split(/\s+/).map(stemWord).filter(Boolean);
    const detectedMeanings = [];
    
    meanings.forEach(obj => {
        const stemmedKeywords = obj.keywords.map(stemWord);
        if (words.some(w => stemmedKeywords.includes(w))) {
            detectedMeanings.push(obj.meaning);
        }
    });

    console.log("===== DEBUG =====");
    console.log("Input text:", inputText);
    console.log("Words:", words);
    console.log("Detected meanings:", detectedMeanings);
    console.log("=================");

    const bouquetContainer = document.getElementById("bouquetContainer");
    bouquetContainer.innerHTML = "";

    if (!detectedMeanings.length) {
        bouquetContainer.innerHTML = `<p>Не удалось подобрать цветы. Попробуйте другую фразу 🌿</p>`;
        return;
    }

    const selectedFlowers = flowers.filter(flower =>
        detectedMeanings.some(dm => flower.values.split(',').map(v => stemWord(v)).includes(stemWord(dm)))
    );

    selectedFlowers.forEach(flower => {
        const card = document.createElement("div");
        card.className = "flower-card";
        card.innerHTML = `
            <img src="${flower.img}" alt="${flower.name}" class="flower-img">
            <div class="flower-name">${flower.name}</div>
            <div class="flower-role">${flower.role}</div>
        `;
        bouquetContainer.appendChild(card);
    });
}

// ===== INIT =====
window.addEventListener("DOMContentLoaded", async () => {
    await loadCSV();

    const btn = document.getElementById("generateBtn");
    const textarea = document.getElementById("inputText");

    btn.addEventListener("click", () => {
        generateBouquet(textarea.value);
    });
});
