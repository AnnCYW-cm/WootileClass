/**
 * 课程标准目录 - 人教版（部编版）2024-2025 最新版
 * 数据来源：人民教育出版社电子课本
 *
 * 结构：curriculum[年级][学科] = [{ unit, lessons }]
 * 后续可持续扩展其他年级和学科
 */

const curriculum = {
  '一年级': {
    '语文': {
      '上册': [
        {
          unit: '入学准备（我上学了）',
          lessons: ['我是中国人', '我爱我们的祖国', '我是小学生', '我爱学语文'],
        },
        {
          unit: '第一单元（识字）',
          lessons: ['天地人', '金木水火土', '口耳目手足', '日月山川'],
          extras: ['语文园地一', '快乐读书吧：读书真快乐', '口语交际：我说你做'],
        },
        {
          unit: '第二单元（汉语拼音）',
          lessons: ['a o e', 'i u ü', 'b p m f', 'd t n l'],
          extras: ['语文园地二'],
        },
        {
          unit: '第三单元（汉语拼音）',
          lessons: ['g k h', 'j q x', 'z c s', 'zh ch sh r', 'y w'],
          extras: ['语文园地三'],
        },
        {
          unit: '第四单元（汉语拼音）',
          lessons: ['ai ei ui', 'ao ou iu', 'ie üe er', 'an en in un ün', 'ang eng ing ong'],
          extras: ['语文园地四'],
        },
        {
          unit: '第五单元（阅读）',
          lessons: ['秋天', '江南', '雪地里的小画家', '四季'],
          extras: ['语文园地五', '口语交际：交朋友'],
        },
        {
          unit: '第六单元（识字）',
          lessons: ['对韵歌', '日月明', '小书包', '升国旗'],
          extras: ['语文园地六'],
        },
        {
          unit: '第七单元（阅读）',
          lessons: ['小小的船', '影子', '两件宝'],
          extras: ['语文园地七', '口语交际：用多大的声音说话'],
        },
        {
          unit: '第八单元（阅读）',
          lessons: ['比尾巴', '乌鸦喝水', '雨点儿'],
          extras: ['语文园地八', '口语交际：我会想办法'],
        },
      ],
      '下册': [
        {
          unit: '第一单元（识字）',
          lessons: ['春夏秋冬', '姓氏歌', '小青蛙', '猜字谜'],
          extras: ['口语交际：请你帮个忙', '语文园地一', '快乐读书吧：读读童谣和儿歌'],
        },
        {
          unit: '第二单元（阅读）',
          lessons: ['热爱中国共产党', '吃水不忘挖井人', '我多想去看看'],
          extras: ['语文园地二'],
        },
        {
          unit: '第三单元（阅读）',
          lessons: ['小公鸡和小鸭子', '树和喜鹊', '怎么都快乐'],
          extras: ['口语交际：打电话', '语文园地三'],
        },
        {
          unit: '第四单元（阅读）',
          lessons: ['静夜思', '夜色', '端午粽'],
          extras: ['语文园地四'],
        },
        {
          unit: '第五单元（识字）',
          lessons: ['动物儿歌', '古对今', '操场上', '人之初'],
          extras: ['口语交际：一起做游戏', '语文园地五'],
        },
        {
          unit: '第六单元（阅读）',
          lessons: ['古诗二首（池上、小池）', '浪花', '荷叶圆圆', '要下雨了'],
          extras: ['语文园地六'],
        },
        {
          unit: '第七单元（阅读）',
          lessons: ['文具的家', '一分钟', '动物王国开大会', '小猴子下山'],
          extras: ['口语交际：听故事，讲故事', '语文园地七'],
        },
        {
          unit: '第八单元（阅读）',
          lessons: ['棉花姑娘', '咕咚', '小壁虎借尾巴'],
          extras: ['语文园地八'],
        },
      ],
    },
  },
};

/**
 * 获取指定年级学科的课程目录
 */
export const getCurriculum = (grade, subject) => {
  return curriculum[grade]?.[subject] || null;
};

/**
 * 获取所有已有课程数据的年级学科组合
 */
export const getAvailableCurriculum = () => {
  const result = [];
  for (const [grade, subjects] of Object.entries(curriculum)) {
    for (const [subject, volumes] of Object.entries(subjects)) {
      const volumeNames = Object.keys(volumes);
      result.push({ grade, subject, volumes: volumeNames });
    }
  }
  return result;
};

export default curriculum;
