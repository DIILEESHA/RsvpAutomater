// src/App.js
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { Layout } from "antd";
import AdminDashboard from "./components/AdminDashboard";
import GuestManager from "./components/GuestManager";
import RSVPForm from "./components/RSVPForm";
import Login from "./components/Login";
import "./App.css";

const { Header, Content } = Layout;

function AppLayout() {
  const location = useLocation();

  // Check if the current route matches /rsvp/:guestId
  const isRSVPPage = location.pathname.startsWith("/rsvp");

  return (
    <Layout className="layout">
      {!isRSVPPage && (
        <Header>
        <h3 className="logo">Wedding RSVP</h3>
        </Header>
      )}
      <Content style={{ padding: "0 0px" }}>
        <div className="site-layout-content">
          <Routes>
            <Route path="/" element={<Login />} />
            {/* <Route path="/dashboard" element={<AdminDashboard />} /> */}
            <Route path="/dashboard" element={<GuestManager />} />
            <Route path="/rsvp/:guestId" element={<RSVPForm />} />
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
