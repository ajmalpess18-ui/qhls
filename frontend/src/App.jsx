import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

// Public pages
import LandingPage   from './pages/public/LandingPage';
import ResultCheck   from './pages/public/ResultCheck';
import Downloads     from './pages/public/Downloads';

// Auth pages
import StudentLogin  from './pages/auth/StudentLogin';
import AdminLogin    from './pages/auth/AdminLogin';

// Dashboards
import AdminDashboard    from './pages/dashboard/AdminDashboard';
import StateDashboard    from './pages/dashboard/StateDashboard';
import DistrictDashboard from './pages/dashboard/DistrictDashboard';
import ZoneDashboard     from './pages/dashboard/ZoneDashboard';
import UnitDashboard     from './pages/dashboard/UnitDashboard';
import FacultyDashboard  from './pages/dashboard/FacultyDashboard';
import StudentDashboard  from './pages/dashboard/StudentDashboard';

// Role guard
function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="auth-page"><p>Loading...</p></div>;
  if (!user)   return <Navigate to="/login/admin" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function DashboardRouter() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" />;
  const map = {
    admin:    '/dashboard/admin',
    state:    '/dashboard/state',
    district: '/dashboard/district',
    zone:     '/dashboard/zone',
    unit:     '/dashboard/unit',
    faculty:  '/dashboard/faculty',
    student:  '/dashboard/student',
  };
  return <Navigate to={map[user.role] || '/'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/"           element={<LandingPage />} />
          <Route path="/results"    element={<ResultCheck />} />
          <Route path="/downloads"  element={<Downloads />} />

          {/* Auth */}
          <Route path="/login/student" element={<StudentLogin />} />
          <Route path="/login/admin"   element={<AdminLogin />} />

          {/* Dashboard redirect */}
          <Route path="/dashboard" element={<PrivateRoute><DashboardRouter /></PrivateRoute>} />

          {/* Role dashboards */}
          <Route path="/dashboard/admin"    element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>} />
          <Route path="/dashboard/state"    element={<PrivateRoute roles={['state']}><StateDashboard /></PrivateRoute>} />
          <Route path="/dashboard/district" element={<PrivateRoute roles={['district']}><DistrictDashboard /></PrivateRoute>} />
          <Route path="/dashboard/zone"     element={<PrivateRoute roles={['zone']}><ZoneDashboard /></PrivateRoute>} />
          <Route path="/dashboard/unit"     element={<PrivateRoute roles={['unit']}><UnitDashboard /></PrivateRoute>} />
          <Route path="/dashboard/faculty"  element={<PrivateRoute roles={['faculty']}><FacultyDashboard /></PrivateRoute>} />
          <Route path="/dashboard/student"  element={<PrivateRoute roles={['student']}><StudentDashboard /></PrivateRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
