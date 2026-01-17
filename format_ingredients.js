const fs = require('fs');

function formatFile(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const keys = Object.keys(data).sort();
  const lines = ['{'];
  
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const name = data[key].name;
    const comma = i < keys.length - 1 ? ',' : '';
    lines.push(`  "${key}": {"name": "${name}"}${comma}`);
  }
  
  lines.push('}');
  fs.writeFileSync(filePath, lines.join('\n') + '\n');
}

formatFile('src/i18n/locales/data/ingredients.ua.json');
formatFile('src/i18n/locales/data/ingredients.ru.json');
console.log('Files formatted successfully');

