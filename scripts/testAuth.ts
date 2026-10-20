import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const configPath = path.resolve(__dirname, '../firebase-applet-config.json');
  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  try {
    const userCredential = await signInAnonymously(auth);
    console.log('Signed in anonymously, UID:', userCredential.user.uid);

    const token = await userCredential.user.getIdToken();
    console.log('ID Token retrieved:', token.substring(0, 20) + '...');

    const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    await setDoc(doc(db, 'lessons', 'starter_w1_o1'), { test: true }, { merge: true });
    console.log('Successfully wrote to Firestore via SDK!');
  } catch (err: any) {
    console.error('Anonymous auth / Firestore write failed:', err.message);
  }
}

main();
