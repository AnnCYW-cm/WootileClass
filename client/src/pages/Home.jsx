import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../components/Layout';

const features = [
  {
    title: '班级管理',
    subtitle: '轻松掌控',
    description: '一键创建班级，Excel批量导入学生。简单，高效，零门槛。',
    icon: '📚',
    gradient: 'from-blue-500 to-cyan-400',
  },
  {
    title: '趣味点名',
    subtitle: '让课堂活起来',
    description: '转盘、抽卡、弹幕、分组。每一次点名，都是一次惊喜。',
    icon: '🎯',
    gradient: 'from-purple-500 to-pink-400',
  },
  {
    title: '学生积分',
    subtitle: '激励成长',
    description: '积分奖惩，排行榜，兑换奖品。让学习充满动力。',
    icon: '🏆',
    gradient: 'from-orange-500 to-yellow-400',
  },
  {
    title: '作业管理',
    subtitle: '随时随地',
    description: '发布、提交、批改，一气呵成。告别纸质作业本。',
    icon: '📝',
    gradient: 'from-green-500 to-emerald-400',
  },
  {
    title: '课堂工具',
    subtitle: '得心应手',
    description: '计时器、噪音监测、分组、座位表。课堂管理利器。',
    icon: '🛠️',
    gradient: 'from-red-500 to-orange-400',
  },
  {
    title: '数据统计',
    subtitle: '洞察一切',
    description: '出勤、积分、作业，多维分析。让数据说话。',
    icon: '📊',
    gradient: 'from-indigo-500 to-purple-400',
  },
];

