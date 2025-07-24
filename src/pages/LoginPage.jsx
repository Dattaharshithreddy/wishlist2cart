import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";
import { auth, provider, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShoppingCart,
  User as UserIcon,
} from "lucide-react";

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { loginWithEmail, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isLogin) {
        await loginWithEmail(email.trim(), password);
        toast({ title: "Login successful!" });
        navigate("/dashboard");
      } else {
        await register(email.trim(), password, name);
        toast({
          title: "Account created!",
          description: "Now log in using your credentials.",
        });
        setIsLogin(true);
        setEmail("");
        setPassword("");
        setName("");
      }
    } catch (err) {
      toast({
        title: "Auth Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      const userData = {
        uid: user.uid,
        name: user.displayName || "Google User",
        email: user.email,
        avatar:
          user.photoURL ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
            user.email
          )}`,
      };

      if (!snap.exists()) await setDoc(userRef, userData);

      localStorage.setItem("wishlist2cart_user", JSON.stringify(userData));
      toast({
        title: "Google Sign-In Success",
        description: `Welcome ${userData.name}`,
      });

      navigate("/dashboard");
    } catch (err) {
      if (err.code === "auth/popup-closed-by-user") {
        toast({
          title: "Popup Closed",
          description: "You closed the sign-in popup.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Google Sign-In Failed",
          description: err.message,
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md bg-white dark:bg-gray-950/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl p-6 space-y-6">
        {/* 🛍️ Logo + App Name */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-blue-500 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-violet-600 to-blue-600 text-transparent bg-clip-text">
              Wishlist2Cart
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
            {isLogin ? "Welcome Back!" : "Create an Account"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {isLogin
              ? "Sign in to manage your wishlist"
              : "Start saving and sharing your favorite items"}
          </p>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="relative">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="pl-10"
              />
              <UserIcon className="absolute left-3 top-9 w-5 h-5 text-gray-400" />
            </div>
          )}
          <div className="relative">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="pl-10"
            />
            <Mail className="absolute left-3 top-9 w-5 h-5 text-gray-400" />
          </div>
          <div className="relative">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="pl-10 pr-10"
            />
            <Lock className="absolute left-3 top-9 w-5 h-5 text-gray-400" />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-9 w-5 h-5 text-gray-400"
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting
              ? "Please wait..."
              : isLogin
              ? "Log In"
              : "Create Account"}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative text-center">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300 dark:border-gray-700"></span>
          </div>
          <div className="relative bg-white dark:bg-gray-950 px-2 text-gray-500 dark:text-gray-400 text-xs uppercase">
            Or continue with
          </div>
        </div>

        {/* 🚀 Google Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing in..." : "Continue with Google"}
        </Button>

        {/* Toggle: Login / Register */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          {isLogin ? "Don’t have an account?" : "Already have an account?"}{" "}
          <button
            className="text-violet-600 hover:text-blue-600 font-semibold ml-1"
            onClick={() => setIsLogin(prev => !prev)}
          >
            {isLogin ? "Sign Up" : "Log In"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
