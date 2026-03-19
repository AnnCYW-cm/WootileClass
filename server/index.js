import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './db/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import classRoutes from './routes/classes.js';
import studentRoutes from './routes/students.js';
import attendanceRoutes from './routes/attendance.js';
import scoreRoutes from './routes/scores.js';
import assignmentRoutes from './routes/assignments.js';
import redemptionRoutes from './routes/redemption.js';
import membershipRoutes from './routes/membership.js';
import dashboardRoutes from './routes/dashboard.js';
import exportRoutes from './routes/export.js';
import seatingRoutes from './routes/seating.js';
import examRoutes from './routes/exams.js';
import reportRoutes from './routes/reports.js';
import courseRoutes from './routes/courses.js';
import animationRoutes from './routes/animations.js';
import videoRoutes from './routes/videos.js';
import aiRoutes from './routes/ai.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/redemption', redemptionRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/seating', seatingRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/animations', animationRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/ai', aiRoutes);

// Serve uploaded files
app.use('/uploads', express.static('uploads'));
app.use('/uploads', express.static('public/uploads'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handling
app.use(errorHandler);

// Initialize database and start server
const startServer = async () => {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
