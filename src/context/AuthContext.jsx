import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Create a context for authentication
const AuthContext = createContext();

// Custom hook to use the authentication context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provide the AuthContext to the rest of the app
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Example of setting authentication (could use localStorage or API)
  useEffect(() => {
    // Check if the user is authenticated (e.g., check localStorage or session)
    const user = localStorage.getItem('user');
    if (user) {
      setIsAuthenticated(true);
    }
  }, []);

  const login = () => {
    localStorage.setItem('user', 'authenticated');
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('user');
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
