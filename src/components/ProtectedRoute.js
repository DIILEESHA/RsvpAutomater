import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import useAuth hook

// ProtectedRoute component to ensure only authenticated users can access certain routes
const ProtectedRoute = ({ element, ...rest }) => {
  const { isAuthenticated } = useAuth();

  // If not authenticated, redirect to the login page
  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  // If authenticated, render the protected component
  return element;
};

export default ProtectedRoute;
