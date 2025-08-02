// src/components/RequireAuth.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function RequireAuth({ children, requiredRole = null }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    // Detect roles as array or single string
    const userHasRole = Array.isArray(user.roles)
      ? user.roles.includes(requiredRole)
      : user.role === requiredRole;

    if (!userHasRole) {
      return (
        <div className="container mx-auto py-20 text-center text-red-600">
          You do not have permission to access this page.
        </div>
      );
    }
  }


  return children;
}
