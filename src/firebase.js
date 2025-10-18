import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB52IpHPC3L9rd0EO1Dg1rZpZ-5NhwqNQU",
  authDomain: "atlstockexchange.firebaseapp.com",
  databaseURL: "https://atlstockexchange-default-rtdb.firebaseio.com",
  projectId: "atlstockexchange",
  storageBucket: "atlstockexchange.firebasestorage.app",
  messagingSenderId: "873696554973",
  appId: "1:873696554973:web:1001a16efce42faf195034",
  measurementId: "G-GBREH8T2Z4"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
