import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAi5sO9YJAhy_x6nMbJWNif96N_JJQC8LU",
  authDomain: "wishlist2cart-web.firebaseapp.com",
  projectId: "wishlist2cart-web",
  storageBucket: "wishlist2cart-web.firebasestorage.app",  // usually .appspot.com
  messagingSenderId: "671248690215",
  appId: "1:671248690215:web:425a8e80ed464ad6877202",
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const db = getFirestore(app);
const storage = getStorage(app);

const logout = () => signOut(auth);

export {
  app,
  auth,
  provider,
  logout,
  db,
  storage,
};
