import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDocs, collection } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SAMPLE_LESSONS, getLessonDocId } from '../src/data/lessonsData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('--- Starting Firestore Lessons Seeding ---');

  // Load config
  const configPath = path.resolve(__dirname, '../firebase-applet-config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error('firebase-applet-config.json not found!');
  }

  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  console.log('Project ID:', firebaseConfig.projectId);
  console.log('Database ID:', firebaseConfig.firestoreDatabaseId);

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

  console.log(`Writing ${SAMPLE_LESSONS.length} lesson documents to collection "lessons"...`);

  let count = 0;
  for (const lesson of SAMPLE_LESSONS) {
    const docId = getLessonDocId(lesson.level, lesson.week, lesson.order);
    const docRef = doc(db, 'lessons', docId);

    const data = {
      id: docId,
      level: lesson.level,
      week: lesson.week,
      order: lesson.order,
      topic: lesson.topic,
      embed_url: lesson.embed_url,
      script: lesson.script || '',
      updated_at: new Date().toISOString()
    };

    await setDoc(docRef, data, { merge: true });
    count++;
    if (count % 10 === 0 || count === SAMPLE_LESSONS.length) {
      console.log(`  -> Wrote ${count}/${SAMPLE_LESSONS.length} lessons (last: ${docId})`);
    }
  }

  console.log(`\nVerifying collection "lessons" from Firestore...`);
  const snap = await getDocs(collection(db, 'lessons'));
  console.log(`Total documents found in collection "lessons": ${snap.size}`);

  let missingScriptCount = 0;
  snap.forEach((d) => {
    const item = d.data();
    if (!item.script) {
      missingScriptCount++;
    }
  });

  console.log(`Documents with valid script: ${snap.size - missingScriptCount}/${snap.size}`);
  console.log('--- SEEDING COMPLETED SUCCESSFULLY ---');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seeding failed with error:', err);
  process.exit(1);
});
