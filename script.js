// Твоя рабочая ссылка на Google Sheets CSV
const sheetCSVUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQoLpailAcrQVPQ9aYlVF5yb0qgJiZvQG21Ux9wVIpWzg9_QFDWYu8bwglwGC1qZXZ5OrLSDMrdD9X1/pub?output=csv";

let flowersData = [];
let currentBouquet = [];
let selectedAccents = new Set();

// Загружаем CSV при старте
async function loadCSV() {
  try {
    const res = await fetch(sheetCSVUrl);
    const csvText = await res.text();
    parseCSV(csvText);
  } catch (err) {
    console.error("Ошибка при загрузке CSV:", err);
  }
}

// Парсим CSV в массив объектов
function parseCSV(csvText) {
  const lines = csvText.split("\n").filter(line => line.trim() !== "");
  const headers = lines[0].split(",").map(h => h.trim());

  flowersData = lines.slice(1).map(line => {
    // корректно разбиваем строку, убираем кавычки
    const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g).map(v => v.replace(/^"|"$/g, "").trim());
    const obj = {};
    headers.forEach((header, idx) => {
      obj[header] = values[idx] || "";
    });
    obj["Ключевые слова"] = obj["Ключевые слова"].split(",").map(w => w.trim().toLowerCase());
    obj["Значения"] = obj["Значения"].split(",").map(v => v.trim());
    return obj;
  });
}

// Функция поиска цветов по тексту
function getFlowersFromText(text) {
  const words = text.toLowerCase().split(/[\s,.!?]+/);
  const matched = [];

  flowersData.forEach(flower => {
    for (let kw of flower["Ключевые слова"]) {
      if (words.includes(kw)) {
        matched.push(flower);
        break;
      }
    }
  });

  // Сортируем: main (Основной) -> accent (Акцент)
  matched.sort((a, b) => (a["Роль"] === "main" ? -1 : 1));

  return matched;
}

// Отображение букета в виде карточек
function displayBouquet(flowers) {
	currentBouquet = [...flowers];
	selectedAccents.clear();

flowers.forEach(f => {
  if (f["Роль"] === "accent") {
    selectedAccents.add(f["Смысл"]);
  }
});
  const container = document.getElementById("bouquetContainer");
  container.innerHTML = "";

  if (flowers.length === 0) {
    container.innerHTML = "<p>По введённым словам цветы не найдены 😢</p>";
    return;
  }

  flowers.forEach(flower => {
    const card = document.createElement("div");
    card.className = "flower-card " + flower["Роль"];

    // Картинка
    const img = document.createElement("img");
    img.className = "flower-img";
    img.src = flower["изображение"];
    img.alt = flower["Название"];

    // Название
    const name = document.createElement("div");
    name.className = "flower-name";
    name.textContent = flower["Название"];

    // Роль понятным языком
    const role = document.createElement("div");
    role.className = "flower-role";
    role.textContent = flower["Роль"] === "main" ? "Основной цветок" : "Акцент";

    // Описание по значениям
    const desc = document.createElement("div");
    desc.className = "flower-desc";
    desc.textContent = flower["Значения"].join(", ");

    card.appendChild(img);
    card.appendChild(name);
    card.appendChild(role);
    card.appendChild(desc);

    container.appendChild(card);
  });
}

// Кнопка генерации
document.getElementById("generateBtn").addEventListener("click", () => {
  const text = document.getElementById("inputText").value;
  const flowers = getFlowersFromText(text);

  displayBouquet(flowers);
  buildAccentMenu(); // ← ВОТ СЮДА
});

// Загружаем CSV при старте
loadCSV();

// показать / скрыть список акцентов
document.getElementById("toggleAccent").addEventListener("click", () => {
  const list = document.getElementById("accentList");

  if (list.style.display === "none") {
    buildAccentMenu();
    list.style.display = "block";
  } else {
    list.style.display = "none";
  }
});

function buildAccentMenu() {
  const list = document.getElementById("accentList");
  list.innerHTML = "";

  // берём уникальные смыслы акцентов
  const accents = flowersData
    .filter(f => f["Роль"] === "accent");

  const uniqueMeanings = [...new Map(
    accents.map(f => [f["Смысл"], f])
  ).values()];

  uniqueMeanings.forEach(flower => {

    const meaning = flower["Смысл"];

    const btn = document.createElement("button");
    btn.textContent = meaning;

    if (selectedAccents.has(meaning)) {
      btn.classList.add("active");
    }

    btn.onclick = () => toggleAccent(meaning);

    list.appendChild(btn);
  });
}

function toggleAccent(meaning) {

  if (selectedAccents.has(meaning)) {

    // удаляем смысл
    selectedAccents.delete(meaning);

    // удаляем ВСЕ цветы с этим смыслом
    currentBouquet =
      currentBouquet.filter(f => f["Смысл"] !== meaning);

  } else {

    selectedAccents.add(meaning);

    // добавляем цветы, связанные со смыслом
    const flowersToAdd = flowersData.filter(
      f => f["Смысл"] === meaning && f["Роль"] === "accent"
    );

    flowersToAdd.forEach(f => {
      const exists = currentBouquet.find(
        x => x["Название"] === f["Название"]
      );
      if (!exists) currentBouquet.push(f);
    });
  }

  // сортировка
  currentBouquet.sort((a,b)=>
    a["Роль"] === "main" ? -1 : 1
  );

  displayBouquet(currentBouquet);
  buildAccentMenu();
}
