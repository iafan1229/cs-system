import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminLayout } from './components/AdminLayout';
import { LoginPage } from './pages/admin/LoginPage';
import { SchedulesPage } from './pages/admin/SchedulesPage';
import { ReservationsPage } from './pages/admin/ReservationsPage';
import { ConsultationRecordPage } from './pages/admin/ConsultationRecordPage';
import { BookingPage } from './pages/booking/BookingPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/booking" element={<BookingPage />} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<LoginPage />} />
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Routes>
                  <Route path="schedules" element={<SchedulesPage />} />
                  <Route
                    path="schedules/:scheduleId/reservations"
                    element={<ReservationsPage />}
                  />
                  <Route
                    path="reservations/:id/record"
                    element={<ConsultationRecordPage />}
                  />
                  <Route path="*" element={<Navigate to="/admin/schedules" replace />} />
                </Routes>
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
