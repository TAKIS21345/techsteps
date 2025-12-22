import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyB3nEO9iegcJZC3aqHVh9Th6P8n8uN0QuQ",
    authDomain: "senior-tech-help.firebaseapp.com",
    projectId: "senior-tech-help",
    storageBucket: "senior-tech-help.firebasestorage.app",
    messagingSenderId: "907395120217",
    appId: "1:907395120217:web:b4a9a131f389a346034548",
    measurementId: "G-3TVV3JHXPH"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
