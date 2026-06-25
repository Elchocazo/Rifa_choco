import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAahGvpe4wwjzBEZ8cO7ZlUDNd82xpEF9w",
  authDomain: "rifa-choco.firebaseapp.com",
  projectId: "rifa-choco",
  storageBucket: "rifa-choco.firebasestorage.app",
  messagingSenderId: "590378355731",
  appId: "1:590378355731:web:3a73d7d112f1c3697b43e6",
  measurementId: "G-88F0VZTGH9"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
