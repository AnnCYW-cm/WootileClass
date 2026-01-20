import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './store/AuthContext';
import { PublicLayout, DashboardLayout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Classes } from './pages/Classes';
import { ClassDetail } from './pages/ClassDetail';
import { RollCall } from './pages/RollCall';
import { Scores } from './pages/Scores';
import { Assignments } from './pages/Assignments';
import { AssignmentDetail } from './pages/AssignmentDetail';
import { StudentSubmit } from './pages/StudentSubmit';
import { Statistics } from './pages/Statistics';
import { ClassroomTools } from './pages/ClassroomTools';
import { Groups } from './pages/Groups';
import { SeatingChart } from './pages/SeatingChart';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Student submission page (no auth required) */}
          <Route path="/submit/:code" element={<StudentSubmit />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="classes" element={<Classes />} />
            <Route path="classes/:id" element={<ClassDetail />} />
            <Route path="rollcall" element={<RollCall />} />
            <Route path="scores" element={<Scores />} />
            <Route path="assignments" element={<Assignments />} />
            <Route path="assignments/:id" element={<AssignmentDetail />} />
            <Route path="statistics" element={<Statistics />} />
            <Route path="tools" element={<ClassroomTools />} />
            <Route path="groups" element={<Groups />} />
            <Route path="seating" element={<SeatingChart />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
