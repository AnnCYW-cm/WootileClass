import { query } from '../db/index.js';

// Get current seating chart
export const getSeating = async (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.userId;

    // Verify class ownership
    const classCheck = await query(
      'SELECT id FROM classes WHERE id = $1 AND user_id = $2',
      [classId, userId]
    );
    if (classCheck.rows.length === 0) {
      return res.status(404).json({ error: '班级不存在' });
    }

    // Get current seating chart
    const seatingResult = await query(`
      SELECT * FROM seating_charts
      WHERE class_id = $1 AND is_current = true
    `, [classId]);

    if (seatingResult.rows.length === 0) {
      // Return default layout info if no seating chart exists
      return res.json({
        id: null,
        rows: 6,
        cols: 8,
        aisle_after: 4,
        podium_position: 'top',
        assignments: [],
        students: []
      });
    }

    const seating = seatingResult.rows[0];

    // Get seat assignments
    const assignments = await query(`
      SELECT sa.*, s.name, s.student_no
      FROM seating_assignments sa
      JOIN students s ON sa.student_id = s.id
      WHERE sa.seating_id = $1
    `, [seating.id]);

    // Get all students in class for unassigned list
    const students = await query(`
      SELECT s.id, s.name, s.student_no, s.gender, s.height, s.vision_issue
      FROM students s
      WHERE s.class_id = $1
      ORDER BY s.student_no, s.name
    `, [classId]);

    // Mark assigned students
    const assignedIds = new Set(assignments.rows.map(a => a.student_id));
    const studentList = students.rows.map(s => ({
      ...s,
      assigned: assignedIds.has(s.id)
    }));

    res.json({
      ...seating,
      assignments: assignments.rows,
      students: studentList
    });
  } catch (error) {
    console.error('Get seating error:', error);
    res.status(500).json({ error: '获取座位表失败' });
  }
};

// Create or update seating chart
export const saveSeating = async (req, res) => {
  try {
    const { classId } = req.params;
    const { name, rows, cols, aisle_after, podium_position, assignments } = req.body;
    const userId = req.userId;

    // Verify class ownership
    const classCheck = await query(
      'SELECT id FROM classes WHERE id = $1 AND user_id = $2',
      [classId, userId]
    );
    if (classCheck.rows.length === 0) {
      return res.status(404).json({ error: '班级不存在' });
    }

    // Unset current seating
    await query(
      'UPDATE seating_charts SET is_current = false WHERE class_id = $1',
      [classId]
    );

    // Create new seating chart
    const seatingName = name || `座位表 ${new Date().toLocaleDateString('zh-CN')}`;
    const seatingResult = await query(`
      INSERT INTO seating_charts (class_id, name, rows, cols, aisle_after, podium_position, is_current)
      VALUES ($1, $2, $3, $4, $5, $6, true)
      RETURNING *
    `, [classId, seatingName, rows || 6, cols || 8, aisle_after || 4, podium_position || 'top']);

    const seatingId = seatingResult.rows[0].id;

    // Save assignments if provided
    if (assignments && Array.isArray(assignments)) {
      for (const a of assignments) {
        if (a.student_id && a.row_num && a.col_num) {
          await query(`
            INSERT INTO seating_assignments (seating_id, student_id, row_num, col_num, is_locked, lock_reason)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (seating_id, row_num, col_num)
            DO UPDATE SET student_id = $2, is_locked = $5, lock_reason = $6
          `, [seatingId, a.student_id, a.row_num, a.col_num, a.is_locked || false, a.lock_reason || null]);
        }
      }
    }

    res.status(201).json(seatingResult.rows[0]);
  } catch (error) {
    console.error('Save seating error:', error);
    res.status(500).json({ error: '保存座位表失败' });
  }
};

