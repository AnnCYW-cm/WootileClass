import { query } from '../db/index.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';

/**
 * Animation Service - Business logic for animation operations
 */
export class AnimationService {
  /**
   * Create an animation
   */
  static async create(userId, data) {
    const { sectionId, title, description, type, sourceUrl, thumbnail, durationSeconds, config } = data;

    if (!title || !title.trim()) {
      throw new BadRequestError('动画标题不能为空');
    }

    if (!type) {
      throw new BadRequestError('动画类型不能为空');
    }

    // Verify section ownership
    await this.verifySectionOwnership(sectionId, userId);

    // Get max sort_order
    const maxOrderResult = await query(
      'SELECT COALESCE(MAX(sort_order), -1) + 1 as next_order FROM animations WHERE section_id = $1',
      [sectionId]
    );
    const sortOrder = maxOrderResult.rows[0].next_order;

    const result = await query(
      `INSERT INTO animations (user_id, section_id, title, description, type, source_url, thumbnail, duration_seconds, config, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [userId, sectionId, title.trim(), description || '', type, sourceUrl || '', thumbnail || '', durationSeconds || null, config || null, sortOrder]
    );

    return result.rows[0];
  }

  /**
   * Get animation by ID
   */
  static async getById(animationId, userId) {
    const result = await query(
      'SELECT * FROM animations WHERE id = $1 AND user_id = $2',
      [animationId, userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('动画');
    }

    return result.rows[0];
  }

  /**
   * Update an animation
   */
  static async update(animationId, userId, data) {
    await this.verifyOwnership(animationId, userId);

    const { title, description, sourceUrl, thumbnail, durationSeconds, config } = data;

    const result = await query(
      `UPDATE animations
       SET title = $1, description = $2, source_url = $3, thumbnail = $4, duration_seconds = $5, config = $6
       WHERE id = $7 RETURNING *`,
      [title, description, sourceUrl, thumbnail, durationSeconds, config, animationId]
    );

    return result.rows[0];
  }

  /**
   * Delete an animation
   */
  static async delete(animationId, userId) {
    await this.verifyOwnership(animationId, userId);
    await query('DELETE FROM animations WHERE id = $1', [animationId]);
    return { message: '动画已删除' };
  }

  /**
   * Reorder animations in a section
   */
  static async reorder(sectionId, userId, animationIds) {
    await this.verifySectionOwnership(sectionId, userId);

    for (let i = 0; i < animationIds.length; i++) {
      await query(
        'UPDATE animations SET sort_order = $1 WHERE id = $2 AND section_id = $3',
        [i, animationIds[i], sectionId]
      );
    }

    return { message: '排序已更新' };
  }

  /**
   * Verify animation ownership
   */
  static async verifyOwnership(animationId, userId) {
    const result = await query(
      'SELECT * FROM animations WHERE id = $1',
      [animationId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('动画');
    }

    if (result.rows[0].user_id !== userId) {
      throw new NotFoundError('动画');
    }

    return result.rows[0];
  }

  /**
   * Verify section ownership (through course)
   */
  static async verifySectionOwnership(sectionId, userId) {
    const result = await query(
      `SELECT cs.id FROM course_sections cs
       JOIN courses c ON cs.course_id = c.id
       WHERE cs.id = $1 AND c.user_id = $2`,
      [sectionId, userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('章节');
    }

    return result.rows[0];
  }

  // ============ Built-in Animations ============

  /**
   * Get all built-in animations
   */
  static async getBuiltinAnimations(category = null) {
    let queryText = 'SELECT * FROM builtin_animations';
    const params = [];

    if (category) {
      queryText += ' WHERE category = $1';
      params.push(category);
    }

    queryText += ' ORDER BY category, subcategory, name';

    const result = await query(queryText, params);
    return result.rows;
  }

  /**
   * Get built-in animation categories
   */
  static async getBuiltinCategories() {
    const result = await query(
      `SELECT DISTINCT category, COUNT(*) as count
       FROM builtin_animations
       GROUP BY category
       ORDER BY category`
    );
    return result.rows;
  }

  /**
   * Get a single built-in animation
   */
  static async getBuiltinById(id) {
    const result = await query(
      'SELECT * FROM builtin_animations WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('内置动画');
    }

    return result.rows[0];
  }

  /**
   * Seed built-in animations (for initial setup)
   */
  static async seedBuiltinAnimations() {
    const animations = [
      // 一年级数学基础动画
      {
        name: '加法基础',
        category: 'math',
        subcategory: 'arithmetic',
        description: '演示加数+加数=和，把两部分合在一起',
        source_path: '/animations/math/addition-basics.html',
        thumbnail: null,
        tags: ['加法', '基础', '一年级', '小学数学'],
        is_interactive: true,
        type: 'html'
      },
      {
        name: '减法基础',
        category: 'math',
        subcategory: 'arithmetic',
        description: '演示被减数-减数=差，从原来的数量中拿走一部分',
        source_path: '/animations/math/subtraction-basics.html',
        thumbnail: null,
        tags: ['减法', '基础', '一年级', '小学数学'],
        is_interactive: true,
        type: 'html'
      },
      {
        name: '凑十法',
        category: 'math',
        subcategory: 'arithmetic',
        description: '看到8或9，先凑成10，再加剩下的',
        source_path: '/animations/math/make-ten.html',
        thumbnail: null,
        tags: ['凑十法', '加法', '计算技巧', '一年级'],
        is_interactive: true,
        type: 'html'
      },
      {
        name: '破十法',
        category: 'math',
        subcategory: 'arithmetic',
        description: '退位减法时，把十位的10拆开来减',
        source_path: '/animations/math/break-ten.html',
        thumbnail: null,
        tags: ['破十法', '减法', '退位减法', '一年级'],
        is_interactive: true,
        type: 'html'
      },
      {
        name: '比较大小',
        category: 'math',
        subcategory: 'arithmetic',
        description: '认识大于、小于、等于符号',
        source_path: '/animations/math/compare-numbers.html',
        thumbnail: null,
        tags: ['比较', '大于', '小于', '等于', '一年级'],
        is_interactive: true,
        type: 'html'
      },
      {
        name: '加减法关系',
        category: 'math',
        subcategory: 'arithmetic',
        description: '加法和减法是一对好朋友，互为逆运算',
        source_path: '/animations/math/addition-subtraction-relation.html',
        thumbnail: null,
        tags: ['加减法', '逆运算', '关系', '一年级'],
        is_interactive: true,
        type: 'html'
      },
      {
        name: '加法交换律',
        category: 'math',
        subcategory: 'arithmetic',
        description: '演示 a + b = b + a，交换加数位置结果不变',
        source_path: '/animations/math/addition-commutative.html',
        thumbnail: null,
        tags: ['加法', '交换律', '运算定律', '小学数学'],
        is_interactive: true,
        type: 'html'
      },
      // 几何动画
      {
        name: '三角形内角和',
        category: 'math',
        subcategory: 'geometry',
        description: '展示三角形三个内角相加等于180°',
        source_path: '/animations/math/triangle-angles.json',
        thumbnail: null,
        tags: ['三角形', '内角', '几何'],
        is_interactive: false
      },
      {
        name: '勾股定理',
        category: 'math',
        subcategory: 'geometry',
        description: '动态展示 a² + b² = c²',
        source_path: '/animations/math/pythagorean.json',
        thumbnail: null,
        tags: ['勾股定理', '直角三角形', '几何'],
        is_interactive: false
      },
      {
        name: '坐标系基础',
        category: 'math',
        subcategory: 'algebra',
        description: '展示x、y轴和点的位置',
        source_path: '/animations/math/coordinate-system.json',
        thumbnail: null,
        tags: ['坐标系', '代数', '函数'],
        is_interactive: true
      },
      // 物理动画
      {
        name: '单摆运动',
        category: 'physics',
        subcategory: 'mechanics',
        description: '简谐运动演示',
        source_path: '/animations/physics/pendulum.json',
        thumbnail: null,
        tags: ['单摆', '简谐运动', '力学'],
        is_interactive: false
      },
      {
        name: '抛物线运动',
        category: 'physics',
        subcategory: 'mechanics',
        description: '斜抛运动轨迹',
        source_path: '/animations/physics/projectile.json',
        thumbnail: null,
        tags: ['抛物线', '抛体运动', '力学'],
        is_interactive: true
      },
      // 通用动画
      {
        name: '加载动画',
        category: 'general',
        subcategory: 'ui',
        description: '通用等待动画',
        source_path: '/animations/general/loading.json',
        thumbnail: null,
        tags: ['加载', 'UI'],
        is_interactive: false
      }
    ];

    for (const anim of animations) {
      // Check if exists
      const existing = await query(
        'SELECT id FROM builtin_animations WHERE name = $1 AND category = $2',
        [anim.name, anim.category]
      );

      if (existing.rows.length === 0) {
        await query(
          `INSERT INTO builtin_animations (name, category, subcategory, description, source_path, thumbnail, tags, is_interactive, type)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [anim.name, anim.category, anim.subcategory, anim.description, anim.source_path, anim.thumbnail, anim.tags, anim.is_interactive, anim.type || 'lottie']
        );
      } else {
        // Update existing animation's type
        await query(
          `UPDATE builtin_animations SET type = $1, source_path = $2 WHERE id = $3`,
          [anim.type || 'lottie', anim.source_path, existing.rows[0].id]
        );
      }
    }

    return { message: '内置动画已初始化' };
  }
}
