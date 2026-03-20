/**
 * 课程标准目录 - 人教版（部编版）2024-2025
 * 覆盖小学 1-6 年级：语文、数学、英语
 * 英语 1-2 年级为一年级起点版，3-6 年级为三年级起点版（PEP）
 */

const curriculum = {
  // ==================== 一年级 ====================
  '一年级': {
    '语文': {
      '上册': [
        { unit: '入学准备（我上学了）', lessons: ['我是中国人', '我爱我们的祖国', '我是小学生', '我爱学语文'] },
        { unit: '第一单元（识字）', lessons: ['天地人', '金木水火土', '口耳目手足', '日月山川'], extras: ['语文园地一', '口语交际：我说你做'] },
        { unit: '第二单元（汉语拼音）', lessons: ['a o e', 'i u ü', 'b p m f', 'd t n l'], extras: ['语文园地二'] },
        { unit: '第三单元（汉语拼音）', lessons: ['g k h', 'j q x', 'z c s', 'zh ch sh r', 'y w'], extras: ['语文园地三'] },
        { unit: '第四单元（汉语拼音）', lessons: ['ai ei ui', 'ao ou iu', 'ie üe er', 'an en in un ün', 'ang eng ing ong'], extras: ['语文园地四'] },
        { unit: '第五单元（阅读）', lessons: ['秋天', '江南', '雪地里的小画家', '四季'], extras: ['语文园地五', '口语交际：交朋友'] },
        { unit: '第六单元（识字）', lessons: ['对韵歌', '日月明', '小书包', '升国旗'], extras: ['语文园地六'] },
        { unit: '第七单元（阅读）', lessons: ['小小的船', '影子', '两件宝'], extras: ['语文园地七', '口语交际：用多大的声音说话'] },
        { unit: '第八单元（阅读）', lessons: ['比尾巴', '乌鸦喝水', '雨点儿'], extras: ['语文园地八', '口语交际：我会想办法'] },
      ],
      '下册': [
        { unit: '第一单元（识字）', lessons: ['春夏秋冬', '姓氏歌', '小青蛙', '猜字谜'], extras: ['口语交际：请你帮个忙', '语文园地一'] },
        { unit: '第二单元（阅读）', lessons: ['热爱中国共产党', '吃水不忘挖井人', '我多想去看看'], extras: ['语文园地二'] },
        { unit: '第三单元（阅读）', lessons: ['小公鸡和小鸭子', '树和喜鹊', '怎么都快乐'], extras: ['口语交际：打电话', '语文园地三'] },
        { unit: '第四单元（阅读）', lessons: ['静夜思', '夜色', '端午粽'], extras: ['语文园地四'] },
        { unit: '第五单元（识字）', lessons: ['动物儿歌', '古对今', '操场上', '人之初'], extras: ['口语交际：一起做游戏', '语文园地五'] },
        { unit: '第六单元（阅读）', lessons: ['古诗二首（池上、小池）', '浪花', '荷叶圆圆', '要下雨了'], extras: ['语文园地六'] },
        { unit: '第七单元（阅读）', lessons: ['文具的家', '一分钟', '动物王国开大会', '小猴子下山'], extras: ['口语交际：听故事，讲故事', '语文园地七'] },
        { unit: '第八单元（阅读）', lessons: ['棉花姑娘', '咕咚', '小壁虎借尾巴'], extras: ['语文园地八'] },
      ],
    },
    '数学': {
      '上册': [
        { unit: '第一单元 准备课', lessons: ['数一数', '比多少'] },
        { unit: '第二单元 位置', lessons: ['上下前后', '左右'] },
        { unit: '第三单元 1~5的认识和加减法', lessons: ['1~5的认识', '比大小', '第几', '分与合', '加法', '减法', '0的认识和加减法'] },
        { unit: '第四单元 认识图形（一）', lessons: ['认识立体图形'] },
        { unit: '第五单元 6~10的认识和加减法', lessons: ['6和7的认识', '6和7的加减法', '8和9的认识', '8和9的加减法', '10的认识', '10的加减法', '连加连减', '加减混合'] },
        { unit: '第六单元 11~20各数的认识', lessons: ['数数、读数', '写数', '10加几及相应的减法'] },
        { unit: '第七单元 认识钟表', lessons: ['认识整时'] },
        { unit: '第八单元 20以内的进位加法', lessons: ['9加几', '8、7、6加几', '5、4、3、2加几'] },
        { unit: '第九单元 总复习', lessons: ['总复习'] },
      ],
      '下册': [
        { unit: '第一单元 认识图形（二）', lessons: ['认识平面图形', '拼一拼'] },
        { unit: '第二单元 20以内的退位减法', lessons: ['十几减9', '十几减8、7、6', '十几减5、4、3、2'] },
        { unit: '第三单元 分类与整理', lessons: ['分类与整理'] },
        { unit: '第四单元 100以内数的认识', lessons: ['数数 数的组成', '数的顺序 比较大小', '整十数加一位数及相应的减法'] },
        { unit: '第五单元 认识人民币', lessons: ['认识人民币', '简单的计算'] },
        { unit: '第六单元 100以内的加法和减法（一）', lessons: ['整十数加减整十数', '两位数加一位数和整十数', '两位数减一位数和整十数'] },
        { unit: '第七单元 找规律', lessons: ['找规律'] },
        { unit: '第八单元 总复习', lessons: ['总复习'] },
      ],
    },
    '英语': {
      '上册': [
        { unit: 'Starter', lessons: ['Starter'] },
        { unit: 'Unit 1 School', lessons: ['School'] },
        { unit: 'Unit 2 Face', lessons: ['Face'] },
        { unit: 'Unit 3 Animals', lessons: ['Animals'] },
        { unit: 'Revision 1', lessons: ['Revision 1'] },
        { unit: 'Unit 4 Numbers', lessons: ['Numbers'] },
        { unit: 'Unit 5 Colours', lessons: ['Colours'] },
        { unit: 'Unit 6 Fruit', lessons: ['Fruit'] },
        { unit: 'Revision 2', lessons: ['Revision 2'] },
      ],
      '下册': [
        { unit: 'Unit 1 Classroom', lessons: ['Classroom'] },
        { unit: 'Unit 2 Room', lessons: ['Room'] },
        { unit: 'Unit 3 Toys', lessons: ['Toys'] },
        { unit: 'Revision 1', lessons: ['Revision 1'] },
        { unit: 'Unit 4 Food', lessons: ['Food'] },
        { unit: 'Unit 5 Drink', lessons: ['Drink'] },
        { unit: 'Unit 6 Clothes', lessons: ['Clothes'] },
        { unit: 'Revision 2', lessons: ['Revision 2'] },
      ],
    },
  },

  // ==================== 二年级 ====================
  '二年级': {
    '语文': {
      '上册': [
        { unit: '第一单元（课文）', lessons: ['小蝌蚪找妈妈', '我是什么', '植物妈妈有办法'], extras: ['语文园地一', '口语交际：有趣的动物'] },
        { unit: '第二单元（识字）', lessons: ['场景歌', '树之歌', '拍手歌', '田家四季歌'], extras: ['语文园地二'] },
        { unit: '第三单元（课文）', lessons: ['曹冲称象', '玲玲的画', '一封信', '妈妈睡了'], extras: ['语文园地三', '口语交际：做手工'] },
        { unit: '第四单元（课文）', lessons: ['古诗二首（登鹳雀楼、望庐山瀑布）', '黄山奇石', '日月潭', '葡萄沟'], extras: ['语文园地四'] },
        { unit: '第五单元（课文）', lessons: ['坐井观天', '寒号鸟', '我要的是葫芦'], extras: ['语文园地五', '口语交际：商量'] },
        { unit: '第六单元（课文）', lessons: ['八角楼上', '朱德的扁担', '难忘的泼水节', '刘胡兰'], extras: ['语文园地六'] },
        { unit: '第七单元（课文）', lessons: ['古诗二首（夜宿山寺、敕勒歌）', '雾在哪里', '雪孩子'], extras: ['语文园地七', '口语交际：看图讲故事'] },
        { unit: '第八单元（课文）', lessons: ['狐假虎威', '纸船和风筝', '风娃娃'], extras: ['语文园地八'] },
      ],
      '下册': [
        { unit: '第一单元（课文）', lessons: ['古诗二首（村居、咏柳）', '找春天', '开满鲜花的小路', '邓小平爷爷植树'], extras: ['语文园地一', '口语交际：注意说话的语气'] },
        { unit: '第二单元（课文）', lessons: ['雷锋叔叔，你在哪里', '千人糕', '一匹出色的马'], extras: ['语文园地二'] },
        { unit: '第三单元（识字）', lessons: ['神州谣', '传统节日', '"贝"的故事', '中国美食'], extras: ['语文园地三', '口语交际：长大以后做什么'] },
        { unit: '第四单元（课文）', lessons: ['彩色的梦', '枫树上的喜鹊', '沙滩上的童话', '我是一只小虫子'], extras: ['语文园地四'] },
        { unit: '第五单元（课文）', lessons: ['寓言二则（亡羊补牢、揠苗助长）', '画杨桃', '小马过河'], extras: ['语文园地五', '口语交际：图书借阅公约'] },
        { unit: '第六单元（课文）', lessons: ['古诗二首（晓出净慈寺送林子方、绝句）', '雷雨', '要是你在野外迷了路', '太空生活趣事多'], extras: ['语文园地六'] },
        { unit: '第七单元（课文）', lessons: ['大象的耳朵', '蜘蛛开店', '青蛙卖泥塘', '小毛虫'], extras: ['语文园地七', '口语交际：推荐一部动画片'] },
        { unit: '第八单元（课文）', lessons: ['祖先的摇篮', '当世界年纪还小的时候', '羿射九日'], extras: ['语文园地八'] },
      ],
    },
    '数学': {
      '上册': [
        { unit: '第一单元 长度单位', lessons: ['认识厘米 用厘米量', '认识米 用米量', '认识线段'] },
        { unit: '第二单元 100以内的加法和减法（二）', lessons: ['两位数加两位数（不进位加）', '两位数加两位数（进位加）', '两位数减两位数（不退位减）', '两位数减两位数（退位减）', '连加连减和加减混合'] },
        { unit: '第三单元 角的初步认识', lessons: ['认识角', '画角', '认识直角、锐角和钝角'] },
        { unit: '第四单元 表内乘法（一）', lessons: ['乘法的初步认识', '5的乘法口诀', '2、3、4的乘法口诀', '乘加乘减', '6的乘法口诀'] },
        { unit: '第五单元 观察物体（一）', lessons: ['观察物体'] },
        { unit: '第六单元 表内乘法（二）', lessons: ['7的乘法口诀', '8的乘法口诀', '9的乘法口诀'] },
        { unit: '第七单元 认识时间', lessons: ['认识时间'] },
        { unit: '第八单元 数学广角——搭配（一）', lessons: ['简单的排列', '简单的组合'] },
        { unit: '第九单元 总复习', lessons: ['总复习'] },
      ],
      '下册': [
        { unit: '第一单元 数据收集整理', lessons: ['数据收集整理'] },
        { unit: '第二单元 表内除法（一）', lessons: ['除法的初步认识（平均分）', '用2~6的乘法口诀求商'] },
        { unit: '第三单元 图形的运动（一）', lessons: ['认识对称', '认识平移', '认识旋转'] },
        { unit: '第四单元 表内除法（二）', lessons: ['用7、8、9的乘法口诀求商', '解决问题'] },
        { unit: '第五单元 混合运算', lessons: ['同级混合运算', '含有两级的混合运算', '含有小括号的混合运算'] },
        { unit: '第六单元 有余数的除法', lessons: ['有余数的除法', '解决问题'] },
        { unit: '第七单元 万以内数的认识', lessons: ['1000以内数的认识', '10000以内数的认识', '数的大小比较', '近似数', '整百整千数加减法'] },
        { unit: '第八单元 克和千克', lessons: ['认识克', '认识千克'] },
        { unit: '第九单元 数学广角——推理', lessons: ['简单的推理'] },
        { unit: '第十单元 总复习', lessons: ['总复习'] },
      ],
    },
    '英语': {
      '上册': [
        { unit: 'Unit 1 My Family', lessons: ['My Family'] },
        { unit: 'Unit 2 Boys and Girls', lessons: ['Boys and Girls'] },
        { unit: 'Unit 3 My Friends', lessons: ['My Friends'] },
        { unit: 'Revision 1', lessons: ['Revision 1'] },
        { unit: 'Unit 4 In the Community', lessons: ['In the Community'] },
        { unit: 'Unit 5 In the Park', lessons: ['In the Park'] },
        { unit: 'Unit 6 Happy Holidays', lessons: ['Happy Holidays'] },
        { unit: 'Revision 2', lessons: ['Revision 2'] },
      ],
      '下册': [
        { unit: 'Unit 1 Playtime', lessons: ['Playtime'] },
        { unit: 'Unit 2 Weather', lessons: ['Weather'] },
        { unit: 'Unit 3 Seasons', lessons: ['Seasons'] },
        { unit: 'Revision 1', lessons: ['Revision 1'] },
        { unit: 'Unit 4 Time', lessons: ['Time'] },
        { unit: 'Unit 5 My Day', lessons: ['My Day'] },
        { unit: 'Unit 6 My Week', lessons: ['My Week'] },
        { unit: 'Revision 2', lessons: ['Revision 2'] },
      ],
    },
  },

  // ==================== 三年级 ====================
  '三年级': {
    '语文': {
      '上册': [
        { unit: '第一单元', lessons: ['大青树下的小学', '花的学校', '不懂就要问'], extras: ['语文园地一', '口语交际：我的暑假生活'] },
        { unit: '第二单元', lessons: ['古诗三首（山行、赠刘景文、夜书所见）', '铺满金色巴掌的水泥道', '秋天的雨', '听听，秋的声音'], extras: ['语文园地二'] },
        { unit: '第三单元（童话）', lessons: ['卖火柴的小女孩', '那一定会很好', '在牛肚子里旅行', '一块奶酪'], extras: ['语文园地三', '习作：我来编童话'] },
        { unit: '第四单元（预测策略）', lessons: ['总也倒不了的老屋', '胡萝卜先生的长胡子', '小狗学叫'], extras: ['语文园地四', '口语交际：名字里的故事'] },
        { unit: '第五单元（习作·观察）', lessons: ['搭船的鸟', '金色的草地'], extras: ['习作例文'] },
        { unit: '第六单元', lessons: ['古诗三首（望天门山、饮湖上初晴后雨、望洞庭）', '富饶的西沙群岛', '海滨小城', '美丽的小兴安岭'], extras: ['语文园地六', '口语交际：身边的"小事"'] },
        { unit: '第七单元', lessons: ['大自然的声音', '父亲、树林和鸟', '带刺的朋友'], extras: ['语文园地七', '口语交际：我有一个想法'] },
        { unit: '第八单元', lessons: ['司马光', '掌声', '灰雀', '手术台就是阵地'], extras: ['语文园地八'] },
      ],
      '下册': [
        { unit: '第一单元（春天）', lessons: ['古诗三首（绝句·迟日江山丽、惠崇春江晚景、三衢道中）', '燕子', '荷花', '昆虫备忘录'], extras: ['语文园地一'] },
        { unit: '第二单元（寓言）', lessons: ['守株待兔', '陶罐和铁罐', '鹿角和鹿腿', '池子与河流'], extras: ['语文园地二', '口语交际：该不该实行班干部轮流制'] },
        { unit: '第三单元（传统文化）', lessons: ['古诗三首（元日、清明、九月九日忆山东兄弟）', '纸的发明', '赵州桥', '一幅名扬中外的画'], extras: ['语文园地三'] },
        { unit: '第四单元（观察与发现）', lessons: ['花钟', '蜜蜂', '小虾'], extras: ['语文园地四', '口语交际：劝说'] },
        { unit: '第五单元（习作·想象）', lessons: ['宇宙的另一边', '我变成了一棵树'], extras: ['习作例文'] },
        { unit: '第六单元（童年）', lessons: ['童年的水墨画', '剃头大师', '肥皂泡', '我不能失信'], extras: ['语文园地六'] },
        { unit: '第七单元（自然）', lessons: ['我们奇妙的世界', '海底世界', '火烧云'], extras: ['语文园地七', '口语交际：趣味故事会'] },
        { unit: '第八单元（童话）', lessons: ['慢性子裁缝和急性子顾客', '方帽子店', '漏', '枣核'], extras: ['语文园地八'] },
      ],
    },
    '数学': {
      '上册': [
        { unit: '第一单元 时、分、秒', lessons: ['秒的认识', '时间的计算'] },
        { unit: '第二单元 万以内的加法和减法（一）', lessons: ['两位数加两位数（口算）', '几百几十加减几百几十', '用估算解决问题'] },
        { unit: '第三单元 测量', lessons: ['毫米的认识', '分米的认识', '千米的认识', '吨的认识'] },
        { unit: '第四单元 万以内的加法和减法（二）', lessons: ['加法（笔算）', '减法（笔算）', '加减法的验算'] },
        { unit: '第五单元 倍的认识', lessons: ['倍的认识', '解决问题'] },
        { unit: '第六单元 多位数乘一位数', lessons: ['口算乘法', '笔算乘法', '一个因数中间有0的乘法', '一个因数末尾有0的乘法'] },
        { unit: '第七单元 长方形和正方形', lessons: ['四边形的认识', '周长的认识', '长方形和正方形的周长'] },
        { unit: '第八单元 分数的初步认识', lessons: ['几分之一', '几分之几', '分数的简单计算'] },
        { unit: '第九单元 数学广角——集合', lessons: ['集合'] },
        { unit: '第十单元 总复习', lessons: ['总复习'] },
      ],
      '下册': [
        { unit: '第一单元 位置与方向（一）', lessons: ['认识东南西北', '认识东南/东北/西南/西北', '看简单的路线图'] },
        { unit: '第二单元 除数是一位数的除法', lessons: ['口算除法', '笔算除法（一位数除两位数）', '笔算除法（一位数除三位数）'] },
        { unit: '第三单元 复式统计表', lessons: ['复式统计表'] },
        { unit: '第四单元 两位数乘两位数', lessons: ['口算乘法', '笔算乘法（不进位）', '笔算乘法（进位）'] },
        { unit: '第五单元 面积', lessons: ['面积和面积单位', '长方形正方形面积的计算', '面积单位间的进率'] },
        { unit: '第六单元 年、月、日', lessons: ['年月日', '24时计时法'] },
        { unit: '第七单元 小数的初步认识', lessons: ['认识小数', '小数的大小比较', '简单的小数加减法'] },
        { unit: '第八单元 数学广角——搭配（二）', lessons: ['搭配'] },
        { unit: '第九单元 总复习', lessons: ['总复习'] },
      ],
    },
    '英语': {
      '上册': [
        { unit: 'Unit 1 Hello!', lessons: ['Hello!'] },
        { unit: 'Unit 2 Colours!', lessons: ['Colours'] },
        { unit: 'Unit 3 Look at me!', lessons: ['Look at me'] },
        { unit: 'Recycle 1', lessons: ['Recycle 1'] },
        { unit: 'Unit 4 We love animals', lessons: ['We love animals'] },
        { unit: 'Unit 5 Let\'s eat!', lessons: ['Let\'s eat'] },
        { unit: 'Unit 6 Happy birthday!', lessons: ['Happy birthday'] },
        { unit: 'Recycle 2', lessons: ['Recycle 2'] },
      ],
      '下册': [
        { unit: 'Unit 1 Welcome back to school!', lessons: ['Welcome back to school'] },
        { unit: 'Unit 2 My family', lessons: ['My family'] },
        { unit: 'Unit 3 At the zoo', lessons: ['At the zoo'] },
        { unit: 'Recycle 1', lessons: ['Recycle 1'] },
        { unit: 'Unit 4 Where is my car?', lessons: ['Where is my car'] },
        { unit: 'Unit 5 Do you like pears?', lessons: ['Do you like pears'] },
        { unit: 'Unit 6 How many?', lessons: ['How many'] },
        { unit: 'Recycle 2', lessons: ['Recycle 2'] },
      ],
    },
  },

  // ==================== 四年级 ====================
  '四年级': {
    '语文': {
      '上册': [
        { unit: '第一单元', lessons: ['观潮', '走月亮', '现代诗二首（秋晚的江上、花牛歌）', '繁星'], extras: ['语文园地一'] },
        { unit: '第二单元（科普）', lessons: ['一个豆荚里的五粒豆', '夜间飞行的秘密', '呼风唤雨的世纪', '蝴蝶的家'], extras: ['语文园地二'] },
        { unit: '第三单元', lessons: ['古诗三首（暮江吟、题西林壁、雪梅）', '爬山虎的脚', '蟋蟀的住宅'], extras: ['语文园地三', '口语交际：爱护眼睛，保护视力'] },
        { unit: '第四单元（神话）', lessons: ['盘古开天地', '精卫填海', '普罗米修斯', '女娲补天'], extras: ['语文园地四', '习作：我和____过一天'] },
        { unit: '第五单元（习作）', lessons: ['麻雀', '爬天都峰'], extras: ['习作例文'] },
        { unit: '第六单元', lessons: ['牛和鹅', '一只窝囊的大老虎', '陀螺'], extras: ['语文园地六', '口语交际：安慰'] },
        { unit: '第七单元（家国情怀）', lessons: ['古诗三首（出塞、凉州词、夏日绝句）', '为中华之崛起而读书', '梅兰芳蓄须', '延安，我把你追寻'], extras: ['语文园地七'] },
        { unit: '第八单元', lessons: ['王戎不取道旁李', '西门豹治邺', '故事二则（扁鹊治病、纪昌学射）'], extras: ['语文园地八'] },
      ],
      '下册': [
        { unit: '第一单元（田园乡村）', lessons: ['古诗词三首（四时田园杂兴、宿新市徐公店、清平乐·村居）', '乡下人家', '天窗', '三月桃花水'], extras: ['语文园地一', '口语交际：转述'] },
        { unit: '第二单元（科技）', lessons: ['琥珀', '飞向蓝天的恐龙', '纳米技术就在我们身边', '千年梦圆在今朝'], extras: ['语文园地二'] },
        { unit: '第三单元（现代诗）', lessons: ['短诗三首', '绿', '白桦', '在天晴了的时候'], extras: ['语文园地三', '综合性学习：轻叩诗歌大门'] },
        { unit: '第四单元（动物）', lessons: ['猫', '母鸡', '白鹅'], extras: ['语文园地四', '口语交际：朋友相处的秘诀'] },
        { unit: '第五单元（习作·游记）', lessons: ['海上日出', '记金华的双龙洞'], extras: ['习作例文'] },
        { unit: '第六单元（成长）', lessons: ['小英雄雨来（节选）', '我们家的男子汉', '芦花鞋'], extras: ['语文园地六'] },
        { unit: '第七单元', lessons: ['古诗三首（芙蓉楼送辛渐、塞下曲、墨梅）', '文言文二则（囊萤夜读、铁杵成针）', '"诺曼底号"遇难记', '黄继光'], extras: ['语文园地七', '口语交际：自我介绍'] },
        { unit: '第八单元（童话）', lessons: ['宝葫芦的秘密（节选）', '巨人的花园', '海的女儿'], extras: ['语文园地八'] },
      ],
    },
    '数学': {
      '上册': [
        { unit: '第一单元 大数的认识', lessons: ['亿以内数的认识', '亿以内数的读法和写法', '亿以内数的大小比较', '亿以内数改写和近似数', '亿以上数的认识', '计算工具的认识'] },
        { unit: '第二单元 公顷和平方千米', lessons: ['公顷和平方千米'] },
        { unit: '第三单元 角的度量', lessons: ['线段、直线、射线', '角的度量', '角的分类', '画角'] },
        { unit: '第四单元 三位数乘两位数', lessons: ['口算乘法', '笔算乘法', '因数中间或末尾有0的乘法', '积的变化规律'] },
        { unit: '第五单元 平行四边形和梯形', lessons: ['平行与垂直', '画垂线', '平行四边形', '梯形'] },
        { unit: '第六单元 除数是两位数的除法', lessons: ['口算除法', '笔算除法（商是一位数）', '笔算除法（商是两位数）', '商的变化规律'] },
        { unit: '第七单元 条形统计图', lessons: ['条形统计图'] },
        { unit: '第八单元 数学广角——优化', lessons: ['合理安排时间', '烙饼问题', '田忌赛马'] },
        { unit: '第九单元 总复习', lessons: ['总复习'] },
      ],
      '下册': [
        { unit: '第一单元 四则运算', lessons: ['加减法的意义和各部分间的关系', '乘除法的意义和各部分间的关系', '括号'] },
        { unit: '第二单元 观察物体（二）', lessons: ['从不同位置观察物体'] },
        { unit: '第三单元 运算定律', lessons: ['加法交换律和结合律', '乘法交换律和结合律', '乘法分配律', '简便计算'] },
        { unit: '第四单元 小数的意义和性质', lessons: ['小数的意义', '小数的读法和写法', '小数的性质', '小数的大小比较', '小数点移动引起小数大小的变化', '小数与单位换算', '小数的近似数'] },
        { unit: '第五单元 三角形', lessons: ['三角形的特性', '三角形的分类', '三角形的内角和'] },
        { unit: '第六单元 小数的加法和减法', lessons: ['小数加减法', '小数加减混合运算'] },
        { unit: '第七单元 图形的运动（二）', lessons: ['轴对称', '平移'] },
        { unit: '第八单元 平均数与条形统计图', lessons: ['平均数', '复式条形统计图'] },
        { unit: '第九单元 数学广角——鸡兔同笼', lessons: ['鸡兔同笼'] },
        { unit: '第十单元 总复习', lessons: ['总复习'] },
      ],
    },
    '英语': {
      '上册': [
        { unit: 'Unit 1 My classroom', lessons: ['My classroom'] },
        { unit: 'Unit 2 My schoolbag', lessons: ['My schoolbag'] },
        { unit: 'Unit 3 My friends', lessons: ['My friends'] },
        { unit: 'Recycle 1', lessons: ['Recycle 1'] },
        { unit: 'Unit 4 My home', lessons: ['My home'] },
        { unit: 'Unit 5 Dinner\'s ready', lessons: ['Dinner\'s ready'] },
        { unit: 'Unit 6 Meet my family!', lessons: ['Meet my family'] },
        { unit: 'Recycle 2', lessons: ['Recycle 2'] },
      ],
      '下册': [
        { unit: 'Unit 1 My school', lessons: ['My school'] },
        { unit: 'Unit 2 What time is it?', lessons: ['What time is it'] },
        { unit: 'Unit 3 Weather', lessons: ['Weather'] },
        { unit: 'Recycle 1', lessons: ['Recycle 1'] },
        { unit: 'Unit 4 At the farm', lessons: ['At the farm'] },
        { unit: 'Unit 5 My clothes', lessons: ['My clothes'] },
        { unit: 'Unit 6 Shopping', lessons: ['Shopping'] },
        { unit: 'Recycle 2', lessons: ['Recycle 2'] },
      ],
    },
  },

  // ==================== 五年级 ====================
  '五年级': {
    '语文': {
      '上册': [
        { unit: '第一单元（万物有灵）', lessons: ['白鹭', '落花生', '桂花雨', '珍珠鸟'], extras: ['语文园地一', '口语交际：制定班级公约'] },
        { unit: '第二单元（阅读策略：提高阅读速度）', lessons: ['搭石', '将相和', '什么比猎豹的速度更快', '冀中的地道战'], extras: ['语文园地二'] },
        { unit: '第三单元（民间故事）', lessons: ['猎人海力布', '牛郎织女（一）', '牛郎织女（二）'], extras: ['语文园地三', '口语交际：讲民间故事'] },
        { unit: '第四单元（爱国情怀）', lessons: ['古诗三首（示儿、题临安邸、己亥杂诗）', '少年中国说（节选）', '圆明园的毁灭', '小岛'], extras: ['语文园地四', '习作：二十年后的家乡'] },
        { unit: '第五单元（习作·说明文）', lessons: ['太阳', '松鼠'], extras: ['习作例文'] },
        { unit: '第六单元（父母之爱）', lessons: ['慈母情深', '父爱之舟', '"精彩极了"和"糟糕透了"'], extras: ['语文园地六', '口语交际：父母之爱'] },
        { unit: '第七单元（自然之美）', lessons: ['古诗词三首（山居秋暝、枫桥夜泊、长相思）', '四季之美', '鸟的天堂', '月迹'], extras: ['语文园地七'] },
        { unit: '第八单元（读书）', lessons: ['古人谈读书', '忆读书', '我的"长生果"'], extras: ['语文园地八', '口语交际：我最喜欢的人物形象'] },
      ],
      '下册': [
        { unit: '第一单元（童年往事）', lessons: ['古诗三首（四时田园杂兴、稚子弄冰、村晚）', '祖父的园子', '月是故乡明', '梅花魂'], extras: ['语文园地一', '口语交际：走进他们的童年岁月'] },
        { unit: '第二单元（古典名著）', lessons: ['草船借箭', '景阳冈', '猴王出世', '红楼春趣'], extras: ['语文园地二', '口语交际：怎么表演课本剧'] },
        { unit: '第三单元（综合性学习）', lessons: ['汉字真有趣', '我爱你，汉字'], extras: [] },
        { unit: '第四单元（家国情怀）', lessons: ['古诗三首（从军行、秋夜将晓出篱门迎凉有感、闻官军收河南河北）', '青山处处埋忠骨', '军神', '清贫'], extras: ['语文园地四'] },
        { unit: '第五单元（习作·写人）', lessons: ['人物描写一组', '刷子李'], extras: ['习作例文'] },
        { unit: '第六单元（思维火花）', lessons: ['自相矛盾', '田忌赛马', '跳水'], extras: ['语文园地六', '口语交际：辩论'] },
        { unit: '第七单元（异域风情）', lessons: ['威尼斯的小艇', '牧场之国', '金字塔'], extras: ['语文园地七'] },
        { unit: '第八单元（幽默与智慧）', lessons: ['杨氏之子', '手指', '童年的发现'], extras: ['语文园地八', '口语交际：我们都来讲笑话'] },
      ],
    },
    '数学': {
      '上册': [
        { unit: '第一单元 小数乘法', lessons: ['小数乘整数', '小数乘小数', '积的近似数', '整数乘法运算定律推广到小数'] },
        { unit: '第二单元 位置', lessons: ['用数对确定位置'] },
        { unit: '第三单元 小数除法', lessons: ['除数是整数的小数除法', '一个数除以小数', '商的近似数', '循环小数'] },
        { unit: '第四单元 可能性', lessons: ['可能性'] },
        { unit: '第五单元 简易方程', lessons: ['用字母表示数', '方程的意义', '等式的性质', '解方程', '实际问题与方程'] },
        { unit: '第六单元 多边形的面积', lessons: ['平行四边形的面积', '三角形的面积', '梯形的面积', '组合图形的面积'] },
        { unit: '第七单元 数学广角——植树问题', lessons: ['植树问题'] },
        { unit: '第八单元 总复习', lessons: ['总复习'] },
      ],
      '下册': [
        { unit: '第一单元 观察物体（三）', lessons: ['观察物体'] },
        { unit: '第二单元 因数与倍数', lessons: ['因数和倍数', '2和5的倍数的特征', '3的倍数的特征', '质数和合数'] },
        { unit: '第三单元 长方体和正方体', lessons: ['长方体和正方体的认识', '长方体和正方体的表面积', '长方体和正方体的体积', '体积单位间的进率', '容积和容积单位'] },
        { unit: '第四单元 分数的意义和性质', lessons: ['分数的意义', '分数与除法', '真分数和假分数', '分数的基本性质', '约分', '通分', '分数和小数的互化'] },
        { unit: '第五单元 图形的运动（三）', lessons: ['旋转'] },
        { unit: '第六单元 分数的加法和减法', lessons: ['同分母分数加减法', '异分母分数加减法', '分数加减混合运算'] },
        { unit: '第七单元 数学广角——找次品', lessons: ['找次品'] },
        { unit: '第八单元 总复习', lessons: ['总复习'] },
      ],
    },
    '英语': {
      '上册': [
        { unit: 'Unit 1 What\'s he like?', lessons: ['What\'s he like'] },
        { unit: 'Unit 2 My week', lessons: ['My week'] },
        { unit: 'Unit 3 What would you like?', lessons: ['What would you like'] },
        { unit: 'Recycle 1', lessons: ['Recycle 1'] },
        { unit: 'Unit 4 What can you do?', lessons: ['What can you do'] },
        { unit: 'Unit 5 There is a big bed', lessons: ['There is a big bed'] },
        { unit: 'Unit 6 In a nature park', lessons: ['In a nature park'] },
        { unit: 'Recycle 2', lessons: ['Recycle 2'] },
      ],
      '下册': [
        { unit: 'Unit 1 My day', lessons: ['My day'] },
        { unit: 'Unit 2 My favourite season', lessons: ['My favourite season'] },
        { unit: 'Unit 3 My school calendar', lessons: ['My school calendar'] },
        { unit: 'Recycle 1', lessons: ['Recycle 1'] },
        { unit: 'Unit 4 When is the art show?', lessons: ['When is the art show'] },
        { unit: 'Unit 5 Whose dog is it?', lessons: ['Whose dog is it'] },
        { unit: 'Unit 6 Work quietly!', lessons: ['Work quietly'] },
        { unit: 'Recycle 2', lessons: ['Recycle 2'] },
      ],
    },
  },

  // ==================== 六年级 ====================
  '六年级': {
    '语文': {
      '上册': [
        { unit: '第一单元（触摸自然）', lessons: ['草原', '丁香结', '古诗词三首（宿建德江、六月二十七日望湖楼醉书、西江月·夜行黄沙道中）', '花之歌'], extras: ['语文园地一'] },
        { unit: '第二单元（革命岁月）', lessons: ['七律·长征', '狼牙山五壮士', '开国大典', '灯光'], extras: ['语文园地二', '口语交际：演讲'] },
        { unit: '第三单元（有目的地阅读）', lessons: ['竹节人', '宇宙生命之谜', '故宫博物院'], extras: ['语文园地三'] },
        { unit: '第四单元（小说）', lessons: ['桥', '穷人', '在柏林'], extras: ['语文园地四', '口语交际：请你支持我'] },
        { unit: '第五单元（习作·围绕中心意思写）', lessons: ['夏天里的成长', '盼'], extras: ['习作例文'] },
        { unit: '第六单元（保护环境）', lessons: ['古诗三首（浪淘沙·其一、江南春、书湖阴先生壁）', '只有一个地球', '青山不老', '三黑和土地'], extras: ['语文园地六'] },
        { unit: '第七单元（艺术之美）', lessons: ['文言文二则（伯牙鼓琴、书戴嵩画牛）', '月光曲', '京剧趣谈'], extras: ['语文园地七', '口语交际：聊聊书法'] },
        { unit: '第八单元（走近鲁迅）', lessons: ['少年闰土', '好的故事', '我的伯父鲁迅先生', '有的人——纪念鲁迅有感'], extras: ['语文园地八'] },
      ],
      '下册': [
        { unit: '第一单元（民风民俗）', lessons: ['北京的春节', '腊八粥', '古诗三首（寒食、迢迢牵牛星、十五夜望月）', '藏戏'], extras: ['语文园地一'] },
        { unit: '第二单元（外国名著）', lessons: ['鲁滨逊漂流记（节选）', '骑鹅旅行记（节选）', '汤姆·索亚历险记（节选）'], extras: ['语文园地二', '口语交际：同读一本书'] },
        { unit: '第三单元（习作·让真情自然流露）', lessons: ['匆匆', '那个星期天'], extras: ['习作例文'] },
        { unit: '第四单元（理想与信念）', lessons: ['古诗三首（马诗、石灰吟、竹石）', '十六年前的回忆', '为人民服务', '金色的鱼钩'], extras: ['语文园地四'] },
        { unit: '第五单元（科学精神）', lessons: ['文言文二则（学弈、两小儿辩日）', '真理诞生于一百个问号之后', '表里的生物', '他们那时候多有趣啊'], extras: ['语文园地五'] },
        { unit: '第六单元（综合性学习·难忘小学生活）', lessons: ['回忆往事', '依依惜别'], extras: [] },
      ],
    },
    '数学': {
      '上册': [
        { unit: '第一单元 分数乘法', lessons: ['分数乘整数', '分数乘分数', '小数乘分数', '解决问题'] },
        { unit: '第二单元 位置与方向（二）', lessons: ['用方向和距离确定位置', '描述简单的路线图'] },
        { unit: '第三单元 分数除法', lessons: ['倒数的认识', '分数除以整数', '一个数除以分数', '解决问题'] },
        { unit: '第四单元 比', lessons: ['比的意义', '比的基本性质', '比的应用'] },
        { unit: '第五单元 圆', lessons: ['圆的认识', '圆的周长', '圆的面积', '扇形'] },
        { unit: '第六单元 百分数（一）', lessons: ['百分数的意义和写法', '百分数和分数小数的互化', '用百分数解决问题'] },
        { unit: '第七单元 扇形统计图', lessons: ['扇形统计图'] },
        { unit: '第八单元 数学广角——数与形', lessons: ['数与形'] },
        { unit: '第九单元 总复习', lessons: ['总复习'] },
      ],
      '下册': [
        { unit: '第一单元 负数', lessons: ['负数的认识', '负数的初步应用'] },
        { unit: '第二单元 百分数（二）', lessons: ['折扣', '成数', '税率', '利率'] },
        { unit: '第三单元 圆柱与圆锥', lessons: ['圆柱的认识', '圆柱的表面积', '圆柱的体积', '圆锥的认识', '圆锥的体积'] },
        { unit: '第四单元 比例', lessons: ['比例的意义和基本性质', '解比例', '正比例和反比例', '比例尺', '图形的放大与缩小'] },
        { unit: '第五单元 数学广角——鸽巢问题', lessons: ['鸽巢问题'] },
        { unit: '第六单元 整理和复习', lessons: ['数与代数', '图形与几何', '统计与概率'] },
      ],
    },
    '英语': {
      '上册': [
        { unit: 'Unit 1 How can I get there?', lessons: ['How can I get there'] },
        { unit: 'Unit 2 Ways to go to school', lessons: ['Ways to go to school'] },
        { unit: 'Unit 3 My weekend plan', lessons: ['My weekend plan'] },
        { unit: 'Recycle 1', lessons: ['Recycle 1'] },
        { unit: 'Unit 4 I have a pen pal', lessons: ['I have a pen pal'] },
        { unit: 'Unit 5 What does he do?', lessons: ['What does he do'] },
        { unit: 'Unit 6 How do you feel?', lessons: ['How do you feel'] },
        { unit: 'Recycle 2', lessons: ['Recycle 2'] },
      ],
      '下册': [
        { unit: 'Unit 1 How tall are you?', lessons: ['How tall are you'] },
        { unit: 'Unit 2 Last weekend', lessons: ['Last weekend'] },
        { unit: 'Unit 3 Where did you go?', lessons: ['Where did you go'] },
        { unit: 'Unit 4 Then and now', lessons: ['Then and now'] },
        { unit: 'Recycle: Mike\'s happy days', lessons: ['Mike\'s happy days'] },
      ],
    },
  },
};

export const getCurriculum = (grade, subject) => {
  return curriculum[grade]?.[subject] || null;
};

export const getAvailableCurriculum = () => {
  const result = [];
  for (const [grade, subjects] of Object.entries(curriculum)) {
    for (const [subject, volumes] of Object.entries(subjects)) {
      result.push({ grade, subject, volumes: Object.keys(volumes) });
    }
  }
  return result;
};

export default curriculum;
