import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import Header from "./components/Header";
import CompareBar from "./components/CompareBar";
import Home from "./pages/Home";
import Category from "./pages/Category";
import VehicleDetail from "./pages/VehicleDetail";
import CreditsWall from "./pages/CreditsWall";
import ProviderDetail from "./pages/ProviderDetail";
import Favorites from "./pages/Favorites";
import ColorSearch from "./pages/ColorSearch";
import Compare from "./pages/Compare";
import NotFound from "./pages/NotFound";

// Админка грузится отдельным чанком — обычные посетители её не скачивают.
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminHome = lazy(() => import("./pages/admin/AdminHome"));
const VehicleConstructor = lazy(() => import("./pages/admin/VehicleConstructor"));
const VehicleEditor = lazy(() => import("./pages/admin/VehicleEditor"));
const TagsManager = lazy(() => import("./pages/admin/TagsManager"));
const CreditsConstructorAdmin = lazy(() => import("./pages/admin/CreditsConstructor"));
const ReportsQueue = lazy(() => import("./pages/admin/ReportsQueue"));
const AuditLog = lazy(() => import("./pages/admin/AuditLog"));

export default function App() {
  return (
    <>
      <Suspense fallback={<div className="min-h-screen bg-base" />}>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminHome />} />
            <Route path="vehicle-constructor" element={<VehicleConstructor />} />
            <Route path="vehicle-editor" element={<VehicleEditor />} />
            <Route path="tags" element={<TagsManager />} />
            <Route path="credits" element={<CreditsConstructorAdmin />} />
            <Route path="reports" element={<ReportsQueue />} />
            <Route path="audit" element={<AuditLog />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
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
                  <Route path="/color-search" element={<ColorSearch />} />
                  <Route path="/compare" element={<Compare />} />
                  <Route path="/credits" element={<CreditsWall />} />
                  <Route path="/provider/:id" element={<ProviderDetail />} />
                  <Route path="/favorites" element={<Favorites />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <CompareBar />
              </div>
            }
          />
        </Routes>
      </Suspense>
      <Analytics />
    </>
  );
}