// Random seating
export const randomSeating = async (req, res) => {
  try {
    const { classId } = req.params;
    const { mode = 'full', keep_locked = true } = req.body;
    const userId = req.userId;

    // Verify class ownership
    const classCheck = await query(
      'SELECT id FROM classes WHERE id = $1 AND user_id = $2',
      [classId, userId]
    );
    if (classCheck.rows.length === 0) {
      return res.status(404).json({ error: '班级不存在' });
    }

    // Get current seating or create default
    let seatingResult = await query(
      'SELECT * FROM seating_charts WHERE class_id = $1 AND is_current = true',
      [classId]
    );

    let seating;
    if (seatingResult.rows.length === 0) {
      // Create default seating
      const newSeating = await query(`
        INSERT INTO seating_charts (class_id, name, rows, cols, aisle_after, is_current)
        VALUES ($1, '随机座位表', 6, 8, 4, true)
        RETURNING *
      `, [classId]);
      seating = newSeating.rows[0];
    } else {
      seating = seatingResult.rows[0];
    }

    // Get students
    const students = await query(`
      SELECT id, name, gender FROM students WHERE class_id = $1
    `, [classId]);

    // Get locked seats if keeping them
    let lockedSeats = [];
    if (keep_locked) {
      const locked = await query(`
        SELECT sa.*, s.id as student_id
        FROM seating_assignments sa
        JOIN students s ON sa.student_id = s.id
        WHERE sa.seating_id = $1 AND sa.is_locked = true
      `, [seating.id]);
      lockedSeats = locked.rows;
    }

    // Clear current assignments (except locked if keeping)
    if (keep_locked && lockedSeats.length > 0) {
      await query(
        'DELETE FROM seating_assignments WHERE seating_id = $1 AND is_locked = false',
        [seating.id]
      );
    } else {
      await query('DELETE FROM seating_assignments WHERE seating_id = $1', [seating.id]);
    }

    // Get available seats
    const totalSeats = seating.rows * seating.cols;
    const lockedPositions = new Set(lockedSeats.map(s => `${s.row_num}-${s.col_num}`));
    const lockedStudentIds = new Set(lockedSeats.map(s => s.student_id));

    let availableSeats = [];
    for (let r = 1; r <= seating.rows; r++) {
      for (let c = 1; c <= seating.cols; c++) {
        if (!lockedPositions.has(`${r}-${c}`)) {
          availableSeats.push({ row: r, col: c });
        }
      }
    }

    // Filter out locked students
    let studentsToAssign = students.rows.filter(s => !lockedStudentIds.has(s.id));

    // Handle different modes
    if (mode === 'gender_separate') {
      // Sort by gender, then shuffle within gender groups
      const males = studentsToAssign.filter(s => s.gender === '男');
      const females = studentsToAssign.filter(s => s.gender === '女');
      shuffleArray(males);
      shuffleArray(females);
      studentsToAssign = [...males, ...females];
    } else if (mode === 'gender_pair') {
      // Pair male and female students
      const males = studentsToAssign.filter(s => s.gender === '男');
      const females = studentsToAssign.filter(s => s.gender === '女');
      shuffleArray(males);
      shuffleArray(females);
      studentsToAssign = [];
      const maxPairs = Math.max(males.length, females.length);
      for (let i = 0; i < maxPairs; i++) {
        if (males[i]) studentsToAssign.push(males[i]);
        if (females[i]) studentsToAssign.push(females[i]);
      }
    } else {
      // Full random
      shuffleArray(studentsToAssign);
    }

    // Shuffle seats
    shuffleArray(availableSeats);

    // Assign students to seats
    const assignments = [];
    for (let i = 0; i < Math.min(studentsToAssign.length, availableSeats.length); i++) {
      const student = studentsToAssign[i];
      const seat = availableSeats[i];

      await query(`
        INSERT INTO seating_assignments (seating_id, student_id, row_num, col_num)
        VALUES ($1, $2, $3, $4)
      `, [seating.id, student.id, seat.row, seat.col]);

      assignments.push({
        student_id: student.id,
        name: student.name,
        row_num: seat.row,
        col_num: seat.col,
        is_locked: false
      });
    }

    // Add back locked seats to response
    const allAssignments = [...lockedSeats, ...assignments];

    res.json({
      seating_id: seating.id,
      assignments: allAssignments
    });
  } catch (error) {
    console.error('Random seating error:', error);
    res.status(500).json({ error: '随机排座失败' });
  }
};

