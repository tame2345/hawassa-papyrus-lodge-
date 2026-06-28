import fs from 'fs';

const filePath = './src/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
let replaced = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Method)</th>') && lines[i].includes(')}')) {
    console.log('Found corrupt line at line ' + (i + 1) + ': ' + lines[i]);
    lines[i] = '                                        <th className="pb-2 text-left font-mono">ክፍያ (Method)</th>';
    replaced = true;
    break;
  }
}

if (replaced) {
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  console.log('Successfully repaired line 8941!');
} else {
  console.log('Corrupt line signature not found.');
}
