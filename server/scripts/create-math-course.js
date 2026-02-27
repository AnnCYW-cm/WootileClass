/**
 * Script to create a first-grade math course with animations
 * Run with: node scripts/create-math-course.js <user_id>
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

async function createCourse(userId) {
  console.log('Creating course for user:', userId);

  // Create the course
  const courseResult = await pool.query(
    `INSERT INTO courses (user_id, title, description, subject, grade, status)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [
      userId,
      '一年级数学公式与规律',
      '包含加减法基础、凑十法、破十法、比较大小、加减法关系等核心知识点的动画演示',
      '数学',
      '一年级',
      'draft'
    ]
  );
  const course = courseResult.rows[0];
  console.log('Created course:', course.id, course.title);

  // Create sections
  const sections = [
    { title: '加减法基础', order: 0 },
    { title: '计算技巧', order: 1 },
    { title: '数学规律', order: 2 }
  ];

  const sectionIds = [];
  for (const section of sections) {
    const result = await pool.query(
      `INSERT INTO course_sections (course_id, title, sort_order)
       VALUES ($1, $2, $3) RETURNING *`,
      [course.id, section.title, section.order]
    );
    sectionIds.push(result.rows[0].id);
    console.log('Created section:', result.rows[0].id, section.title);
  }

  // Define animations for each section
  const animationsData = [
    // Section 1: 加减法基础
    {
      sectionId: sectionIds[0],
      animations: [
        {
          title: '加法基础',
          description: '把两部分合在一起，一共有多少',
          type: 'html',
          source_url: '/animations/math/addition-basics.html'
        },
        {
          title: '减法基础',
          description: '从原来的数量中拿走一部分，还剩多少',
          type: 'html',
          source_url: '/animations/math/subtraction-basics.html'
        },
        {
          title: '加减法关系',
          description: '加法和减法是一对好朋友，互为逆运算',
          type: 'html',
          source_url: '/animations/math/addition-subtraction-relation.html'
        }
      ]
    },
    // Section 2: 计算技巧
    {
      sectionId: sectionIds[1],
      animations: [
        {
          title: '凑十法',
          description: '看到8或9，先凑成10，再加剩下的',
          type: 'html',
          source_url: '/animations/math/make-ten.html'
        },
        {
          title: '破十法',
          description: '退位减法时，把十位的10拆开来减',
          type: 'html',
          source_url: '/animations/math/break-ten.html'
        }
      ]
    },
    // Section 3: 数学规律
    {
      sectionId: sectionIds[2],
      animations: [
        {
          title: '比较大小',
          description: '认识大于、小于、等于符号',
          type: 'html',
          source_url: '/animations/math/compare-numbers.html'
        },
        {
          title: '加法交换律',
          description: '交换加数的位置，和不变',
          type: 'html',
          source_url: '/animations/math/addition-commutative.html'
        }
      ]
    }
  ];

  // Create animations
  for (const sectionData of animationsData) {
    let sortOrder = 0;
    for (const anim of sectionData.animations) {
      const result = await pool.query(
        `INSERT INTO animations (user_id, section_id, title, description, type, source_url, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [userId, sectionData.sectionId, anim.title, anim.description, anim.type, anim.source_url, sortOrder++]
      );
      console.log('Created animation:', result.rows[0].id, anim.title);
    }
  }

  console.log('\n✅ Course created successfully!');
  console.log(`Course ID: ${course.id}`);
  console.log(`Visit: http://localhost:5173/dashboard/courses/${course.id}/play`);

  await pool.end();
}

// Get user_id from command line or use default
const userId = parseInt(process.argv[2]) || 1;
createCourse(userId).catch(console.error);
