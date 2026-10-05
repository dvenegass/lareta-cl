import { BrowserRouter, Route, Routes } from "react-router";

import { AppShell } from "./components/layout/AppShell";
import { PublicLayout } from "./components/layout/PublicLayout";
import { RequireAuth, RequireGuest } from "./components/layout/RouteGuards";
import { AuthProvider } from "./context/AuthContext";
import { useThemeSync } from "./hooks/useThemeSync";
import { AppearancePage } from "./pages/AppearancePage";
import { DashboardPage } from "./pages/DashboardPage";
import { EventCreatePage } from "./pages/EventCreatePage";
import { EventDetailPage } from "./pages/EventDetailPage";
import { EventEditPage } from "./pages/EventEditPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { FriendsPage } from "./pages/FriendsPage";
import { GroupCreatePage } from "./pages/GroupCreatePage";
import { GroupDetailPage } from "./pages/GroupDetailPage";
import { GroupsPage } from "./pages/GroupsPage";
import { HistoryPage } from "./pages/HistoryPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ProfilePage } from "./pages/ProfilePage";
import { RankingsPage } from "./pages/RankingsPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { UserProfilePage } from "./pages/UserProfilePage";

/** Mantiene los colores del tema del usuario en todas las páginas. */
function ThemeSync() {
  useThemeSync();
  return null;
}

export function App() {
  return (
    <AuthProvider>
      <ThemeSync />
      <BrowserRouter>
        <Routes>
          {/* Páginas públicas */}
          <Route element={<PublicLayout />}>
            <Route element={<RequireGuest />}>
              <Route index element={<LandingPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="forgot-password" element={<ForgotPasswordPage />} />
              <Route path="reset-password/:uid/:token" element={<ResetPasswordPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          {/* La app, con sesión iniciada */}
          <Route element={<RequireAuth />}>
            <Route element={<AppShell />}>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="events/new" element={<EventCreatePage />} />
              <Route path="events/:id" element={<EventDetailPage />} />
              <Route path="events/:id/edit" element={<EventEditPage />} />
              <Route path="groups" element={<GroupsPage />} />
              <Route path="groups/new" element={<GroupCreatePage />} />
              <Route path="groups/:id" element={<GroupDetailPage />} />
              <Route path="friends" element={<FriendsPage />} />
              <Route path="rankings" element={<RankingsPage />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="users/:username" element={<UserProfilePage />} />
              <Route path="settings/appearance" element={<AppearancePage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
