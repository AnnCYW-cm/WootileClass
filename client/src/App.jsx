import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './store/AuthContext';
import { ToastProvider } from './store/ToastContext';
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
import Redemption from './pages/Redemption';
import Membership from './pages/Membership';
import { DataDashboard } from './pages/DataDashboard';
import { StudentDashboard } from './pages/StudentDashboard';
import { DataExport } from './pages/DataExport';
import { ExamManagement } from './pages/ExamManagement';
import { ParentReports } from './pages/ParentReports';
import { Courses } from './pages/Courses';
import { CoursePlayer } from './pages/CoursePlayer';
import { CourseViewer } from './pages/CourseViewer';
import { Videos } from './pages/Videos';
import { AILessonPrep } from './pages/AILessonPrep';
import { VideoPlayer } from './pages/VideoPlayer';
import { VideoViewer } from './pages/VideoViewer';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
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

          {/* Course viewer (no auth required, accessed via share code) */}
          <Route path="/learn/:code" element={<CourseViewer />} />

          {/* Video viewer (no auth required, accessed via share code) */}
          <Route path="/video/:code" element={<VideoViewer />} />

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
            <Route path="redemption/:classId" element={<Redemption />} />
            <Route path="membership" element={<Membership />} />
            <Route path="data" element={<DataDashboard />} />
            <Route path="student/:studentId" element={<StudentDashboard />} />
            <Route path="export" element={<DataExport />} />
            <Route path="exams" element={<ExamManagement />} />
            <Route path="reports" element={<ParentReports />} />
            <Route path="courses" element={<Courses />} />
            <Route path="courses/:id/play" element={<CoursePlayer />} />
            <Route path="videos" element={<Videos />} />
            <Route path="videos/:id/play" element={<VideoPlayer />} />
            <Route path="ai-prep" element={<AILessonPrep />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
