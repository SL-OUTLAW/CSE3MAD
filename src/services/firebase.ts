import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAjLkVMhQ6v84geYZSBqG19k5FqUJPUZjw",
  authDomain: "stemm-lab-a4.firebaseapp.com",
  projectId: "stemm-lab-a4",
  storageBucket: "stemm-lab-a4.firebasestorage.app",
  messagingSenderId: "990785393291",
  appId: "1:990785393291:web:936ac3e9ccac5e548bba8e",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export async function anonymousLogin() {
  const result = await signInAnonymously(auth);
  return result.user;
}
export async function registerWithEmail(email: string, password: string) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function loginWithEmail(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}