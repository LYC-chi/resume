/* ==========================================================================
 * Resume Studio · 交互式在线简历编辑器
 *  - 可视化编辑 + 实时预览 + 本地自动保存
 *  - 一键发布到 GitHub（REST API）并自动启用 GitHub Pages
 * ========================================================================== */
(function () {
  'use strict';

  var TPL = window.ResumeTemplate;
  var esc = TPL.esc;

  var DATA_KEY = 'resume-studio:data:v2';
  var CFG_KEY = 'resume-studio:publish:v1';
  var TOKEN_KEY = 'resume-studio:token:v1';

  /* ======================================================================
   * 默认数据（来自 seed.js）
   * ==================================================================== */
  var DEFAULT_DATA = clone(window.RESUME_SEED);

  var PUB_DEFAULTS = {
    email: '1102130249@qq.com',
    owner: 'LYC-chi',
    repo: 'resume',
    branch: 'main',
    path: 'index.html',
    message: '更新个人简历'
  };

  var PRESETS = [
    { n: '藏青鎏金', p: '#1B3A5C', a: '#C9A961' },
    { n: '墨绿铜', p: '#1F4E4A', a: '#C08B4F' },
    { n: '酒红米金', p: '#6B2737', a: '#C89B6A' },
    { n: '石墨蓝', p: '#333A45', a: '#7C93B5' },
    { n: '靛青', p: '#22366E', a: '#5B8DEF' },
    { n: '赤金', p: '#8C2F39', a: '#D4A94E' }
  ];

  var SECTION_META = [
    { id: 'summary', label: '个人简介' },
    { id: 'education', label: '教育背景' },
    { id: 'experience', label: '工作与实践经历' },
    { id: 'projects', label: '项目经验' },
    { id: 'skills', label: '专业技能' },
    { id: 'courses', label: '主修课程' },
    { id: 'awards', label: '获奖荣誉' }
  ];

  var FACTORY = {
    education: function () { return { school: '', college: '', major: '', degree: '', start: '', end: '', status: '', highlights: [], courses: [] }; },
    experience: function () { return { org: '', role: '', start: '', end: '', summary: '', bullets: [] }; },
    projects: function () { return { name: '', role: '', start: '', end: '', link: '', description: '', bullets: [] }; },
    skills: function () { return { name: '', category: '', level: 70, desc: '' }; },
    courses: function () { return { name: '', desc: '' }; },
    awards: function () { return { date: '', title: '', rank: '', scope: '' }; },
    links: function () { return { label: '', url: '' }; },
    customs: function () { return { id: uid(), title: '自定义模块', bullets: [] }; }
  };

  /* ======================================================================
   * 工具
   * ==================================================================== */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function uid() { return 'm' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3); }
  function getPath(o, p) { return p.split('.').reduce(function (a, k) { return a == null ? a : a[k]; }, o); }
  function setPath(o, p, v) {
    var ks = p.split('.'), last = ks.pop(), t = o;
    for (var i = 0; i < ks.length; i++) { t = t[ks[i]]; if (t == null) return; }
    t[last] = v;
  }
  function deepMerge(base, extra) {
    if (Array.isArray(base) || Array.isArray(extra)) return extra === undefined ? base : extra;
    if (typeof base === 'object' && base && typeof extra === 'object' && extra) {
      var out = clone(base);
      Object.keys(extra).forEach(function (k) { out[k] = deepMerge(base[k], extra[k]); });
      return out;
    }
    return extra === undefined ? base : extra;
  }
  function debounce(fn, ms) {
    var t; return function () { var a = arguments, self = this; clearTimeout(t); t = setTimeout(function () { fn.apply(self, a); }, ms); };
  }

  function toast(msg, kind) {
    var wrap = $('#toastWrap');
    var el = document.createElement('div');
    el.className = 'toast' + (kind ? ' ' + kind : '');
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(function () {
      el.style.transition = 'opacity .3s, transform .3s';
      el.style.opacity = '0';
      el.style.transform = 'translateY(10px)';
      setTimeout(function () { el.remove(); }, 320);
    }, kind === 'err' ? 4200 : 2400);
  }

  function download(filename, content, mime) {
    var blob = new Blob([content], { type: (mime || 'text/plain') + ';charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 3000);
  }

  /* ======================================================================
   * 状态
   * ==================================================================== */
  var state = loadData();
  var openSections = { basics: true, theme: true };

  function loadData() {
    try {
      var raw = localStorage.getItem(DATA_KEY);
      if (!raw) return clone(DEFAULT_DATA);
      return deepMerge(DEFAULT_DATA, JSON.parse(raw));
    } catch (e) { return clone(DEFAULT_DATA); }
  }

  var saveLocal = debounce(function () {
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify(state));
      var h = $('#saveHint');
      h.classList.remove('flash');
      h.textContent = '已自动保存 · ' + new Date().toLocaleTimeString('zh-CN', { hour12: false });
      setTimeout(function () { h.classList.remove('flash'); }, 400);
    } catch (e) { /* 空间不足等，忽略 */ }
  }, 400);

  /* ======================================================================
   * 预览
   * ==================================================================== */
  var renderPreview = debounce(function () {
    var html = TPL.build(state);
    var f = $('#preview');
    try {
      var d = f.contentDocument || f.contentWindow.document;
      if (d) { d.open(); d.write(html); d.close(); return; }
    } catch (e) { /* fallthrough */ }
    f.srcdoc = html;
  }, 180);

  function applyViewWidth(v) {
    var paper = $('#previewPaper');
    if (v === 'auto') { paper.style.maxWidth = '860px'; paper.style.width = '100%'; }
    else { paper.style.width = v + 'px'; paper.style.maxWidth = 'none'; }
  }

  /* ======================================================================
   * 编辑器渲染
   * ==================================================================== */
  function captureOpen() {
    $$('#editorPane details.section').forEach(function (d) { openSections[d.dataset.sec] = d.open; });
  }

  function section(id, title, count, body, open) {
    var isOpen = open === undefined ? !!openSections[id] : open;
    return '<details class="section" data-sec="' + id + '"' + (isOpen ? ' open' : '') + '>' +
      '<summary><span class="dot"></span><span>' + esc(title) + '</span>' +
      (count != null ? '<span class="count">' + count + '</span>' : '') +
      '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>' +
      '</summary><div class="section-body">' + body + '</div></details>';
  }

  function F(label, path, val, opt) {
    opt = opt || {};
    if (opt.type === 'textarea') {
      return '<label class="fld"><span>' + esc(label) + '</span>' +
        '<textarea data-path="' + path + '" rows="' + (opt.rows || 3) + '" placeholder="' + esc(opt.ph || '') + '">' + esc(val) + '</textarea></label>';
    }
    return '<label class="fld"><span>' + esc(label) + '</span>' +
      '<input type="text" data-path="' + path + '" value="' + esc(val) + '" placeholder="' + esc(opt.ph || '') + '"/></label>';
  }

  function LINES(label, path, arr, ph) {
    return '<label class="fld"><span>' + esc(label) + '</span>' +
      '<textarea data-path="' + path + '" data-type="lines" rows="4" placeholder="' + esc(ph || '每行一条') + '">' +
      esc((arr || []).join('\n')) + '</textarea></label>';
  }

  function listBlock(listPath, addLabel, titleOf, renderItem) {
    var arr = getPath(state, listPath) || [];
    var items = arr.map(function (it, i) {
      return '<div class="card">' +
        '<div class="card-head">' +
        '<span class="card-idx">' + (i + 1) + '</span>' +
        '<span class="card-name">' + esc(titleOf(it, i) || '（未命名）') + '</span>' +
        '<div class="card-acts">' +
        '<button class="act" data-act="up" data-list="' + listPath + '" data-idx="' + i + '" title="上移">↑</button>' +
        '<button class="act" data-act="down" data-list="' + listPath + '" data-idx="' + i + '" title="下移">↓</button>' +
        '<button class="act del" data-act="del" data-list="' + listPath + '" data-idx="' + i + '" title="删除">✕</button>' +
        '</div></div>' +
        '<div class="card-body">' + renderItem(it, i) + '</div></div>';
    }).join('');
    var empty = arr.length ? '' : '<div class="empty-hint">还没有内容 · 点击下方按钮添加</div>';
    return empty + items + '<button class="add-btn" data-act="add" data-list="' + listPath + '">＋ 新增' + esc(addLabel) + '</button>';
  }

  /* ---------- 各模块表单 ---------- */
  function secTheme() {
    var t = state.theme;
    var tpls = [['classic', '经典单栏'], ['modern', '侧栏版'], ['ats', '极简 ATS']];
    var fonts = [['sans', '无衬线'], ['serif', '衬线'], ['mono', '等宽']];
    var dens = [['normal', '舒适'], ['compact', '紧凑']];

    var tplBtns = tpls.map(function (x) {
      return '<button class="seg-btn' + (t.template === x[0] ? ' active' : '') + '" data-act="tpl" data-v="' + x[0] + '">' + x[1] + '</button>';
    }).join('');
    var fontBtns = fonts.map(function (x) {
      return '<button class="seg-btn' + (t.font === x[0] ? ' active' : '') + '" data-act="font" data-v="' + x[0] + '">' + x[1] + '</button>';
    }).join('');
    var densBtns = dens.map(function (x) {
      return '<button class="seg-btn' + (t.density === x[0] ? ' active' : '') + '" data-act="density" data-v="' + x[0] + '">' + x[1] + '</button>';
    }).join('');
    var swatches = PRESETS.map(function (p) {
      var active = (p.p.toLowerCase() === String(t.primary).toLowerCase() && p.a.toLowerCase() === String(t.accent).toLowerCase());
      return '<button class="swatch' + (active ? ' active' : '') + '" data-act="preset" data-p="' + p.p + '" data-a="' + p.a + '" title="' + esc(p.n) + '" style="--sp:' + p.p + ';--sa:' + p.a + '">' +
        '<i class="p"></i><i class="a"></i></button>';
    }).join('');

    return section('theme', '模板与主题', null,
      '<label class="fld"><span>版式模板</span><div class="seg-btns">' + tplBtns + '</div></label>' +
      '<label class="fld"><span>配色方案</span><div class="swatches">' + swatches + '</div></label>' +
      '<div class="row2">' +
      '<label class="fld"><span>主色</span><div class="color-row"><input type="color" data-path="theme.primary" value="' + esc(t.primary) + '"/><code>' + esc(t.primary) + '</code></div></label>' +
      '<label class="fld"><span>点缀色</span><div class="color-row"><input type="color" data-path="theme.accent" value="' + esc(t.accent) + '"/><code>' + esc(t.accent) + '</code></div></label>' +
      '</div>' +
      '<label class="fld"><span>字体</span><div class="seg-btns">' + fontBtns + '</div></label>' +
      '<label class="fld"><span>内容密度</span><div class="seg-btns">' + densBtns + '</div></label>'
    );
  }

  function secLayout() {
    var rows = state.order.map(function (id) {
      var meta = SECTION_META.filter(function (m) { return m.id === id; })[0];
      var label = meta ? meta.label : (id.indexOf('custom:') === 0 ? customTitle(id.slice(7)) : id);
      var hidden = !!(state.hidden || {})[id];
      return '<div class="sec-row' + (hidden ? ' hidden' : '') + '">' +
        '<label><input type="checkbox" data-act="vis" data-key="' + id + '"' + (hidden ? '' : ' checked') + '/>' +
        '<span class="t">' + esc(label) + '</span></label>' +
        '<span class="h">' +
        '<button class="act" data-act="secup" data-key="' + id + '" title="上移">↑</button>' +
        '<button class="act" data-act="secdown" data-key="' + id + '" title="下移">↓</button>' +
        '</span></div>';
    }).join('');
    return section('layout', '模块管理与排序', null,
      '<div class="notice" style="margin-bottom:12px"><span>⇅</span><div>拖不动？用 ↑ ↓ 调整模块顺序，取消勾选即可在简历中隐藏该模块。</div></div>' + rows);
  }

  function customTitle(id) {
    var m = (state.customs || []).filter(function (x) { return x.id === id; })[0];
    return m ? (m.title || '自定义模块') : '自定义模块';
  }

  function secBasics() {
    var b = state.basics;
    var links = (b.links || []).map(function (l, i) {
      return '<div class="link-row">' +
        '<input type="text" data-path="basics.links.' + i + '.label" value="' + esc(l.label) + '" placeholder="名称，如 GitHub"/>' +
        '<input type="text" data-path="basics.links.' + i + '.url" value="' + esc(l.url) + '" placeholder="https://..."/>' +
        '<button class="act del" data-act="del" data-list="links" data-idx="' + i + '" title="删除">✕</button>' +
        '</div>';
    }).join('');

    return section('basics', '个人信息', null,
      '<div class="row2">' + F('姓名', 'basics.name', b.name, { ph: '刘晏池' }) + F('英文名 / 拼音', 'basics.nameEn', b.nameEn, { ph: 'LIU YANCHI' }) + '</div>' +
      '<div class="row3">' + F('性别', 'basics.gender', b.gender) + F('政治面貌', 'basics.politics', b.politics) + F('所在城市', 'basics.city', b.city, { ph: '辽宁 · 大连' }) + '</div>' +
      F('求职方向 / 身份标签', 'basics.title', b.title, { ph: '大数据管理与应用 · 本科在读' }) +
      F('院校 / 学院（副标题）', 'basics.school', b.school, { ph: '大连财经学院 · 管理学院' }) +
      '<div class="row3">' + F('手机', 'basics.phone', b.phone, { ph: '选填' }) + F('邮箱', 'basics.email', b.email, { ph: '选填' }) + F('微信', 'basics.wechat', b.wechat, { ph: '选填' }) + '</div>' +
      F('头像图片地址（选填）', 'basics.photo', b.photo, { ph: 'https://... 留空则显示姓名首字' }) +
      '<label class="fld"><span>个人简介</span>' +
      '<textarea data-path="basics.summary" rows="5" placeholder="用 3-5 句话概括你的核心优势">' + esc(b.summary) + '</textarea></label>' +
      '<div class="fld"><span>链接（GitHub / 作品集 / 博客）</span>' +
      (links || '<div class="empty-hint">暂无链接</div>') +
      '<button class="add-btn" data-act="add" data-list="links">＋ 新增链接</button></div>',
      true);
  }

  function secList(id, title, listPath, addLabel, titleOf, renderItem) {
    var arr = getPath(state, listPath) || [];
    return section(id, title, arr.length, listBlock(listPath, addLabel, titleOf, renderItem));
  }

  function renderEditor() {
    var pane = $('#editorPane');
    var scrollTop = pane.scrollTop;
    captureOpen();

    var html = '';
    html += secBasics();
    html += secTheme();
    html += secLayout();

    html += secList('education', '教育背景', 'education', '教育经历',
      function (e) { return e.school || e.major; },
      function (e, i) {
        return '<div class="row2">' + F('学校', 'education.' + i + '.school', e.school, { ph: '大连财经学院' }) +
          F('学院', 'education.' + i + '.college', e.college, { ph: '管理学院' }) + '</div>' +
          '<div class="row2">' + F('专业', 'education.' + i + '.major', e.major, { ph: '大数据管理与应用' }) +
          F('学历', 'education.' + i + '.degree', e.degree, { ph: '本科在读' }) + '</div>' +
          '<div class="row3">' + F('开始', 'education.' + i + '.start', e.start, { ph: '2023.09' }) +
          F('结束', 'education.' + i + '.end', e.end, { ph: '2027.06' }) +
          F('状态标签', 'education.' + i + '.status', e.status, { ph: '准 2027 届' }) + '</div>' +
          LINES('教育亮点（每行一条）', 'education.' + i + '.highlights', e.highlights) +
          LINES('主修课程（每行一条）', 'education.' + i + '.courses', e.courses);
      });

    html += secList('experience', '工作与实践经历', 'experience', '经历',
      function (x) { return x.org || x.role; },
      function (x, i) {
        return '<div class="row2">' + F('组织 / 公司', 'experience.' + i + '.org', x.org, { ph: '大数据分析社团' }) +
          F('职位 / 角色', 'experience.' + i + '.role', x.role, { ph: '社长' }) + '</div>' +
          '<div class="row2">' + F('开始时间', 'experience.' + i + '.start', x.start, { ph: '2023' }) +
          F('结束时间', 'experience.' + i + '.end', x.end, { ph: '至今' }) + '</div>' +
          F('一句话概述', 'experience.' + i + '.summary', x.summary, { ph: '统筹运营 · 组织实践 · 带队参赛' }) +
          LINES('工作内容 / 成果（每行一条）', 'experience.' + i + '.bullets', x.bullets);
      });

    html += secList('projects', '项目经验', 'projects', '项目',
      function (x) { return x.name; },
      function (x, i) {
        return '<div class="row2">' + F('项目名称', 'projects.' + i + '.name', x.name, { ph: '数据分析实践项目' }) +
          F('担任角色', 'projects.' + i + '.role', x.role, { ph: '项目负责人' }) + '</div>' +
          '<div class="row3">' + F('开始', 'projects.' + i + '.start', x.start, { ph: '2023' }) +
          F('结束', 'projects.' + i + '.end', x.end, { ph: '至今' }) +
          F('项目链接', 'projects.' + i + '.link', x.link, { ph: '选填' }) + '</div>' +
          F('项目简介', 'projects.' + i + '.description', x.description) +
          LINES('项目职责 / 成果（每行一条）', 'projects.' + i + '.bullets', x.bullets);
      });

    html += secList('skills', '专业技能', 'skills', '技能',
      function (s) { return s.name; },
      function (s, i) {
        return '<div class="row2">' + F('技能名称', 'skills.' + i + '.name', s.name, { ph: 'Pandas' }) +
          F('分类', 'skills.' + i + '.category', s.category, { ph: '数据处理' }) + '</div>' +
          '<label class="fld"><span>熟练度</span><div class="range-row">' +
          '<input type="range" min="0" max="100" step="1" data-path="skills.' + i + '.level" data-type="num" value="' + (Number(s.level) || 0) + '"/>' +
          '<output>' + (Number(s.level) || 0) + '</output></div></label>' +
          F('技能说明', 'skills.' + i + '.desc', s.desc, { ph: '一句话描述掌握程度与应用场景' });
      });

    html += secList('courses', '主修课程', 'courses', '课程',
      function (c) { return c.name; },
      function (c, i) {
        return F('课程名称', 'courses.' + i + '.name', c.name, { ph: 'Python 编程' }) +
          F('课程说明', 'courses.' + i + '.desc', c.desc, { ph: '一句话说明' });
      });

    html += secList('awards', '获奖荣誉', 'awards', '奖项',
      function (x) { return x.title || x.rank; },
      function (x, i) {
        return '<div class="row3">' + F('时间', 'awards.' + i + '.date', x.date, { ph: '2025.12' }) +
          F('等级', 'awards.' + i + '.rank', x.rank, { ph: '一等奖' }) +
          F('级别', 'awards.' + i + '.scope', x.scope, { ph: '省赛' }) + '</div>' +
          F('奖项名称 / 赛事', 'awards.' + i + '.title', x.title);
      });

    /* 自定义模块 */
    var customs = listBlock('customs', '自定义模块',
      function (m) { return m.title; },
      function (m, i) {
        return F('模块标题', 'customs.' + i + '.title', m.title, { ph: '如：校园活动 / 自我评价' }) +
          LINES('模块内容（每行一条）', 'customs.' + i + '.bullets', m.bullets);
      });
    html += section('customs', '自定义模块', (state.customs || []).length, customs);

    pane.innerHTML = html;
    pane.scrollTop = scrollTop;
  }

  /* ======================================================================
   * 交互
   * ==================================================================== */
  function afterEdit(structural) {
    saveLocal();
    if (structural) renderEditor();
    renderPreview();
  }

  document.addEventListener('input', function (e) {
    var el = e.target;
    var path = el.getAttribute && el.getAttribute('data-path');
    var act = el.getAttribute && el.getAttribute('data-act');

    // 模块显隐
    if (act === 'vis') {
      var key = el.getAttribute('data-key');
      state.hidden = state.hidden || {};
      if (el.checked) delete state.hidden[key]; else state.hidden[key] = true;
      el.closest('.sec-row').classList.toggle('hidden', !el.checked);
      afterEdit(false);
      return;
    }
    if (!path) return;

    if (el.dataset.type === 'lines') {
      setPath(state, path, el.value.split('\n'));
    } else if (el.dataset.type === 'num' || el.type === 'range') {
      var n = Number(el.value);
      setPath(state, path, n);
      var out = el.parentNode.querySelector('output');
      if (out) out.textContent = n;
    } else {
      setPath(state, path, el.value);
    }

    if (el.type === 'color') {
      // 同步色值文字
      var code = el.parentNode.querySelector('code');
      if (code) code.textContent = el.value;
      renderEditor();
    }
    afterEdit(false);
  });

  document.addEventListener('change', function (e) {
    var el = e.target;
    if (el.tagName === 'SELECT') return;
    var path = el.getAttribute && el.getAttribute('data-path');
    if (!path) return;
    if (el.type === 'checkbox') setPath(state, path, el.checked);
    afterEdit(false);
  });

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-act]');
    if (!btn) return;
    var act = btn.getAttribute('data-act');
    if (act === 'vis') return;

    var list = btn.getAttribute('data-list');
    var idx = parseInt(btn.getAttribute('data-idx'), 10);
    var key = btn.getAttribute('data-key');

    switch (act) {
      case 'add': {
        var arr = getPath(state, list);
        if (!Array.isArray(arr)) return;
        arr.push(FACTORY[list]());
        if (list === 'customs') state.order.push('custom:' + arr[arr.length - 1].id);
        if (list === 'education') openSections.education = true;
        if (list === 'experience') openSections.experience = true;
        if (list === 'projects') openSections.projects = true;
        if (list === 'skills') openSections.skills = true;
        if (list === 'awards') openSections.awards = true;
        if (list === 'courses') openSections.courses = true;
        if (list === 'customs') openSections.customs = true;
        renderEditor();
        renderPreview();
        // 滚动到新增项
        setTimeout(function () {
          var cards = $$('#editorPane .section[data-sec="' + list + '"] .card');
          var c = cards[cards.length - 1];
          if (c) { c.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        }, 30);
        saveLocal();
        break;
      }
      case 'del': {
        var a2 = getPath(state, list);
        if (!Array.isArray(a2)) return;
        var removed = a2[idx];
        if (list === 'customs' && removed) {
          state.order = state.order.filter(function (x) { return x !== 'custom:' + removed.id; });
        }
        a2.splice(idx, 1);
        renderEditor(); renderPreview(); saveLocal();
        break;
      }
      case 'up': case 'down': {
        var a3 = getPath(state, list);
        if (!Array.isArray(a3)) return;
        var j = act === 'up' ? idx - 1 : idx + 1;
        if (j < 0 || j >= a3.length) return;
        var tmp = a3[idx]; a3[idx] = a3[j]; a3[j] = tmp;
        renderEditor(); renderPreview(); saveLocal();
        break;
      }
      case 'secup': case 'secdown': {
        var i2 = state.order.indexOf(key);
        if (i2 < 0) return;
        var j2 = act === 'secup' ? i2 - 1 : i2 + 1;
        if (j2 < 0 || j2 >= state.order.length) return;
        var t2 = state.order[i2]; state.order[i2] = state.order[j2]; state.order[j2] = t2;
        renderEditor(); renderPreview(); saveLocal();
        break;
      }
      case 'tpl': state.theme.template = btn.getAttribute('data-v'); renderEditor(); renderPreview(); saveLocal(); break;
      case 'font': state.theme.font = btn.getAttribute('data-v'); renderEditor(); renderPreview(); saveLocal(); break;
      case 'density': state.theme.density = btn.getAttribute('data-v'); renderEditor(); renderPreview(); saveLocal(); break;
      case 'preset':
        state.theme.primary = btn.getAttribute('data-p');
        state.theme.accent = btn.getAttribute('data-a');
        renderEditor(); renderPreview(); saveLocal();
        break;
    }
  });

  /* ======================================================================
   * 顶栏action
   * ==================================================================== */
  function currentFileName(ext) {
    var n = (state.basics.name || 'resume').replace(/\s+/g, '');
    return n + '-个人简历.' + ext;
  }

  $('#btnExportJson').addEventListener('click', function () {
    download(currentFileName('json'), JSON.stringify(state, null, 2), 'application/json');
    toast('已导出 JSON 数据', 'ok');
  });

  $('#btnExportHtml').addEventListener('click', function () {
    download(currentFileName('html'), TPL.build(state), 'text/html');
    toast('已导出 HTML 文件', 'ok');
  });

  $('#btnPrint').addEventListener('click', function () {
    var w = window.open('', '_blank');
    if (!w) { toast('浏览器拦截了新窗口，请允许后重试', 'err'); return; }
    w.document.open();
    w.document.write(TPL.build(state));
    w.document.close();
    w.focus();
    setTimeout(function () { try { w.print(); } catch (e) { /* ignore */ } }, 500);
  });

  $('#btnReset').addEventListener('click', function () {
    if (!confirm('将恢复为初始的示例简历内容，当前编辑内容会被覆盖。确定继续吗？')) return;
    state = clone(DEFAULT_DATA);
    openSections = { basics: true, theme: true };
    renderEditor(); renderPreview(); saveLocal();
    toast('已重置为示例数据', 'ok');
  });

  $('#btnImport').addEventListener('click', function () { $('#fileInput').click(); });

  $('#fileInput').addEventListener('change', function (e) {
    var f = e.target.files && e.target.files[0];
    if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        var data = JSON.parse(String(r.result));
        state = deepMerge(DEFAULT_DATA, data);
        if (!Array.isArray(state.order) || !state.order.length) state.order = clone(DEFAULT_DATA.order);
        renderEditor(); renderPreview(); saveLocal();
        toast('导入成功', 'ok');
      } catch (err) { toast('导入失败：不是合法的 JSON 文件', 'err'); }
    };
    r.readAsText(f, 'utf-8');
    e.target.value = '';
  });

  $('#btnOpenPreview').addEventListener('click', function () {
    var w = window.open('', '_blank');
    if (!w) { toast('浏览器拦截了新窗口', 'err'); return; }
    w.document.open(); w.document.write(TPL.build(state)); w.document.close();
  });

  var viewSel = $('#zoomSelect');
  if (viewSel) {
    viewSel.addEventListener('change', function () { applyViewWidth(viewSel.value); });
    applyViewWidth(viewSel.value);
  }

  /* 移动端视图切换 */
  $$('#mobileSwitch .seg').forEach(function (b) {
    b.addEventListener('click', function () {
      var preview = b.getAttribute('data-view') === 'preview';
      document.body.classList.toggle('view-preview', preview);
      $$('#mobileSwitch .seg').forEach(function (x) { x.classList.toggle('active', x === b); });
    });
  });

  /* 键盘：Ctrl/Cmd + S 保存 */
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      try { localStorage.setItem(DATA_KEY, JSON.stringify(state)); } catch (err) { }
      toast('已保存到本地', 'ok');
    }
    if (e.key === 'Escape') closePublish();
  });

  /* ======================================================================
   * GitHub 发布
   * ==================================================================== */
  var GH = 'https://api.github.com';
  var publishing = false;

  function loadCfg() {
    var cfg = clone(PUB_DEFAULTS);
    try {
      var raw = localStorage.getItem(CFG_KEY);
      if (raw) cfg = Object.assign(cfg, JSON.parse(raw));
    } catch (e) { /* ignore */ }
    return cfg;
  }

  function renderPublishForm() {
    var cfg = loadCfg();
    $('#pubEmail').value = cfg.email || '';
    $('#pubOwner').value = cfg.owner || '';
    $('#pubRepo').value = cfg.repo || '';
    $('#pubBranch').value = cfg.branch || '';
    $('#pubPath').value = cfg.path || '';
    $('#pubMessage').value = cfg.message || '';
    $('#pubRemember').checked = true;
    try {
      var t = localStorage.getItem(TOKEN_KEY);
      if (t) $('#pubToken').value = t;
    } catch (e) { /* ignore */ }
  }

  function openPublish() {
    renderPublishForm();
    $('#pubLog').hidden = true;
    $('#pubLog').innerHTML = '';
    $('#pubResult').hidden = true;
    $('#pubHint').textContent = '';
    $('#publishModal').hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closePublish() {
    if (publishing) return;
    $('#publishModal').hidden = true;
    document.body.style.overflow = '';
  }

  $('#btnPublish').addEventListener('click', openPublish);
  $$('#publishModal [data-close]').forEach(function (el) { el.addEventListener('click', closePublish); });

  function log(msg, kind) {
    var box = $('#pubLog');
    box.hidden = false;
    var cls = kind === 'ok' ? 'ok' : (kind === 'err' ? 'err' : 'info');
    box.insertAdjacentHTML('beforeend', '<div class="' + cls + '">' + esc(msg) + '</div>');
    box.scrollTop = box.scrollHeight;
  }
  function setBusy(b) {
    publishing = b;
    var btn = $('#pubStart');
    btn.disabled = b;
    btn.innerHTML = b ? '<span class="spinner"></span> 发布中…' : '开始发布';
  }

  function ghFetch(path, opt) {
    opt = opt || {};
    var headers = {
      'Authorization': 'Bearer ' + opt.token,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    };
    if (opt.body) headers['Content-Type'] = 'application/json';
    return fetch(GH + path, {
      method: opt.method || 'GET',
      headers: headers,
      body: opt.body ? JSON.stringify(opt.body) : undefined
    }).then(function (res) {
      return res.text().then(function (txt) {
        var data = null;
        if (txt) { try { data = JSON.parse(txt); } catch (e) { data = txt; } }
        return { ok: res.ok, status: res.status, data: data };
      });
    }).catch(function (err) {
      throw new Error('网络请求失败：' + (err && err.message ? err.message : '未知错误'));
    });
  }

  function b64(str) {
    var bytes = new TextEncoder().encode(str);
    var bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }

  function encPath(p) {
    return p.split('/').map(encodeURIComponent).join('/');
  }

  function ghErrorMessage(d, fallback) {
    if (d && typeof d === 'object' && d.message) return d.message;
    return fallback;
  }

  function putFile(owner, repo, branch, filePath, content, message, token) {
    var base = '/repos/' + owner + '/' + repo + '/contents/' + encPath(filePath);
    return ghFetch(base + '?ref=' + encodeURIComponent(branch), { token: token }).then(function (cur) {
      var body = { message: message, content: b64(content), branch: branch };
      if (cur.ok && cur.data && cur.data.sha) body.sha = cur.data.sha;
      return ghFetch(base, { method: 'PUT', token: token, body: body });
    }).then(function (res) {
      if (res.ok) return res.data;
      if (res.status === 404) throw new Error('分支「' + branch + '」不存在，或当前 Token 没有该仓库的写入权限');
      if (res.status === 401) throw new Error('Token 无效或已过期');
      if (res.status === 403) throw new Error('权限不足（' + ghErrorMessage(res.data, '') + '）');
      throw new Error('写入 ' + filePath + ' 失败：HTTP ' + res.status + ' ' + ghErrorMessage(res.data, ''));
    });
  }

  function ensureBranchReady(owner, repo, branch, token) {
    var tries = 0;
    function attempt() {
      tries++;
      return ghFetch('/repos/' + owner + '/' + repo + '/contents/?ref=' + encodeURIComponent(branch), { token: token })
        .then(function (r) {
          if (r.ok) return true;
          if (tries >= 12) return true; // 交给后续写入去报错
          return new Promise(function (res) { setTimeout(res, 800); }).then(attempt);
        });
    }
    return attempt();
  }

  function doPublish() {
    if (publishing) return;

    var token = $('#pubToken').value.trim();
    var owner = $('#pubOwner').value.trim();
    var repo = $('#pubRepo').value.trim();
    var branch = $('#pubBranch').value.trim() || 'main';
    var filePath = $('#pubPath').value.trim() || 'index.html';
    var message = $('#pubMessage').value.trim() || '更新个人简历';
    var email = $('#pubEmail').value.trim();
    var usePages = $('#pubPages').checked;
    var useJson = $('#pubJson').checked;

    if (!token) { toast('请填写 Personal Access Token', 'err'); $('#pubToken').focus(); return; }
    if (!owner || !repo) { toast('请填写 GitHub 用户名与仓库名', 'err'); return; }

    var cfg = { email: email, owner: owner, repo: repo, branch: branch, path: filePath, message: message };
    try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } catch (e) { /* ignore */ }
    try {
      if ($('#pubRemember').checked) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch (e) { /* ignore */ }

    setBusy(true);
    $('#pubLog').innerHTML = '';
    $('#pubResult').hidden = true;
    $('#pubHint').textContent = '正在发布…';

    var tplHtml = TPL.build(state);
    var jsonStr = JSON.stringify(state, null, 2);
    var pagesUrl = 'https://' + owner + '.github.io/' + repo + '/';

    log('▶ 开始发布到 ' + owner + '/' + repo + ' …');
    log('› 校验 Token …');

    ghFetch('/user', { token: token }).then(function (me) {
      if (!me.ok) throw new Error('Token 校验失败（HTTP ' + me.status + '）：' + ghErrorMessage(me.data, ''));
      log('✓ 已认证为 ' + me.data.login, 'ok');

      log('› 检查仓库 ' + owner + '/' + repo + ' …');
      return ghFetch('/repos/' + owner + '/' + repo, { token: token }).then(function (r) {
        if (r.ok) {
          branch = branch || r.data.default_branch || 'main';
          log('✓ 仓库已存在，默认分支 ' + (r.data.default_branch || branch), 'ok');
          return null;
        }
        if (r.status !== 404) throw new Error('无法访问仓库：HTTP ' + r.status + ' ' + ghErrorMessage(r.data, ''));

        log('› 仓库不存在，正在创建（公开）…');
        return ghFetch('/user/repos', {
          method: 'POST', token: token,
          body: {
            name: repo,
            description: '个人在线简历 · 由 Resume Studio 生成',
            private: false,
            auto_init: true,
            has_issues: false,
            has_wiki: false
          }
        }).then(function (c) {
          if (!c.ok) throw new Error('创建仓库失败：HTTP ' + c.status + ' ' + ghErrorMessage(c.data, ''));
          branch = c.data.default_branch || branch || 'main';
          log('✓ 仓库已创建（分支 ' + branch + '）', 'ok');
          return ensureBranchReady(owner, repo, branch, token).then(function () {
            log('✓ 初始化完成', 'ok');
          });
        });
      });
    }).then(function () {
      log('› 写入 ' + filePath + '（简历页面）…');
      return putFile(owner, repo, branch, filePath, tplHtml, message, token).then(function () {
        log('✓ 简历页面已推送 → ' + filePath, 'ok');
      });
    }).then(function () {
      if (!useJson) return null;
      log('› 写入 resume.json（数据文件）…');
      return putFile(owner, repo, branch, 'resume.json', jsonStr, message + ' · 同步数据', token)
        .then(function () { log('✓ 数据文件已推送 → resume.json', 'ok'); })
        .catch(function (e) { log('⚠ 数据文件推送失败（不影响页面）：' + e.message, 'err'); });
    }).then(function () {
      if (!usePages) { log('ℹ 已跳过 GitHub Pages 启用'); return null; }
      log('› 启用 GitHub Pages …');
      return ghFetch('/repos/' + owner + '/' + repo + '/pages', {
        method: 'POST', token: token,
        body: { source: { branch: branch, path: '/' } }
      }).then(function (p) {
        if (p.ok) { log('✓ GitHub Pages 已启用', 'ok'); }
        else if (p.status === 409) { log('ℹ GitHub Pages 之前已启用', 'ok'); }
        else if (p.status === 403 || p.status === 404) {
          log('⚠ 无法自动启用 Pages（' + ghErrorMessage(p.data, 'HTTP ' + p.status) + '），请在仓库 Settings → Pages 手动选择分支 ' + branch, 'err');
          log('ℹ 已为你准备好地址：' + pagesUrl);
          return { manual: true };
        } else {
          log('⚠ 启用 Pages 返回 HTTP ' + p.status + '：' + ghErrorMessage(p.data, ''), 'err');
          return { manual: true };
        }

        return new Promise(function (res) { setTimeout(res, 1500); }).then(function () {
          return ghFetch('/repos/' + owner + '/' + repo + '/pages', { token: token });
        }).then(function (info) {
          if (info.ok && info.data && info.data.html_url) {
            log('✓ 站点地址：' + info.data.html_url, 'ok');
            return { url: info.data.html_url };
          }
          return { url: pagesUrl };
        });
      });
    }).then(function (pagesResult) {
      var url = (pagesResult && pagesResult.url) || pagesUrl;
      var manual = pagesResult && pagesResult.manual;

      $('#pubUrl').textContent = url;
      $('#pubUrl').setAttribute('data-url', url);
      $('#pubMeta').innerHTML =
        '仓库：<a href="https://github.com/' + esc(owner) + '/' + esc(repo) + '" target="_blank" rel="noopener">github.com/' + esc(owner) + '/' + esc(repo) + '</a>' +
        ' · 分支 <code>' + esc(branch) + '</code>' +
        (manual ? '<br/>首次启用 Pages 需 1-2 分钟生效；若提示未启用，请在仓库 Settings → Pages 中把 Source 设为 <code>' + esc(branch) + ' / (root)</code>。' : '<br/>GitHub Pages 首次部署通常需要 1-2 分钟，稍后刷新即可访问。');
      $('#pubResult').hidden = false;
      $('#pubHint').textContent = manual ? '发布完成，Pages 需手动确认' : '发布完成 🎉';
      toast('发布成功！' + (manual ? '（Pages 需手动确认）' : ''), 'ok');
      log('★ 全部完成！', 'ok');
    }).catch(function (err) {
      log('✕ ' + (err && err.message ? err.message : String(err)), 'err');
      $('#pubHint').textContent = '发布失败';
      toast('发布失败：' + (err && err.message ? err.message : '未知错误'), 'err');
    }).then(function () {
      setBusy(false);
    });
  }

  $('#pubStart').addEventListener('click', doPublish);

  $('#pubCopy').addEventListener('click', function () {
    var url = $('#pubUrl').getAttribute('data-url') || $('#pubUrl').textContent;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () { toast('链接已复制', 'ok'); },
        function () { toast('复制失败，请手动选择', 'err'); });
    } else {
      var r = document.createRange();
      r.selectNodeContents($('#pubUrl'));
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      toast('已选中，请按 Ctrl+C 复制', 'ok');
    }
  });

  $('#pubOpen').addEventListener('click', function () {
    var url = $('#pubUrl').getAttribute('data-url') || $('#pubUrl').textContent;
    window.open(url, '_blank', 'noopener');
  });

  /* ======================================================================
   * 启动
   * ==================================================================== */
  function boot() {
    renderEditor();
    renderPreview();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.ResumeStudio = {
    get state() { return state; },
    setState: function (d) { state = deepMerge(DEFAULT_DATA, d); renderEditor(); renderPreview(); saveLocal(); },
    build: function () { return TPL.build(state); }
  };
})();
