import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { VehiclesProvider } from "./context/VehiclesContext";
import { TagsProvider } from "./context/TagsContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <VehiclesProvider>
        <TagsProvider>
          <App />
        </TagsProvider>
      </VehiclesProvider>
    </BrowserRouter>
  </StrictMode>
);