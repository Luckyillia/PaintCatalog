import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Home from "./pages/Home";
import Category from "./pages/Category";
import VehicleDetail from "./pages/VehicleDetail";
import CreditsWall from "./pages/CreditsWall";
import ProviderDetail from "./pages/ProviderDetail";
import Favorites from "./pages/Favorites";

import AdminLayout from "./pages/admin/AdminLayout";
import AdminHome from "./pages/admin/AdminHome";
import VehicleConstructor from "./pages/admin/VehicleConstructor";
import VehicleEditor from "./pages/admin/VehicleEditor";
import TagsManager from "./pages/admin/TagsManager";
import CreditsConstructorAdmin from "./pages/admin/CreditsConstructor";

export default function App() {
  return (
    <Routes>
      {/* Единая панель администратора — один пароль на все разделы:
          добавление/редактирование машин, теги, стена почёта. */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminHome />} />
        <Route path="vehicle-constructor" element={<VehicleConstructor />} />
        <Route path="vehicle-editor" element={<VehicleEditor />} />
        <Route path="tags" element={<TagsManager />} />
        <Route path="credits" element={<CreditsConstructorAdmin />} />
      </Route>

      <Route
        path="*"
        element={
          <div className="min-h-screen bg-base text-ink">
            <Header />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/category/:slug" element={<Category />} />
              <Route path="/vehicle/:slug" element={<VehicleDetail />} />
              <Route path="/credits" element={<CreditsWall />} />
              <Route path="/provider/:id" element={<ProviderDetail />} />
              <Route path="/favorites" element={<Favorites />} />
            </Routes>
          </div>
        }
      />
    </Routes>
  );
}