export const Home = () => {
  const { isDark } = useTheme() || { isDark: false };

  return (
    <div className={`overflow-hidden transition-colors duration-300 ${isDark ? 'bg-[#0a0a0a] text-white' : 'bg-white text-gray-900'}`}>
      {/* Hero Section */}
      <section className="min-h-[calc(100vh-96px)] flex flex-col items-center justify-center px-6 relative">
        {/* Background */}
        {isDark ? (
          <>
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-500/30 rounded-full blur-[120px] animate-pulse"></div>
              <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/30 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-[150px]"></div>
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
          </>
        ) : (
          <>
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-200/50 rounded-full blur-[120px]"></div>
              <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-200/50 rounded-full blur-[120px]"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-100/50 rounded-full blur-[150px]"></div>
            </div>
          </>
        )}

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center relative z-10"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full backdrop-blur-sm border mb-8 ${isDark ? 'bg-white/10 border-white/10' : 'bg-gray-100 border-gray-200'}`}
          >
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>已有 1000+ 位教师正在使用</span>
          </motion.div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              木瓦课堂
            </span>
          </h1>
          <p className="mt-4 text-2xl sm:text-3xl md:text-4xl font-medium bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 bg-clip-text text-transparent">
            重新定义课堂管理
          </p>
          <p className={`mt-6 text-lg sm:text-xl max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            专为K12教师打造的智能教学平台，让每一堂课都精彩
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="group relative px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-lg font-semibold rounded-full overflow-hidden transition-transform hover:scale-105 shadow-lg shadow-purple-500/25"
            >
              免费开始
            </Link>
            <a
              href="#features"
              className={`px-8 py-4 text-lg font-medium transition-colors flex items-center gap-2 group ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
            >
              了解更多
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-10"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className={`w-6 h-10 border-2 rounded-full flex justify-center pt-2 ${isDark ? 'border-white/20' : 'border-gray-300'}`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-white/60' : 'bg-gray-400'}`}></div>
          </motion.div>
        </motion.div>
      </section>

      {/* Product Showcase */}
      <section className={`min-h-screen flex items-center py-32 relative ${isDark ? '' : 'bg-gray-50'}`}>
        {isDark && <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0f0f1a] to-[#0a0a0a]"></div>}

        <div className="w-full max-w-6xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <p className="text-purple-500 font-medium mb-4">产品演示</p>
            <h2 className={`text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
              教学，从未如此简单
            </h2>
            <p className={`mt-6 text-xl max-w-3xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              我们重新思考了课堂管理的每一个细节，只为让你专注于教学本身
            </p>
          </motion.div>

          {/* Demo Preview */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-16"
          >
            <div className="relative aspect-[16/10] rounded-3xl overflow-hidden group shadow-2xl">
              <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-3xl opacity-50 group-hover:opacity-100 transition-opacity blur-sm"></div>
              <div className={`absolute inset-[1px] rounded-3xl flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-100 to-gray-200'}`}>
                <div className="text-center">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center cursor-pointer shadow-lg shadow-purple-500/30"
                  >
                    <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                  </motion.div>
                  <p className={`mt-6 text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>观看演示视频</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={`py-32 relative ${isDark ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
        <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent to-transparent ${isDark ? 'via-white/10' : 'via-gray-200'}`}></div>

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <p className="text-cyan-500 font-medium mb-4">核心功能</p>
            <h2 className={`text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
              强大功能
            </h2>
            <p className={`mt-6 text-xl ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              为教学而生，每一个功能都恰到好处
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group relative"
              >
                <div className={`relative rounded-2xl p-8 transition-all border ${isDark ? 'bg-gray-900/50 backdrop-blur-sm border-white/5 hover:border-white/10' : 'bg-white border-gray-100 hover:border-purple-200 hover:shadow-xl'}`}>
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-2xl mb-6 shadow-lg`}>
                    {feature.icon}
                  </div>
                  <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{feature.title}</h3>
                  <p className={`mt-1 text-sm font-medium bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`}>
                    {feature.subtitle}
                  </p>
                  <p className={`mt-4 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Highlight Feature 1 */}
      <section className={`min-h-screen flex items-center py-32 relative overflow-hidden ${isDark ? '' : 'bg-gradient-to-br from-purple-50 to-pink-50'}`}>
        {isDark && (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-[#0a0a0a] to-blue-900/20"></div>
            <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[150px] -translate-y-1/2"></div>
          </>
        )}

        <div className="w-full max-w-6xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 mb-6">
                <span className="text-purple-500 text-sm font-medium">趣味点名</span>
              </div>
              <h2 className={`text-4xl sm:text-5xl font-bold tracking-tight leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                每一次点名
                <br />
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">都是惊喜</span>
              </h2>
              <p className={`mt-6 text-xl leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                转盘抽取、抽卡翻牌、弹幕飞屏、随机分组。
                告别枯燥点名，让每一个学生都期待被选中。
              </p>
              <Link
                to="/register"
                className="mt-8 inline-flex items-center gap-2 text-purple-500 text-lg font-medium hover:text-purple-600 transition-colors group"
              >
                立即体验
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl opacity-20 blur-2xl"></div>
              <div className="relative aspect-square bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:30px_30px]"></div>
                <span className="text-[120px] relative z-10">🎯</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Highlight Feature 2 */}
      <section className={`min-h-screen flex items-center py-32 relative overflow-hidden ${isDark ? '' : 'bg-gradient-to-br from-orange-50 to-yellow-50'}`}>
        {isDark && (
          <>
            <div className="absolute inset-0 bg-gradient-to-bl from-orange-900/20 via-[#0a0a0a] to-yellow-900/20"></div>
            <div className="absolute top-1/2 right-0 w-[600px] h-[600px] bg-orange-500/20 rounded-full blur-[150px] -translate-y-1/2"></div>
          </>
        )}

        <div className="w-full max-w-6xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="order-2 lg:order-1"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-3xl opacity-20 blur-2xl"></div>
              <div className="relative aspect-square bg-gradient-to-br from-orange-500 to-yellow-500 rounded-3xl flex items-center justify-center overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:30px_30px]"></div>
                <span className="text-[120px] relative z-10">🏆</span>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="order-1 lg:order-2"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 mb-6">
                <span className="text-orange-500 text-sm font-medium">积分系统</span>
              </div>
              <h2 className={`text-4xl sm:text-5xl font-bold tracking-tight leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                激励学生
                <br />
                <span className="bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">从此变得简单</span>
              </h2>
              <p className={`mt-6 text-xl leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                即时加减分，实时排行榜，投屏展示，积分兑换。
                让每一分努力都被看见，让每一次进步都有回报。
              </p>
              <Link
                to="/register"
                className="mt-8 inline-flex items-center gap-2 text-orange-500 text-lg font-medium hover:text-orange-600 transition-colors group"
              >
                开始使用
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className={`min-h-screen flex items-center py-32 relative ${isDark ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
        <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent to-transparent ${isDark ? 'via-white/10' : 'via-gray-200'}`}></div>
        {isDark && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[150px]"></div>}

        <div className="w-full max-w-5xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <p className="text-blue-500 font-medium mb-4">价格方案</p>
            <h2 className={`text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
              选择你的方案
            </h2>
            <p className={`mt-6 text-xl ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              简单透明，物超所值
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative group"
            >
              <div className={`relative rounded-3xl p-10 border ${isDark ? 'bg-gray-900/80 backdrop-blur-sm border-white/5' : 'bg-white border-gray-200 shadow-lg'}`}>
                <h3 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>免费版</h3>
                <div className="mt-6">
                  <span className={`text-5xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>¥0</span>
                </div>
                <p className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>适合体验和入门</p>
                <ul className="mt-8 space-y-4">
                  {['创建1个班级', '基础点名功能', '学生积分记录', '基础数据查看'].map((item, i) => (
                    <li key={i} className={`flex items-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`mt-10 block w-full py-4 text-center text-lg font-medium rounded-full border-2 transition-colors ${isDark ? 'border-white/20 hover:bg-white/5 text-white' : 'border-gray-300 hover:border-gray-400 text-gray-700'}`}
                >
                  免费开始
                </Link>
              </div>
            </motion.div>

            {/* Premium Plan */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative group"
            >
              <div className="absolute -inset-[2px] bg-gradient-to-b from-purple-500 via-pink-500 to-blue-500 rounded-3xl opacity-70"></div>
              <div className={`relative rounded-3xl p-10 overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
                <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>
                <div className="absolute top-6 right-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium px-4 py-1 rounded-full">
                  推荐
                </div>
                <h3 className={`text-2xl font-semibold relative ${isDark ? 'text-white' : 'text-gray-900'}`}>高级会员</h3>
                <div className="mt-6 relative">
                  <span className={`text-5xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>¥1500</span>
                  <span className={`ml-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>/年</span>
                </div>
                <p className={`mt-4 relative ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>约 ¥125/月，解锁全部功能</p>
                <ul className="mt-8 space-y-4 relative">
                  {['无限创建班级', '全部点名模式', '积分兑换系统', '作业管理系统', '数据统计导出', '课堂工具全套', '优先客服支持'].map((item, i) => (
                    <li key={i} className={`flex items-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      <svg className="w-5 h-5 text-purple-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className="mt-10 block w-full py-4 text-center text-lg font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:opacity-90 transition-opacity"
                >
                  立即开通
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-32 relative overflow-hidden ${isDark ? '' : 'bg-gradient-to-br from-purple-600 to-pink-600'}`}>
        {isDark && (
          <>
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] to-gray-900"></div>
            <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[150px]"></div>
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-[150px]"></div>
          </>
        )}

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white">
              准备好了吗？
            </h2>
            <p className={`mt-6 text-xl ${isDark ? 'text-gray-400' : 'text-purple-100'}`}>
              加入数千名教师，开启高效教学之旅
            </p>
            <Link
              to="/register"
              className={`mt-10 inline-block px-12 py-5 text-lg font-semibold rounded-full transition-colors shadow-lg ${isDark ? 'bg-white text-gray-900 hover:bg-gray-100' : 'bg-white text-purple-600 hover:bg-purple-50'}`}
            >
              免费注册
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`border-t ${isDark ? 'border-white/10 bg-[#0a0a0a]' : 'border-gray-200 bg-gray-50'}`}>
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>木瓦课堂</h3>
              <p className="mt-2 text-gray-500 text-sm">让教学更简单</p>
            </div>
            <div>
              <h4 className={`font-medium mb-4 ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>产品</h4>
              <ul className="space-y-3 text-gray-500 text-sm">
                <li><a href="#features" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-gray-900'}`}>功能介绍</a></li>
                <li><a href="#pricing" className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-gray-900'}`}>价格方案</a></li>
              </ul>
            </div>
            <div>
              <h4 className={`font-medium mb-4 ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>支持</h4>
              <ul className="space-y-3 text-gray-500 text-sm">
                <li><span>帮助中心</span></li>
                <li><span>联系我们</span></li>
              </ul>
            </div>
            <div>
              <h4 className={`font-medium mb-4 ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>联系</h4>
              <ul className="space-y-3 text-gray-500 text-sm">
                <li>support@wootile.com</li>
              </ul>
            </div>
          </div>
          <div className={`mt-12 pt-8 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
            <p className="text-center text-gray-500 text-sm">
              © 2024 木瓦课堂 WootileClass. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
