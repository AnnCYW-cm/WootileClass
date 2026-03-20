import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

// Support multiple providers via OpenAI-compatible API
const client = new OpenAI({
  apiKey: process.env.AI_API_KEY || 'sk-placeholder',
  baseURL: process.env.AI_BASE_URL || 'https://api.openai.com/v1',
});

const MODEL = process.env.AI_MODEL || 'gpt-4o-mini';

const chat = async (systemPrompt, userPrompt, options = {}) => {
  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: options.temperature || 0.7,
    max_tokens: options.maxTokens || 2000,
  });
  return response.choices[0].message.content;
};

// Generate student evaluation comments
export const generateStudentComment = async (studentData) => {
  const systemPrompt = `你是一位经验丰富的班主任，擅长撰写学生评语。请根据学生的数据生成一段温暖、具体、有建设性的评语（150-200字）。
评语要求：
- 先肯定优点，再提改进建议
- 结合具体数据说话，不要泛泛而谈
- 语气亲切，像和家长交流
- 用第三人称（"该生"或直接用名字）`;

  const userPrompt = `学生姓名：${studentData.name}
学号：${studentData.studentNo || '无'}
性别：${studentData.gender || '未知'}

出勤数据（近30天）：
- 出勤 ${studentData.attendance?.present || 0} 天
- 缺勤 ${studentData.attendance?.absent || 0} 天
- 迟到 ${studentData.attendance?.late || 0} 天
- 请假 ${studentData.attendance?.leave || 0} 天
- 出勤率 ${studentData.attendance?.rate || 0}%

积分数据：
- 当前总积分 ${studentData.score?.total || 0} 分
- 班级排名 第${studentData.score?.rank || '?'}名（共${studentData.score?.totalStudents || '?'}人）
- 主要加分原因：${studentData.score?.topReasons?.join('、') || '无记录'}

作业数据：
- 提交率 ${studentData.assignment?.submitRate || 0}%
- 平均成绩 ${studentData.assignment?.avgScore || '无评分'}

请生成评语：`;

  return await chat(systemPrompt, userPrompt);
};

// Generate batch comments for a class
export const generateBatchComments = async (studentsData) => {
  const results = [];
  for (const student of studentsData) {
    try {
      const comment = await generateStudentComment(student);
      results.push({ studentId: student.id, name: student.name, comment });
    } catch (err) {
      results.push({ studentId: student.id, name: student.name, comment: null, error: err.message });
    }
  }
  return results;
};

// Generate lesson plan
export const generateLessonPlan = async ({ grade, subject, topic, duration, objectives, pptContent }) => {
  const systemPrompt = `你是一位资深教研员，擅长设计符合人教版（部编版）教材的教案。请根据要求生成一份结构清晰、可直接使用的教案。

重要要求：
- 教案内容必须严格对应该年级该学科的人教版（部编版）教材内容
- 如果课题是具体课文名，请紧密围绕该课文的实际内容设计教学活动
- 教学活动要符合该年龄段学生的认知特点

教案要包含：
1. 教学目标（知识与技能、过程与方法、情感态度与价值观）
2. 教学重难点
3. 教学过程（导入、新授、练习、小结，每个环节注明时间和活动方式）
4. 板书设计（简要）
5. 课后作业建议

格式要求：使用 Markdown 格式，层次分明。`;

  const userPrompt = `年级：${grade}
学科：${subject}
课题：${topic}
课时：${duration || '40分钟'}
${objectives ? `教学目标要求：${objectives}` : ''}${pptContent ? `\n老师已有PPT课件内容：\n${pptContent}\n\n请基于以上PPT内容设计教案，保持与课件的衔接和一致性。` : ''}

请生成教案：`;

  return await chat(systemPrompt, userPrompt, { maxTokens: 3000 });
};

// Generate daily class summary
export const generateClassSummary = async (classData) => {
  const systemPrompt = `你是一位教学助手，请根据今日课堂数据生成一份简洁的课堂小结（100-150字），包含关键数据和建议。`;

  const userPrompt = `班级：${classData.className}
日期：${classData.date}

出勤情况：${classData.totalStudents}人中，出勤${classData.present}人，缺勤${classData.absent}人，迟到${classData.late}人，请假${classData.leave}人
积分变动：今日加分${classData.scoreAdded}次，减分${classData.scoreDeducted}次
作业：${classData.assignmentsDue}项作业截止，提交率${classData.submitRate}%

请生成课堂小结：`;

  return await chat(systemPrompt, userPrompt, { maxTokens: 500 });
};

export default { generateStudentComment, generateBatchComments, generateLessonPlan, generateClassSummary };
