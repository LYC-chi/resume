/*!
 * seed.js — 简历种子数据（浏览器 window.RESUME_SEED / Node module.exports）
 * 这是「刘晏池 · 个人简历」的初始内容，编辑器首次打开时以它为默认值。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RESUME_SEED = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  return {
    theme: { template: 'classic', primary: '#1B3A5C', accent: '#C9A961', font: 'sans', density: 'normal' },
    order: ['summary', 'education', 'experience', 'projects', 'skills', 'courses', 'awards'],
    hidden: {},
    basics: {
      name: '刘晏池',
      nameEn: 'LIU YANCHI',
      gender: '女',
      politics: '群众',
      title: '大数据管理与应用 · 本科在读',
      city: '辽宁 · 大连',
      phone: '',
      email: '',
      wechat: '',
      photo: '',
      school: '大连财经学院 · 管理学院',
      summary: '大数据管理与应用专业在读，现任大数据分析社团社长。熟悉数据采集、清洗、建模与可视化的完整流程，熟练使用 Python（Pandas / NumPy / Matplotlib）与 SQL。曾多次带队参加省级及以上数据分析赛事并获奖，致力于用数据创造价值。',
      links: [{ label: 'GitHub', url: 'https://github.com/LYC-chi' }]
    },
    education: [{
      school: '大连财经学院',
      college: '管理学院',
      major: '大数据管理与应用',
      degree: '本科在读',
      start: '2023.09',
      end: '2027.06',
      status: '准 2027 届',
      highlights: [
        '辽宁省重点建设应用型本科财经类高校，强实践、重数据。',
        '系统掌握数据采集、清洗、分析、可视化全流程技术与方法。',
        '在校期间综合表现优异，担任大数据分析社团社长。'
      ],
      courses: ['Python 编程', '数据库原理', '数据挖掘']
    }],
    experience: [{
      org: '大数据分析社团',
      role: '社长',
      start: '2023',
      end: '至今',
      summary: '统筹社团运营 · 组织实践活动 · 带队参赛',
      bullets: [
        '统筹规划社团整体运营与发展方向，制定阶段性活动目标与工作计划；',
        '组织同学开展大数据分析实践活动，覆盖数据采集、清洗、建模、可视化全流程；',
        '带领社团成员参与多项校级、省级及以上数据分析赛事，累计获省级以上奖项多次。'
      ]
    }],
    projects: [
      {
        name: '数据分析实践项目',
        role: '项目负责人',
        start: '2023',
        end: '至今',
        link: '',
        description: '以社团实践活动为载体的全流程数据实战项目',
        bullets: [
          '完整实践数据采集 → 数据清洗 → 建模分析 → 可视化呈现的全流程；',
          '使用 Python（Pandas / NumPy / Matplotlib）与 SQL 完成数据整理、指标计算与图表输出；',
          '分析成果用于社团活动复盘与赛事选题，支撑团队参赛并取得省级以上奖项。'
        ]
      },
      {
        name: '学科竞赛项目',
        role: '团队核心成员',
        start: '2024',
        end: '2025',
        link: '',
        description: '',
        bullets: [
          '第九届“长风杯”全国大学生大数据分析与挖掘竞赛（东北分赛区）暨第六届辽宁省大学生大数据分析与挖掘竞赛 —— 省赛一等奖；',
          '挑战杯辽宁省大学生课外学术科技作品竞赛 —— 省赛二等奖；',
          '大数据与人工智能学院大数据分析大赛 —— 校赛三等奖。'
        ]
      }
    ],
    skills: [
      { name: 'Pandas', category: '数据处理', level: 90, desc: '熟练使用 DataFrame 完成数据清洗、聚合运算、透视表与多源数据合并。' },
      { name: 'NumPy', category: '科学计算', level: 88, desc: '熟练进行多维数组运算、矩阵变换与向量化处理，为算法实现奠定基础。' },
      { name: 'Matplotlib', category: '数据可视化', level: 85, desc: '能够独立完成折线、柱状、热力、散点等图表的绘制与样式美化。' },
      { name: 'SQL', category: '数据库', level: 85, desc: '熟练编写多表关联、子查询、窗口函数、聚合分析等复杂查询语句。' },
      { name: 'Python', category: '编程语言', level: 88, desc: '数据处理核心编程语言，熟悉常用数据分析与自动化脚本编写。' }
    ],
    courses: [
      { name: 'Python 编程', desc: '数据处理的核心编程语言基础' },
      { name: '数据库原理', desc: 'SQL 语言与关系型数据建模基础' },
      { name: '数据挖掘', desc: '聚类、分类、预测与关联分析' }
    ],
    awards: [
      { date: '2025.12', title: '第九届“长风杯”全国大学生大数据分析与挖掘竞赛 · 东北分赛区暨第六届辽宁省大学生大数据分析与挖掘竞赛', rank: '一等奖', scope: '省赛' },
      { date: '2025.05', title: '挑战杯辽宁省大学生课外学术科技作品竞赛', rank: '二等奖', scope: '省赛' },
      { date: '2024.12', title: '大数据与人工智能学院大数据分析大赛', rank: '三等奖', scope: '校赛' }
    ],
    customs: []
  };
});
