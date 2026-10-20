import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SAMPLE_LESSONS, getLessonDocId } from '../src/data/lessonsData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seed() {
  console.log('=== SEEDING FIRESTORE LESSONS VIA REST API ===');
  const configPath = path.resolve(__dirname, '../firebase-applet-config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

  const projectId = config.projectId;
  const databaseId = config.firestoreDatabaseId;
  const apiKey = config.apiKey;

  console.log(`Target: Project [${projectId}], Database [${databaseId}]`);

  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/lessons`;

  let successCount = 0;
  for (const lesson of SAMPLE_LESSONS) {
    const docId = getLessonDocId(lesson.level, lesson.week, lesson.order);
    const url = `${baseUrl}/${docId}?key=${apiKey}`;

    const body = {
      fields: {
        id: { stringValue: docId },
        level: { stringValue: lesson.level },
        week: { integerValue: String(lesson.week) },
        order: { integerValue: String(lesson.order) },
        topic: { stringValue: lesson.topic },
        embed_url: { stringValue: lesson.embed_url },
        script: { stringValue: lesson.script || '' },
        updated_at: { stringValue: new Date().toISOString() }
      }
    };

    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Failed to write ${docId}:`, res.status, errText);
      throw new Error(`Failed to write ${docId}: ${res.statusText}`);
    }

    successCount++;
    if (successCount % 15 === 0 || successCount === SAMPLE_LESSONS.length) {
      console.log(`Progress: ${successCount}/${SAMPLE_LESSONS.length} written successfully (last: ${docId})`);
    }
  }

  console.log(`\nVerifying documents in collection "lessons"...`);
  const listUrl = `${baseUrl}?key=${apiKey}&pageSize=100`;
  const listRes = await fetch(listUrl);
  if (!listRes.ok) {
    const errText = await listRes.text();
    console.error('Failed to list lessons:', listRes.status, errText);
    throw new Error('Failed to list collection lessons');
  }

  const listData = await listRes.json();
  const docs = listData.documents || [];
  console.log(`VERIFICATION CONFIRMED: Found ${docs.length} documents in collection "lessons" on Firestore!`);

  // Print 3 samples
  console.log('\n--- 3 Sample Documents from Live Firestore ---');
  for (const d of docs.slice(0, 3)) {
    const name = d.name.split('/').pop();
    const fields = d.fields;
    console.log(`Doc ID: ${name}`);
    console.log(`  Level: ${fields?.level?.stringValue}`);
    console.log(`  Topic: ${fields?.topic?.stringValue}`);
    console.log(`  Script: "${fields?.script?.stringValue}"`);
  }

  console.log('\n=== FIRESTORE SEEDING COMPLETED 100% SUCCESSFULLY ===');
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
