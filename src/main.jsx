import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { VehiclesProvider } from "./context/VehiclesContext";
import { TagsProvider } from "./context/TagsContext";
import { FavoritesProvider } from "./context/FavoritesContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <VehiclesProvider>
        <TagsProvider>
          <FavoritesProvider>
            <App />
          </FavoritesProvider>
        </TagsProvider>
      </VehiclesProvider>
    </BrowserRouter>
  </StrictMode>
);