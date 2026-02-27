/**
 * Script to create separate first-grade math courses
 * Each topic is its own course
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'teacher_platform',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function createCourses(userId) {
  console.log('Creating courses for user:', userId);

  // Define all courses - each topic is a separate course
  const courses = [
    {
      title: '加法基础',
      description: '学习加法的基本概念：把两部分合在一起，一共有多少。加数 + 加数 = 和',
      subject: '数学',
      grade: '一年级',
      animation: {
        title: '加法基础',
        description: '把两部分合在一起，一共有多少',
        source_url: '/animations/math/addition-basics.html'
      }
    },
    {
      title: '减法基础',
      description: '学习减法的基本概念：从原来的数量中拿走一部分，还剩多少。被减数 - 减数 = 差',
      subject: '数学',
      grade: '一年级',
      animation: {
        title: '减法基础',
        description: '从原来的数量中拿走一部分，还剩多少',
        source_url: '/animations/math/subtraction-basics.html'
      }
    },
    {
      title: '凑十法',
      description: '20以内进位加法的计算技巧：看到8或9，先凑成10，再加剩下的。例如：8+5=8+2+3=10+3=13',
      subject: '数学',
      grade: '一年级',
      animation: {
        title: '凑十法',
        description: '看到8或9，先凑成10，再加剩下的',
        source_url: '/animations/math/make-ten.html'
      }
    },
    {
      title: '破十法',
      description: '20以内退位减法的计算技巧：把十位的10拆开来减。例如：15-7=10-7+5=3+5=8',
      subject: '数学',
      grade: '一年级',
      animation: {
        title: '破十法',
        description: '退位减法时，把十位的10拆开来减',
        source_url: '/animations/math/break-ten.html'
      }
    },
    {
      title: '比较大小',
      description: '认识大于(>)、小于(<)、等于(=)符号，学会比较两个数的大小',
      subject: '数学',
      grade: '一年级',
      animation: {
        title: '比较大小',
        description: '认识大于、小于、等于符号',
        source_url: '/animations/math/compare-numbers.html'
      }
    },
    {
      title: '加减法关系',
      description: '理解加法和减法的关系：它们是一对好朋友，互为逆运算。一个加法算式可以写出两个减法算式',
      subject: '数学',
      grade: '一年级',
      animation: {
        title: '加减法关系',
        description: '加法和减法是一对好朋友，互为逆运算',
        source_url: '/animations/math/addition-subtraction-relation.html'
      }
    },
    {
      title: '加法交换律',
      description: '理解加法交换律：交换加数的位置，和不变。a + b = b + a',
      subject: '数学',
      grade: '一年级',
      animation: {
        title: '加法交换律',
        description: '交换加数的位置，和不变',
        source_url: '/animations/math/addition-commutative.html'
      }
    }
  ];

  const createdCourses = [];

  for (const courseData of courses) {
    // Create course
    const courseResult = await pool.query(
      `INSERT INTO courses (user_id, title, description, subject, grade, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, courseData.title, courseData.description, courseData.subject, courseData.grade, 'draft']
    );
    const course = courseResult.rows[0];
    console.log(`✓ 课程: ${course.title} (ID: ${course.id})`);

    // Create section
    const sectionResult = await pool.query(
      `INSERT INTO course_sections (course_id, title, sort_order)
       VALUES ($1, $2, $3) RETURNING *`,
      [course.id, '动画演示', 0]
    );
    const section = sectionResult.rows[0];

    // Create animation
    await pool.query(
      `INSERT INTO animations (user_id, section_id, title, description, type, source_url, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, section.id, courseData.animation.title, courseData.animation.description, 'html', courseData.animation.source_url, 0]
    );

    createdCourses.push({
      id: course.id,
      title: course.title,
      url: `http://localhost:5173/dashboard/courses/${course.id}/play`
    });
  }

  console.log('\n✅ 所有课程创建成功！\n');
  console.log('课程列表：');
  createdCourses.forEach((c, i) => {
    console.log(`${i + 1}. ${c.title}`);
    console.log(`   ${c.url}`);
  });

  await pool.end();
}

const userId = parseInt(process.argv[2]) || 1;
createCourses(userId).catch(console.error);
