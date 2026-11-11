import React from "react";
import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "./components/ErrorBoundary";
import App from "./App";
import "./assets/style.css";

createRoot(document.getElementById("root")).render(
  <ErrorBoundary scope="workspace">
    <App />
  </ErrorBoundary>,
);
