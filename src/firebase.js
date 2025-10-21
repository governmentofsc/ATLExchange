import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBOcH6M-JMBzROkK4F_-eHQing7ngz9xis",
  authDomain: "project-5b536.firebaseapp.com",
  databaseURL: "https://project-5b536-default-rtdb.firebaseio.com",
  projectId: "project-5b536",
  storageBucket: "project-5b536.firebasestorage.app",
  messagingSenderId: "18490330325",
  appId: "1:18490330325:web:dd336aab1cc2899783a65c",
  measurementId: "G-L1NZSG10D0"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
