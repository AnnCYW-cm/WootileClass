import { Link } from 'react-router-dom';

const features = [
  {
    title: '班级管理',
    description: '轻松创建和管理多个班级，支持Excel批量导入学生信息',
    icon: '📚',
  },
  {
    title: '随机点名',
    description: '多种有趣的点名方式：转盘抽取、抽卡动画，让课堂更活跃',
    icon: '🎯',
  },
  {
    title: '出勤记录',
    description: '快速记录学生出勤状态，支持出勤、缺勤、迟到、请假等状态',
    icon: '📋',
  },
  {
    title: '数据统计',
    description: '自动统计出勤数据，帮助教师了解学生出勤情况',
    icon: '📊',
  },
];

export const Home = () => {
  return (
    <div>
      {/* Hero Section */}
      <div className="bg-indigo-600">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl">
            教师教学平台
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-indigo-100">
            专为K12教师打造的智能教学助手，轻松管理班级，趣味点名
          </p>
          <div className="mt-10">
            <Link
              to="/register"
              className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 md:py-4 md:text-lg md:px-10"
            >
              免费开始使用
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              核心功能
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              简单易用，功能强大
            </p>
          </div>
          <div className="mt-12 grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            <span className="block">准备好开始了吗？</span>
            <span className="block text-indigo-600">立即注册，免费使用</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <Link
              to="/register"
              className="px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              开始使用
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500">
            &copy; 2024 教师教学平台. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};
