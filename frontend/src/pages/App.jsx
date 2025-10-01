// frontend/src/pages/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./Login.jsx";
import HomePage from "./HomePage.jsx";                 // sua página estilizada
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
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<div style={{ padding: 24 }}>404</div>} />
      </Routes>
    </BrowserRouter>
  );
}