// Auto seating by rules
export const autoSeating = async (req, res) => {
  try {
    const { classId } = req.params;
    const { rule = 'height' } = req.body; // height, vision, s_shape
    const userId = req.userId;

    // Verify class ownership
    const classCheck = await query(
      'SELECT id FROM classes WHERE id = $1 AND user_id = $2',
      [classId, userId]
    );
    if (classCheck.rows.length === 0) {
      return res.status(404).json({ error: '班级不存在' });
    }

    // Get or create seating chart
    let seatingResult = await query(
      'SELECT * FROM seating_charts WHERE class_id = $1 AND is_current = true',
      [classId]
    );

    let seating;
    if (seatingResult.rows.length === 0) {
      const newSeating = await query(`
        INSERT INTO seating_charts (class_id, name, rows, cols, aisle_after, is_current)
        VALUES ($1, '规则排座', 6, 8, 4, true)
        RETURNING *
      `, [classId]);
      seating = newSeating.rows[0];
    } else {
      seating = seatingResult.rows[0];
    }

    // Get students with attributes
    const students = await query(`
      SELECT id, name, student_no, height, vision_issue
      FROM students WHERE class_id = $1
      ORDER BY student_no
    `, [classId]);

    // Clear current assignments
    await query('DELETE FROM seating_assignments WHERE seating_id = $1', [seating.id]);

    let sortedStudents = [...students.rows];

    // Sort by rule
    if (rule === 'height') {
      // Shorter students in front
      sortedStudents.sort((a, b) => (a.height || 999) - (b.height || 999));
    } else if (rule === 'vision') {
      // Vision issues first (front and center)
      sortedStudents.sort((a, b) => {
        if (a.vision_issue && !b.vision_issue) return -1;
        if (!a.vision_issue && b.vision_issue) return 1;
        return 0;
      });
    }

    // Assign seats
    const assignments = [];
    let studentIndex = 0;

    if (rule === 's_shape') {
      // S-shape assignment (snake pattern)
      for (let r = 1; r <= seating.rows && studentIndex < sortedStudents.length; r++) {
        const cols = r % 2 === 1
          ? Array.from({ length: seating.cols }, (_, i) => i + 1)
          : Array.from({ length: seating.cols }, (_, i) => seating.cols - i);

        for (const c of cols) {
          if (studentIndex >= sortedStudents.length) break;
          const student = sortedStudents[studentIndex];

          await query(`
            INSERT INTO seating_assignments (seating_id, student_id, row_num, col_num)
            VALUES ($1, $2, $3, $4)
          `, [seating.id, student.id, r, c]);

          assignments.push({
            student_id: student.id,
            name: student.name,
            row_num: r,
            col_num: c
          });

          studentIndex++;
        }
      }
    } else {
      // Regular row-by-row assignment
      for (let r = 1; r <= seating.rows && studentIndex < sortedStudents.length; r++) {
        for (let c = 1; c <= seating.cols && studentIndex < sortedStudents.length; c++) {
          const student = sortedStudents[studentIndex];

          await query(`
            INSERT INTO seating_assignments (seating_id, student_id, row_num, col_num)
            VALUES ($1, $2, $3, $4)
          `, [seating.id, student.id, r, c]);

          assignments.push({
            student_id: student.id,
            name: student.name,
            row_num: r,
            col_num: c
          });

          studentIndex++;
        }
      }
    }

    res.json({
      seating_id: seating.id,
      rule,
      assignments
    });
  } catch (error) {
    console.error('Auto seating error:', error);
    res.status(500).json({ error: '自动排座失败' });
  }
};

// Get seating history
export const getSeatingHistory = async (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.userId;

    const classCheck = await query(
      'SELECT id FROM classes WHERE id = $1 AND user_id = $2',
      [classId, userId]
    );
    if (classCheck.rows.length === 0) {
      return res.status(404).json({ error: '班级不存在' });
    }

    const result = await query(`
      SELECT id, name, rows, cols, is_current, created_at
      FROM seating_charts
      WHERE class_id = $1
      ORDER BY created_at DESC
    `, [classId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get seating history error:', error);
    res.status(500).json({ error: '获取座位表历史失败' });
  }
};

// Lock/unlock seat
export const toggleSeatLock = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { is_locked, lock_reason } = req.body;
    const userId = req.userId;

    // Verify ownership
    const check = await query(`
      SELECT sa.id FROM seating_assignments sa
      JOIN seating_charts sc ON sa.seating_id = sc.id
      JOIN classes c ON sc.class_id = c.id
      WHERE sa.id = $1 AND c.user_id = $2
    `, [assignmentId, userId]);

    if (check.rows.length === 0) {
      return res.status(404).json({ error: '座位不存在' });
    }

    const result = await query(`
      UPDATE seating_assignments
      SET is_locked = $1, lock_reason = $2
      WHERE id = $3
      RETURNING *
    `, [is_locked, lock_reason || null, assignmentId]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Toggle seat lock error:', error);
    res.status(500).json({ error: '更新座位锁定状态失败' });
  }
};

// Helper: shuffle array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
