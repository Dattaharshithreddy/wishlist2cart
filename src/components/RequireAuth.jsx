// src/components/RequireAuth.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function RequireAuth({ children, requiredRole = null }) {
  const { user } = useAuth();

  if (!user) {
    // Not logged in, you can redirect to sign-in or show a message:
    return <Navigate to="/login" replace />;
  }

  // If you want role-based control (e.g. admin only),
  // check user roles/claims here:
  if (requiredRole && !user?.roles?.includes(requiredRole)) {
    // Not authorized
    return <div className="container mx-auto py-20 text-center text-red-600">
      You do not have permission to access this page.
    </div>;
  }

  return children;
}
