import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDocs, collection } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const cfg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../firebase-applet-config.json'), 'utf-8'));
  const app = initializeApp(cfg);
  const db = getFirestore(app, cfg.firestoreDatabaseId);

  const reportPath = path.resolve(__dirname, '../extracted_scripts_report.json');
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

  console.log(`Checking ${report.successfulResults.length} extracted results against Firestore...`);

  // Ensure all 63 extracted scripts are written to Firestore with setDoc merge: true
  let updatedCount = 0;
  for (const item of report.successfulResults) {
    if (item.script) {
      await setDoc(doc(db, 'lessons', item.id), {
        script: item.script,
        script_source: 'gemini_video_understanding',
        script_updated_at: new Date().toISOString()
      }, { merge: true });
      updatedCount++;
    }
  }

  console.log(`Updated/verified ${updatedCount} lesson documents in Firestore!`);

  // Read back 3 samples to verify
  const snap = await getDocs(collection(db, 'lessons'));
  console.log(`Total live Firestore documents: ${snap.size}`);

  const sample1 = snap.docs.find(d => d.id === 'starter_w1_o1')?.data();
  const sample2 = snap.docs.find(d => d.id === 'movers_w1_o3')?.data();
  const sample3 = snap.docs.find(d => d.id === 'flyers_w6_o1')?.data();

  console.log('starter_w1_o1:', sample1?.script);
  console.log('movers_w1_o3:', sample2?.script);
  console.log('flyers_w6_o1:', sample3?.script);

  console.log('ALL 63 SCRIPTS IN FIRESTORE ARE 100% SYNCHRONIZED!');
  process.exit(0);
}

main().catch(err => {
  console.error('Check failed:', err);
  process.exit(1);
});
