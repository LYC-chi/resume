#!/usr/bin/env node
/**
 * build-resume.js
 * 1) 用 resume.json（或 editor/seed.js）生成可发布的静态简历页面 index.html
 * 2) 组装 dist/ 目录：编辑器作为入口，可直接部署到任意静态托管
 *
 * 用法：node scripts/build-resume.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TEMPLATE = require(path.join(ROOT, 'editor', 'template.js'));
const SEED = require(path.join(ROOT, 'editor', 'seed.js'));

const DATA_FILE = path.join(ROOT, 'resume.json');
const OUT_FILE = path.join(ROOT, 'index.html');
const DIST = path.join(ROOT, 'dist');

/* ---------- 1. 读取数据 ---------- */
let data;
if (fs.existsSync(DATA_FILE)) {
  data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  console.log('· 数据源：resume.json');
} else {
  data = SEED;
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log('· 数据源：editor/seed.js（已生成 resume.json）');
}

/* ---------- 2. 生成简历页面 ---------- */
const html = TEMPLATE.build(data);
fs.writeFileSync(OUT_FILE, html, 'utf8');
console.log('✓ index.html 已生成（' + (Buffer.byteLength(html, 'utf8') / 1024).toFixed(1) + ' KB）');

/* ---------- 3. 组装 dist/ ---------- */
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

const EDITOR_FILES = ['index.html', 'styles.css', 'app.js', 'template.js', 'seed.js'];
EDITOR_FILES.forEach(function (f) {
  fs.copyFileSync(path.join(ROOT, 'editor', f), path.join(DIST, f));
});
fs.writeFileSync(path.join(DIST, 'resume.html'), html, 'utf8');
fs.writeFileSync(path.join(DIST, 'resume.json'), JSON.stringify(data, null, 2) + '\n', 'utf8');

console.log('✓ dist/ 已生成（入口为编辑器 index.html，简历页为 resume.html）');
console.log('  模板：' + ((data.theme && data.theme.template) || 'classic') +
  ' · 姓名：' + ((data.basics && data.basics.name) || '—'));
