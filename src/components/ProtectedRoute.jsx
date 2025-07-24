// src/components/ProtectedRoute.jsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Protects routes from unauthenticated access.
 * If the user is not logged in, they are redirected to /login.
 * While waiting for Firebase to finish checking auth state, show a spinner.
 */
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Show loading spinner while Firebase Auth is loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  // ✅ Route is protected — return content if logged in, otherwise redirect
  return user ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
