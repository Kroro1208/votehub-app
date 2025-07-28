import { Route, Routes } from "react-router";
import { Suspense, lazy } from "react";
import Navbar from "./components/Navbar.tsx";
import ProtectedRoute from "./config/ProtectedRoute.tsx";
import { AppRoutes, RouteDefinition } from "./config/accessControl.ts";
import "./index.css";
import Loading from "./components/Loading.tsx";

function App() {
  console.log("App component rendering");
  console.log("Routes:", AppRoutes.getAllRoutes());

  const renderRoute = (routeDefinition: RouteDefinition) => {
    console.log("Rendering route:", routeDefinition.path);
    const Component = lazy(routeDefinition.component);

    return (
      <Route
        key={routeDefinition.path}
        path={routeDefinition.path}
        element={
          <ProtectedRoute requiresAuth={routeDefinition.requiresAuth}>
            <Suspense
              fallback={
                <div className="flex items-center justify-center min-h-screen">
                  <Loading />
                </div>
              }
            >
              <Component />
            </Suspense>
          </ProtectedRoute>
        }
      />
    );
  };

  return (
    <div className="min-h-screen bg-black dark:bg-dark-bg text-gray-100 dark:text-dark-text transition-all duration-700 pt-20">
      <Navbar />
      <div className="container mx-auto px-4 py6">
        <Routes>
          <Route path="/test" element={<div>Test Route Works!</div>} />
          {AppRoutes.getAllRoutes().map(renderRoute)}
        </Routes>
      </div>
    </div>
  );
}

export default App;
