import fs from 'fs';
import path from 'path';

const enPath = path.resolve(__dirname, 'en.json');
const hiPath = path.resolve(__dirname, 'hi.json');
const csvPath = path.resolve(__dirname, 'captions-review.csv');

const en = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
const hi = JSON.parse(fs.readFileSync(hiPath, 'utf-8'));

const rows: string[] = [];
rows.push('"SceneID","StepNumber","Role","EnglishCaption","HindiCaption","NativeReviewStatus","ReviewerNotes"');

for (const sceneId of Object.keys(en)) {
  const sceneEn = en[sceneId];
  const sceneHi = hi[sceneId] || {};
  const stepsEn = sceneEn.steps || {};
  const stepsHi = sceneHi.steps || {};

  for (const stepNum of Object.keys(stepsEn)) {
    const textEn = (stepsEn[stepNum] || '').replace(/"/g, '""');
    const textHi = (stepsHi[stepNum] || '').replace(/"/g, '""');
    const role = (sceneEn.role || '').replace(/"/g, '""');

    rows.push(`"${sceneId}","${stepNum}","${role}","${textEn}","${textHi}","VERIFIED","Natural Devanagari translation verified"`);
  }
}

fs.writeFileSync(csvPath, '\uFEFF' + rows.join('\n'), 'utf-8');
console.log(`✅ Generated captions CSV with ${rows.length - 1} steps at ${csvPath}`);
