import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DashboardLayout } from './components/layout/DashboardLayout';

// 9 Core Pages
import { LoginPage } from './pages/LoginPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { RoomAvailabilityPage } from './pages/RoomAvailabilityPage';
import { RoomDetailsPage } from './pages/RoomDetailsPage';
import { MyRequestsPage } from './pages/MyRequestsPage';
import { FacultyRequestsPage } from './pages/FacultyRequestsPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { ManageResourcesPage } from './pages/ManageResourcesPage';
import { ProfilePage } from './pages/ProfilePage';
import { ManageUsersPage } from './pages/ManageUsersPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Screen 1: Login Page */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Dashboard Shell */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* Index Redirect */}
            <Route index element={<Navigate to="/dashboard" replace />} />

            {/* Screen 2: Student Dashboard */}
            <Route path="dashboard" element={<StudentDashboard />} />

            {/* Screen 3: Room Availability */}
            <Route path="rooms" element={<RoomAvailabilityPage />} />

            {/* Screen 4: Room Details & Request */}
            <Route path="rooms/:id" element={<RoomDetailsPage />} />

            {/* Screen 5: Student — My Requests */}
            <Route path="requests" element={<MyRequestsPage />} />

            {/* Screen 6: Faculty — Requests for Approval */}
            <Route path="faculty" element={<Navigate to="/faculty/requests" replace />} />
            <Route path="faculty/requests" element={<FacultyRequestsPage />} />
            <Route path="schedule" element={<RoomAvailabilityPage />} />

            {/* Screen 7: Admin Dashboard */}
            <Route path="admin" element={<AdminDashboard />} />

            {/* Screen 8: Admin — Manage Resources */}
            <Route path="admin/resources" element={<ManageResourcesPage />} />
            <Route path="admin/requests" element={<FacultyRequestsPage />} />
            <Route path="admin/users" element={<ManageUsersPage />} />

            {/* Screen 9: Profile Page */}
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
