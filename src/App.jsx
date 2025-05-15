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
import Nav from "./components/nav/Nav";
import MNav from "./components/nav/Mnav";
import Acc from "./pages/accomadations/Acc";
import Gallery from "./pages/gallery/Gallery";

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
    return <Navigate to="/login" replace />;
  }
  return children;
};

function AppLayout() {
  const location = useLocation();

  // Define the paths where you want to hide Nav, MNav, and footer
  const hideLayoutComponents = ["/rsvp", "/thank-you", "/dashboard", "/login"];

  // Check if current route starts with any of the paths to hide
  const shouldHideLayout = hideLayoutComponents.some((path) =>
    location.pathname.startsWith(path)
  );

  return (
    <Layout className="layout">
      <Content style={{ padding: "0 0px" }}>
        <div className="site-layout-content">
          {!shouldHideLayout && (
            <>
              <div className="gal">
                <Nav />
              </div>
              <div className="nal">
                <MNav />
              </div>
            </>
          )}

          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Home />} />
            <Route path="/accommodation" element={<Acc />} />
            <Route path="/gallery" element={<Gallery />} />
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

          {!shouldHideLayout && (
            <div className="footer">© 2025 Nikhil & Shivani</div>
          )}
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
