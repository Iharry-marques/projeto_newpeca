// frontend/src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./pages/App.jsx";

// CSS ficam na raiz de src/
import "./index.css";
import "./App.css";
import "./Spinner.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
