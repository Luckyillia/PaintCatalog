import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Home from "./pages/Home";
import Category from "./pages/Category";
import VehicleDetail from "./pages/VehicleDetail";
import CreditsWall from "./pages/CreditsWall";
import ProviderDetail from "./pages/ProviderDetail";

export default function App() {
  return (
    <div className="min-h-screen bg-base text-ink">
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/category/:slug" element={<Category />} />
        <Route path="/vehicle/:slug" element={<VehicleDetail />} />
        <Route path="/credits" element={<CreditsWall />} />
        <Route path="/provider/:id" element={<ProviderDetail />} />
      </Routes>
    </div>
  );
}
