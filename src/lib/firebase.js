import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAi5sO9YJAhy_x6nMbJWNif96N_JJQC8LU",
  authDomain: "wishlist2cart-web.firebaseapp.com",
  projectId: "wishlist2cart-web",
  storageBucket: "wishlist2cart-web.firebasestorage.app",
  messagingSenderId: "671248690215",
  appId: "1:671248690215:web:425a8e80ed464ad6877202",
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Auth
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Initialize Firestore
const db = getFirestore(app);
const storage = getStorage(app);


// Export for use in your app
export {
  app,
  auth,
  provider,
  signOut,
  db,
  storage,
};
