import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, provider, db } from "../lib/firebase";
import {
  signInWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const syncUserToLocalState = async (uid) => {
    const userRef = doc(db, "users", uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const userData = docSnap.data();
      setUser(userData);
      localStorage.setItem("wishlist2cart_user", JSON.stringify(userData));
      return userData;
    } else {
      const authUser = auth.currentUser;
      if (authUser?.email) {
        const fallbackUserData = {
          uid: authUser.uid,
          name: authUser.displayName || "User",
          email: authUser.email,
          avatar:
            authUser.photoURL ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(authUser.email)}`
        };
        await setDoc(userRef, fallbackUserData);
        setUser(fallbackUserData);
        localStorage.setItem("wishlist2cart_user", JSON.stringify(fallbackUserData));
        return fallbackUserData;
      } else {
        await signOut(auth);
        setUser(null);
        localStorage.removeItem("wishlist2cart_user");
        throw new Error("User not found in Firestore.");
      }
    }
  };

  const register = async (email, password, name) => {
    const cleanedEmail = email.toLowerCase().trim();
    const methods = await fetchSignInMethodsForEmail(auth, cleanedEmail);
    if (methods.length > 0) throw new Error("Email already in use.");

    const res = await createUserWithEmailAndPassword(auth, cleanedEmail, password);
    const user = res.user;

    const userData = {
      uid: user.uid,
      name,
      email: user.email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email)}`
    };

    await setDoc(doc(db, "users", user.uid), userData);
    setUser(userData);
    localStorage.setItem("wishlist2cart_user", JSON.stringify(userData));
    return userData;
  };

  const loginWithEmail = async (email, password) => {
    const res = await signInWithEmailAndPassword(auth, email, password);
    return await syncUserToLocalState(res.user.uid);
  };

  const loginWithGoogle = () => {
    return signInWithRedirect(auth, provider); // Uses redirect
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    localStorage.removeItem("wishlist2cart_user");
  };

  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          const user = result.user;
          const userRef = doc(db, "users", user.uid);
          const userExists = (await getDoc(userRef)).exists();

          if (!userExists) {
            const newUserData = {
              uid: user.uid,
              name: user.displayName || "Guest",
              email: user.email,
              avatar:
                user.photoURL ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email)}`
            };
            await setDoc(userRef, newUserData);
            setUser(newUserData);
            localStorage.setItem("wishlist2cart_user", JSON.stringify(newUserData));
          } else {
            await syncUserToLocalState(user.uid);
          }

          navigate("/dashboard"); // ✅ redirect after successful login
        }
      })
      .catch((err) => {
        console.error("Redirect login error:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser && !user) {
        try {
          await syncUserToLocalState(authUser.uid);
        } catch (err) {
          console.error("Sync error:", err);
        }
      }
    });
    return () => unsubscribe();
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithEmail,
        register,
        loginWithGoogle,
        logout,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
