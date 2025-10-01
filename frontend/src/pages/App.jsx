// frontend/src/pages/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./Login.jsx";
import HomePage from "./HomePage.jsx";

// Estes 4 estão na raiz de src/
import ClientDashboard from "./ClientDashboard.jsx";
import ClientLoginPage from "./ClientLoginPage.jsx";
import ClientApprovalPage from "./ClientApprovalPage.jsx";
import ClientManagementPage from "./ClientManagementPage.jsx";

import ProtectedRoute from "../guards/ProtectedRoute.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/suno"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients"
          element={
            <ProtectedRoute>
              <ClientManagementPage />
            </ProtectedRoute>
          }
        />

        <Route path="/client/login" element={<ClientLoginPage />} />
        <Route path="/client" element={<ClientDashboard />} />
        <Route path="/client/approval/:campaignId" element={<ClientApprovalPage />} />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<div style={{ padding: 24 }}>404</div>} />
      </Routes>
    </BrowserRouter>
  );
}
