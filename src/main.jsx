import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { VehiclesProvider } from "./context/VehiclesContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <VehiclesProvider>
        <App />
      </VehiclesProvider>
    </BrowserRouter>
  </StrictMode>
);
