// src/App.js
import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { Layout } from "antd";
import AdminDashboard from "./components/AdminDashboard";
import GuestManager from "./components/GuestManager";
import RSVPForm from "./components/RSVPForm";
import Login from "./components/Login";
import "./App.css";
import ThankYouPage from "./components/ThankYouPage";
import { auth } from "./firebase";
import Home from "./pages/home/Home";

const { Header, Content } = Layout;

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    // Check localStorage for auth status
    const storedAuth = localStorage.getItem("isAuthenticated");
    if (storedAuth === "true") {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  if (isAuthenticated === null) {
    return null; // or a loading spinner
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function AppLayout() {
  const location = useLocation();
  const isRSVPPage = location.pathname.startsWith("/rsvp");

  return (
    <Layout className="layout">
      {!isRSVPPage && <></>}
      <Content style={{ padding: "0 0px" }}>
        <div className="site-layout-content">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/" element={<Home />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <GuestManager />
                </ProtectedRoute>
              }
            />
            <Route path="/rsvp/:guestId" element={<RSVPForm />} />
            <Route path="/thank-you" element={<ThankYouPage />} />
          </Routes>
        </div>
      </Content>
    </Layout>
  );
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
