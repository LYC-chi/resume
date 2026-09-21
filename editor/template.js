/*!
 * ResumeTemplate — 把简历数据渲染成一份独立可发布的 HTML 文档
 * 浏览器：window.ResumeTemplate  |  Node：module.exports
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ResumeTemplate = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var FONTS = {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Roboto, Helvetica, Arial, sans-serif',
    serif: '"Songti SC", "Source Han Serif SC", "Noto Serif SC", "SimSun", Georgia, "Times New Roman", serif',
    mono: '"JetBrains Mono", "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace'
  };

  /* ------------------------------------------------------------ helpers */
  function esc(s) {
    return String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function clamp(n) { return Math.max(0, Math.min(255, n)); }
  function hex2rgb(h) {
    h = String(h || '').replace('#', '').trim();
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    if (!/^[0-9a-fA-F]{6}$/.test(h)) h = '1B3A5C';
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function rgb2hex(a) {
    return '#' + a.map(function (v) { return clamp(Math.round(v)).toString(16).padStart(2, '0'); }).join('');
  }
  /** amt > 0 变亮，amt < 0 变暗 */
  function shade(h, amt) {
    return rgb2hex(hex2rgb(h).map(function (v) { return amt >= 0 ? v + (255 - v) * amt : v * (1 + amt); }));
  }
  function rgba(h, a) {
    var c = hex2rgb(h);
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
  }
  function lines(arr) {
    return (arr || []).map(function (s) { return String(s == null ? '' : s).trim(); }).filter(Boolean);
  }
  function has(v) { return v !== undefined && v !== null && String(v).trim() !== ''; }

  /* ------------------------------------------------------------ 基础样式 */
  function baseCss(data) {
    var t = data.theme || {};
    var p = t.primary || '#1B3A5C';
    var a = t.accent || '#C9A961';
    var font = FONTS[t.font] || FONTS.sans;
    var dense = t.density === 'compact';
    var fs = dense ? '13px' : '14px';
    var gap = dense ? '14px' : '22px';

    return [
      ':root{',
      '--p:' + p + ';--p-l:' + shade(p, 0.2) + ';--p-d:' + shade(p, -0.22) + ';',
      '--a:' + a + ';--a-l:' + shade(a, 0.4) + ';--a-d:' + shade(a, -0.3) + ';',
      '--a-soft:' + rgba(a, 0.12) + ';--p-soft:' + rgba(p, 0.06) + ';',
      '--text:#2B3137;--soft:#5A6573;--muted:#8E99A8;--line:#E6EAF1;--bg:#F5F7FA;',
      '--font:' + font + ';}',
      '*,*::before,*::after{box-sizing:border-box}',
      'html{-webkit-text-size-adjust:100%}',
      'body{margin:0;background:var(--bg);font-family:var(--font);font-size:' + fs + ';line-height:1.7;color:var(--text);-webkit-font-smoothing:antialiased}',
      'a{color:var(--p);text-decoration:none}',
      'a:hover{text-decoration:underline}',
      '.doc{background:#fff;max-width:860px;margin:0 auto;min-height:100vh;position:relative}',
      '.accent-bar{height:6px;background:linear-gradient(90deg,var(--p) 0,var(--p) 42%,var(--a) 42%,var(--a) 100%)}',
      'ul.bullets{margin:8px 0 0;padding:0;list-style:none}',
      'ul.bullets>li{position:relative;padding-left:16px;margin:0 0 5px;color:var(--soft);font-size:.965em}',
      'ul.bullets>li::before{content:"";position:absolute;left:2px;top:.62em;width:5px;height:5px;border-radius:50%;background:var(--a)}',
      'ul.bullets>li:last-child{margin-bottom:0}'
    ].join('') + (dense ? '.sec{margin-top:' + gap + '}' : '');
  }

  /* ------------------------------------------------------------ 通用骨架 */
  function secHead(data, id, cn, en) {
    if ((data.theme || {}).template === 'ats') {
      return '<h2 class="sec-h"><span class="cn">' + esc(cn) + '</span></h2>';
    }
    return '<h2 class="sec-h"><span class="cn">' + esc(cn) + '</span><span class="en">' + esc(en) + '</span></h2>';
  }

  function contactItems(b) {
    var out = [];
    if (has(b.phone)) out.push({ k: '电话', v: b.phone, href: 'tel:' + String(b.phone).replace(/\s/g, '') });
    if (has(b.email)) out.push({ k: '邮箱', v: b.email, href: 'mailto:' + b.email });
    if (has(b.city)) out.push({ k: '城市', v: b.city });
    if (has(b.wechat)) out.push({ k: '微信', v: b.wechat });
    (b.links || []).forEach(function (l) {
      if (has(l && l.label) && has(l && l.url)) out.push({ k: '', v: l.label, href: l.url });
    });
    return out;
  }

  function avatarHtml(b) {
    if (has(b.photo)) {
      return '<div class="avatar has-img"><img src="' + esc(b.photo) + '" alt="' + esc(b.name) + '"/></div>';
    }
    var ch = (b.name || '?').trim().charAt(0);
    return '<div class="avatar">' + esc(ch) + '</div>';
  }

  /* ------------------------------------------------------------ 各模块 */
  function secSummary(data) {
    if (!has(data.basics.summary)) return '';
    return '<section class="sec sec-summary">' + secHead(data, 'summary', '个人简介', 'PROFILE') +
      '<p class="summary">' + esc(data.basics.summary).replace(/\n/g, '<br/>') + '</p></section>';
  }

  function secEducation(data) {
    var list = data.education || [];
    if (!list.length) return '';
    var body = list.map(function (e) {
      var bits = [];
      if (has(e.college)) bits.push(esc(e.college));
      if (has(e.major)) bits.push('<strong>' + esc(e.major) + '</strong>');
      if (has(e.degree)) bits.push(esc(e.degree));
      var meta = bits.length ? '<div class="sub">' + bits.join(' · ') + '</div>' : '';
      var stat = has(e.status) ? '<span class="pill">' + esc(e.status) + '</span>' : '';
      var hi = lines(e.highlights);
      var hiH = hi.length ? '<ul class="bullets">' + hi.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>' : '';
      var cs = lines(e.courses);
      var csH = cs.length ? '<div class="course-tags">' + cs.map(function (s) { return '<span class="course-tag">' + esc(s) + '</span>'; }).join('') + '</div>' : '';
      return '<div class="tl-item"><div class="tl-date">' + esc([e.start, e.end].filter(has).join(' — ')) + '</div>' +
        '<div class="tl-body"><h3>' + esc(e.school || '') + stat + '</h3>' + meta + hiH + csH + '</div></div>';
    }).join('');
    return '<section class="sec">' + secHead(data, 'education', '教育背景', 'EDUCATION') + '<div class="tl">' + body + '</div></section>';
  }

  function secExperience(data) {
    var list = data.experience || [];
    if (!list.length) return '';
    var body = list.map(function (x) {
      var bl = lines(x.bullets);
      var blH = bl.length ? '<ul class="bullets">' + bl.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>' : '';
      var sub = has(x.summary) ? '<div class="sub">' + esc(x.summary) + '</div>' : '';
      return '<div class="tl-item"><div class="tl-date">' + esc([x.start, x.end].filter(has).join(' — ')) + '</div>' +
        '<div class="tl-body"><h3>' + esc(x.org || '') + (has(x.role) ? '<span class="role">' + esc(x.role) + '</span>' : '') + '</h3>' + sub + blH + '</div></div>';
    }).join('');
    return '<section class="sec">' + secHead(data, 'experience', '工作与实践经历', 'EXPERIENCE') + '<div class="tl">' + body + '</div></section>';
  }

  function secProjects(data) {
    var list = data.projects || [];
    if (!list.length) return '';
    var body = list.map(function (x) {
      var bl = lines(x.bullets);
      var blH = bl.length ? '<ul class="bullets">' + bl.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>' : '';
      var sub = has(x.description) ? '<div class="sub">' + esc(x.description) + '</div>' : '';
      var link = has(x.link) ? '<a class="plink" href="' + esc(x.link) + '" target="_blank" rel="noopener">' + esc(x.link) + '</a>' : '';
      return '<div class="tl-item"><div class="tl-date">' + esc([x.start, x.end].filter(has).join(' — ')) + '</div>' +
        '<div class="tl-body"><h3>' + esc(x.name || '') + (has(x.role) ? '<span class="role">' + esc(x.role) + '</span>' : '') + '</h3>' + sub + blH + link + '</div></div>';
    }).join('');
    return '<section class="sec">' + secHead(data, 'projects', '项目经验', 'PROJECTS') + '<div class="tl">' + body + '</div></section>';
  }

  function secSkills(data) {
    var list = (data.skills || []).filter(function (s) { return has(s && s.name); });
    if (!list.length) return '';
    var body = list.map(function (s) {
      var lv = Number(s.level);
      var bar = (isFinite(lv) && lv > 0) ?
        '<div class="skill-bar"><i style="width:' + Math.max(0, Math.min(100, lv)) + '%"></i></div>' : '';
      var desc = has(s.desc) ? '<div class="skill-desc">' + esc(s.desc) + '</div>' : '';
      return '<div class="skill"><div class="skill-top"><span class="skill-name">' + esc(s.name) + '</span>' +
        (has(s.category) ? '<span class="skill-cat">' + esc(s.category) + '</span>' : '') + '</div>' + bar + desc + '</div>';
    }).join('');
    return '<section class="sec">' + secHead(data, 'skills', '专业技能', 'SKILLS') + '<div class="skills">' + body + '</div></section>';
  }

  function secCourses(data) {
    var list = (data.courses || []).filter(function (c) { return has(c && c.name); });
    if (!list.length) return '';
    var body = list.map(function (c) {
      return '<div class="course-card"><div class="course-name">' + esc(c.name) + '</div>' +
        (has(c.desc) ? '<div class="course-desc">' + esc(c.desc) + '</div>' : '') + '</div>';
    }).join('');
    return '<section class="sec">' + secHead(data, 'courses', '主修课程', 'COURSES') + '<div class="courses">' + body + '</div></section>';
  }

  function secAwards(data) {
    var list = (data.awards || []).filter(function (x) { return has(x && (x.title || x.rank)); });
    if (!list.length) return '';
    var body = list.map(function (x) {
      var tag = [x.scope, x.rank].filter(has).join(' · ');
      return '<div class="award"><div class="award-date">' + esc(x.date || '') + '</div>' +
        '<div class="award-main"><div class="award-title">' + esc(x.title || '') + '</div></div>' +
        (tag ? '<span class="award-tag">' + esc(tag) + '</span>' : '') + '</div>';
    }).join('');
    return '<section class="sec">' + secHead(data, 'awards', '获奖荣誉', 'HONORS & AWARDS') + '<div class="awards">' + body + '</div></section>';
  }

  function secCustom(data, mod) {
    if (!mod) return '';
    var bl = lines(mod.bullets);
    if (!bl.length) return '';
    return '<section class="sec">' + secHead(data, 'custom', mod.title || '自定义模块', 'CUSTOM') +
      '<ul class="bullets">' + bl.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul></section>';
  }

  function renderById(data, id) {
    if (id.indexOf('custom:') === 0) {
      var cid = id.slice(7);
      var mod = (data.customs || []).filter(function (m) { return m.id === cid; })[0];
      return secCustom(data, mod);
    }
    switch (id) {
      case 'summary': return secSummary(data);
      case 'education': return secEducation(data);
      case 'experience': return secExperience(data);
      case 'projects': return secProjects(data);
      case 'skills': return secSkills(data);
      case 'courses': return secCourses(data);
      case 'awards': return secAwards(data);
      default: return '';
    }
  }

  function bodySections(data, skip) {
    skip = skip || [];
    var order = (data.order || []).slice();
    // 兜底：把还没排进 order 的自定义模块补上
    (data.customs || []).forEach(function (m) {
      if (order.indexOf('custom:' + m.id) === -1) order.push('custom:' + m.id);
    });
    return order.filter(function (id) {
      return !(data.hidden || {})[id] && skip.indexOf(id) === -1;
    }).map(function (id) { return renderById(data, id); }).join('');
  }

  /* ------------------------------------------------------------ 布局：classic / ats */
  function layoutClassic(data) {
    var b = data.basics || {};
    var contacts = contactItems(b).map(function (c) {
      var inner = (has(c.k) ? '<b>' + esc(c.k) + '</b>' : '') + esc(c.v);
      return c.href ? '<a href="' + esc(c.href) + '" target="_blank" rel="noopener">' + inner + '</a>' : '<span>' + inner + '</span>';
    }).join('');
    var title = has(b.title) ? '<div class="hdr-title">' + esc(b.title) + '</div>' : '';
    var school = has(b.school) ? '<span class="hdr-school">' + esc(b.school) + '</span>' : '';
    return '<header class="hdr">' +
      '<div class="hdr-left">' + avatarHtml(b) +
      '<div><h1 class="name">' + esc(b.name || '') +
      (has(b.nameEn) ? '<span class="name-en">' + esc(b.nameEn) + '</span>' : '') + '</h1>' + title + school + '</div></div>' +
      '<div class="contacts">' + contacts + '</div>' +
      '</header>' + bodySections(data);
  }

  /* ------------------------------------------------------------ 布局：modern（左侧栏） */
  function layoutModern(data) {
    var b = data.basics || {};
    var contacts = contactItems(b).map(function (c) {
      var inner = (has(c.k) ? '<span class="k">' + esc(c.k) + '</span>' : '') + '<span class="v">' + esc(c.v) + '</span>';
      return c.href ? '<a class="c-item" href="' + esc(c.href) + '" target="_blank" rel="noopener">' + inner + '</a>'
        : '<div class="c-item">' + inner + '</div>';
    }).join('');

    var hid = data.hidden || {};

    var skills = hid.skills ? '' : (data.skills || []).filter(function (s) { return has(s && s.name); }).map(function (s) {
      var lv = Number(s.level);
      var bar = (isFinite(lv) && lv > 0) ? '<div class="sb"><i style="width:' + Math.max(0, Math.min(100, lv)) + '%"></i></div>' : '';
      return '<div class="s-item"><div class="s-name">' + esc(s.name) + '</div>' + bar + '</div>';
    }).join('');
    var courses = hid.courses ? '' : (data.courses || []).filter(function (c) { return has(c && c.name); })
      .map(function (c) { return '<span class="tag">' + esc(c.name) + '</span>'; }).join('');

    var side = '<aside class="side">' +
      avatarHtml(b) +
      '<h1 class="m-name">' + esc(b.name || '') + '</h1>' +
      (has(b.nameEn) ? '<div class="m-en">' + esc(b.nameEn) + '</div>' : '') +
      (has(b.title) ? '<div class="m-title">' + esc(b.title) + '</div>' : '') +
      '<div class="side-sec"><h4>联系方式</h4><div class="contacts">' + contacts + '</div></div>' +
      (skills ? '<div class="side-sec"><h4>专业技能</h4><div class="side-skills">' + skills + '</div></div>' : '') +
      (courses ? '<div class="side-sec"><h4>主修课程</h4><div class="side-tags">' + courses + '</div></div>' : '') +
      '</aside>';

    var main = '<div class="main">' + bodySections(data, ['skills', 'courses']) + '</div>';
    return '<div class="modern-wrap">' + side + main + '</div>';
  }

  /* ------------------------------------------------------------ CSS: classic / ats */
  function classicCss() {
    return [
      '.doc{padding:0 0 56px}',
      '.hdr{padding:40px 48px 22px;display:flex;justify-content:space-between;gap:28px;align-items:flex-start;border-bottom:2px solid var(--p);margin-bottom:6px}',
      '.hdr-left{display:flex;gap:18px;align-items:center;min-width:0}',
      '.avatar{width:64px;height:64px;flex:0 0 64px;border-radius:16px;background:linear-gradient(135deg,var(--p),var(--p-l));color:var(--a-l);display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:800;overflow:hidden}',
      '.avatar.has-img{background:none}',
      '.avatar img{width:100%;height:100%;object-fit:cover}',
      '.name{margin:0;font-size:29px;font-weight:800;color:var(--p);letter-spacing:2px;line-height:1.2}',
      '.name-en{display:block;margin-top:6px;font-size:11px;letter-spacing:4px;font-weight:600;color:var(--a-d)}',
      '.hdr-title{margin-top:8px;font-size:14px;color:var(--soft)}',
      '.hdr-school{display:inline-block;margin-top:6px;font-size:12.5px;color:var(--muted)}',
      '.contacts{display:flex;flex-direction:column;gap:6px;align-items:flex-end;font-size:12.5px;color:var(--soft);text-align:right;flex:0 0 auto;padding-top:6px}',
      '.contacts a,.contacts span{color:var(--soft);display:inline-flex;gap:8px;white-space:nowrap}',
      '.contacts b{color:var(--p);font-weight:700}',
      '.sec{padding:0 48px;margin-top:26px;break-inside:avoid}',
      '.sec-h{display:flex;align-items:baseline;gap:10px;margin:0 0 14px;padding-bottom:7px;position:relative;font-size:16px;color:var(--p);letter-spacing:1px;border-bottom:1px solid var(--line)}',
      '.sec-h::after{content:"";position:absolute;left:0;bottom:-1px;width:54px;height:2px;background:var(--a)}',
      '.sec-h .en{font-size:9.5px;letter-spacing:3px;color:var(--a-d);font-weight:600}',
      '.summary{margin:0;color:var(--soft)}',
      '.tl{display:flex;flex-direction:column;gap:18px}',
      '.tl-item{display:grid;grid-template-columns:118px 1fr;gap:20px;break-inside:avoid}',
      '.tl-date{font-size:12.5px;font-weight:600;color:var(--a-d);letter-spacing:.4px;padding-top:2px}',
      '.tl-body{min-width:0}',
      '.tl-body h3{margin:0;font-size:15px;font-weight:700;color:var(--p);display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}',
      '.tl-body .role{font-size:12px;font-weight:600;color:var(--a-d);background:var(--a-soft);border-radius:999px;padding:2px 10px}',
      '.tl-body .sub{margin-top:3px;font-size:13px;color:var(--soft)}',
      '.tl-body .sub strong{color:var(--p)}',
      '.pill{font-size:11px;font-weight:600;color:var(--a-d);background:var(--a-soft);border-radius:999px;padding:2px 9px}',
      '.course-tags{margin-top:9px;display:flex;flex-wrap:wrap;gap:7px}',
      '.course-tag{font-size:12px;font-weight:600;color:var(--a-d);background:var(--a-soft);border:1px solid ' + rgba('#C9A961', 0) + ';border-radius:999px;padding:3px 12px}',
      '.plink{display:inline-block;margin-top:7px;font-size:12.5px;border-bottom:1px dashed currentColor}',
      '.skills{display:grid;grid-template-columns:1fr 1fr;gap:12px 30px}',
      '.skill-top{display:flex;justify-content:space-between;align-items:baseline;gap:10px}',
      '.skill-name{font-size:13.5px;font-weight:700;color:var(--p)}',
      '.skill-cat{font-size:11px;color:var(--muted)}',
      '.skill-bar{margin-top:6px;height:6px;border-radius:4px;background:var(--bg);overflow:hidden}',
      '.skill-bar i{display:block;height:100%;border-radius:4px;background:linear-gradient(90deg,var(--p),var(--a))}',
      '.skill-desc{margin-top:5px;font-size:12.5px;color:var(--muted)}',
      '.courses{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}',
      '.course-card{padding:14px 16px;border:1px solid var(--line);border-radius:12px;background:var(--p-soft)}',
      '.course-name{font-size:13.5px;font-weight:700;color:var(--p)}',
      '.course-desc{margin-top:4px;font-size:12.5px;color:var(--soft)}',
      '.awards{display:flex;flex-direction:column;gap:10px}',
      '.award{display:grid;grid-template-columns:80px 1fr auto;gap:16px;align-items:center;padding:12px 16px;border:1px solid var(--line);border-left:3px solid var(--a);border-radius:10px;break-inside:avoid}',
      '.award-date{font-size:12.5px;font-weight:700;color:var(--a-d)}',
      '.award-title{font-size:13.5px;font-weight:600;color:var(--text)}',
      '.award-tag{font-size:11.5px;font-weight:700;color:#fff;background:var(--p);border-radius:999px;padding:3px 12px;white-space:nowrap}',
      '.doc-foot{padding:26px 48px 0;margin-top:34px;border-top:1px dashed var(--line);text-align:center;font-size:11.5px;color:var(--muted);letter-spacing:1px}'
    ].join('');
  }
  function atsCss() {
    return [
      '.doc{padding:0 0 48px;max-width:800px}',
      '.accent-bar{display:none}',
      '.hdr{padding:34px 40px 18px;border-bottom:1.5px solid #333;margin-bottom:4px}',
      '.hdr-left{display:block}',
      '.avatar{display:none}',
      '.name{margin:0;font-size:24px;font-weight:700;color:#111;letter-spacing:1px}',
      '.name-en{display:inline;margin-left:10px;font-size:12px;letter-spacing:2px;color:#555;font-weight:400}',
      '.hdr-title{margin-top:6px;font-size:13px;color:#333}',
      '.hdr-school{display:inline-block;margin-top:4px;font-size:12.5px;color:#555}',
      '.contacts{display:flex;flex-wrap:wrap;gap:4px 18px;justify-content:flex-start;margin-top:10px;text-align:left;font-size:12.5px;color:#333}',
      '.contacts b{color:#111;font-weight:600;margin-right:4px}',
      '.sec{padding:0 40px;margin-top:20px;break-inside:avoid}',
      '.sec-h{margin:0 0 10px;padding-bottom:5px;font-size:14px;font-weight:700;color:#111;letter-spacing:1px;border-bottom:1px solid #ccc;text-transform:uppercase}',
      '.sec-h .en{display:none}',
      '.summary{margin:0;color:#333}',
      '.tl{display:flex;flex-direction:column;gap:14px}',
      '.tl-item{display:block;break-inside:avoid}',
      '.tl-date{font-size:12.5px;font-weight:600;color:#333;margin-bottom:2px}',
      '.tl-body h3{margin:0;font-size:13.5px;font-weight:700;color:#111}',
      '.tl-body .role{font-weight:600;color:#333;margin-left:8px}',
      '.tl-body .sub{margin-top:2px;font-size:12.5px;color:#444}',
      '.pill{display:none}',
      'ul.bullets>li::before{background:#666;width:4px;height:4px}',
      'ul.bullets>li{font-size:12.8px;color:#333}',
      '.course-tags{margin-top:6px}',
      '.course-tag{font-size:12px;color:#333;border:1px solid #ccc;border-radius:3px;padding:2px 8px;margin-right:6px;display:inline-block}',
      '.skills{display:block}',
      '.skill{margin-bottom:6px}',
      '.skill-bar{display:none}',
      '.skill-top{display:block}',
      '.skill-name{font-weight:700;color:#111;font-size:12.8px}',
      '.skill-cat{font-size:11.5px;color:#666;margin-left:8px}',
      '.skill-desc{font-size:12.5px;color:#333;margin-top:2px}',
      '.courses{display:block}',
      '.course-card{padding:0;border:0;background:none;margin-bottom:4px}',
      '.course-name{font-weight:700;color:#111}',
      '.course-desc{font-size:12.5px;color:#333}',
      '.awards{display:block}',
      '.award{display:block;padding:0;border:0;margin-bottom:8px}',
      '.award-date{font-weight:600;color:#333}',
      '.award-title{font-size:12.8px}',
      '.award-tag{background:none;color:#333;padding:0;font-weight:600}',
      '.doc-foot{border-top:1px solid #ddd;color:#666}'
    ].join('');
  }
  function modernCss() {
    return [
      '.doc{max-width:900px}',
      '.accent-bar{display:none}',
      '.modern-wrap{display:grid;grid-template-columns:262px 1fr;min-height:100vh;align-items:stretch}',
      '.side{background:linear-gradient(165deg,var(--p) 0,var(--p-d) 100%);color:#fff;padding:40px 26px 48px;position:relative}',
      '.side .avatar{width:82px;height:82px;flex:0 0 82px;border-radius:20px;background:rgba(255,255,255,.12);color:var(--a-l);margin:0 auto 18px;font-size:32px;display:flex;align-items:center;justify-content:center;overflow:hidden}',
      '.side .avatar img{width:100%;height:100%;object-fit:cover}',
      '.m-name{margin:0;text-align:center;font-size:23px;font-weight:800;letter-spacing:3px}',
      '.m-en{margin-top:6px;text-align:center;font-size:10px;letter-spacing:3px;color:var(--a-l)}',
      '.m-title{margin-top:8px;text-align:center;font-size:12px;color:rgba(255,255,255,.72);line-height:1.5}',
      '.side-sec{margin-top:26px}',
      '.side-sec h4{margin:0 0 10px;font-size:11px;letter-spacing:2.5px;color:var(--a-l);text-transform:uppercase;font-weight:700;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,.18)}',
      '.contacts{display:flex;flex-direction:column;gap:9px;font-size:12px}',
      '.c-item{display:flex;flex-direction:column;color:rgba(255,255,255,.88)}',
      '.c-item .k{font-size:10px;color:rgba(255,255,255,.5);letter-spacing:1px}',
      '.c-item .v{word-break:break-all}',
      '.side-skills{display:flex;flex-direction:column;gap:11px}',
      '.s-name{font-size:12.5px;font-weight:600}',
      '.sb{margin-top:5px;height:5px;border-radius:4px;background:rgba(255,255,255,.16);overflow:hidden}',
      '.sb i{display:block;height:100%;background:linear-gradient(90deg,var(--a),var(--a-l))}',
      '.side-tags{display:flex;flex-wrap:wrap;gap:6px}',
      '.tag{font-size:11.5px;padding:3px 10px;border-radius:999px;background:rgba(255,255,255,.12);color:#fff}',
      '.main{padding:40px 36px 48px;min-width:0}',
      '.main .sec{padding:0;margin-top:24px}',
      '.main .sec:first-child{margin-top:0}',
      '.acc-bar{}',
      '.sec-h{display:flex;align-items:baseline;gap:10px;margin:0 0 14px;padding-bottom:7px;position:relative;font-size:16px;color:var(--p);letter-spacing:1px;border-bottom:1px solid var(--line)}',
      '.sec-h::after{content:"";position:absolute;left:0;bottom:-1px;width:54px;height:2px;background:var(--a)}',
      '.sec-h .en{font-size:9.5px;letter-spacing:3px;color:var(--a-d);font-weight:600}',
      '.summary{margin:0;color:var(--soft)}',
      '.tl{display:flex;flex-direction:column;gap:18px}',
      '.tl-item{display:block;break-inside:avoid}',
      '.tl-date{font-size:12px;font-weight:700;color:var(--a-d);letter-spacing:.4px;margin-bottom:4px}',
      '.tl-body h3{margin:0;font-size:15px;font-weight:700;color:var(--p);display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}',
      '.tl-body .role{font-size:12px;font-weight:600;color:var(--a-d);background:var(--a-soft);border-radius:999px;padding:2px 10px}',
      '.tl-body .sub{margin-top:3px;font-size:13px;color:var(--soft)}',
      '.pill{font-size:11px;font-weight:600;color:var(--a-d);background:var(--a-soft);border-radius:999px;padding:2px 9px}',
      '.course-tags{margin-top:9px;display:flex;flex-wrap:wrap;gap:7px}',
      '.course-tag{font-size:12px;font-weight:600;color:var(--a-d);background:var(--a-soft);border-radius:999px;padding:3px 12px}',
      '.plink{display:inline-block;margin-top:7px;font-size:12.5px;border-bottom:1px dashed currentColor}',
      '.skills{display:grid;grid-template-columns:1fr 1fr;gap:12px 24px}',
      '.skill-top{display:flex;justify-content:space-between;align-items:baseline;gap:10px}',
      '.skill-name{font-size:13.5px;font-weight:700;color:var(--p)}',
      '.skill-cat{font-size:11px;color:var(--muted)}',
      '.skill-bar{margin-top:6px;height:6px;border-radius:4px;background:var(--bg);overflow:hidden}',
      '.skill-bar i{display:block;height:100%;border-radius:4px;background:linear-gradient(90deg,var(--p),var(--a))}',
      '.skill-desc{margin-top:5px;font-size:12.5px;color:var(--muted)}',
      '.courses{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}',
      '.course-card{padding:14px 16px;border:1px solid var(--line);border-radius:12px;background:var(--p-soft)}',
      '.course-name{font-size:13.5px;font-weight:700;color:var(--p)}',
      '.course-desc{margin-top:4px;font-size:12.5px;color:var(--soft)}',
      '.awards{display:flex;flex-direction:column;gap:10px}',
      '.award{display:grid;grid-template-columns:76px 1fr auto;gap:14px;align-items:center;padding:12px 14px;border:1px solid var(--line);border-left:3px solid var(--a);border-radius:10px;break-inside:avoid}',
      '.award-date{font-size:12.5px;font-weight:700;color:var(--a-d)}',
      '.award-title{font-size:13.5px;font-weight:600}',
      '.award-tag{font-size:11.5px;font-weight:700;color:#fff;background:var(--p);border-radius:999px;padding:3px 12px;white-space:nowrap}',
      '.doc-foot{margin-top:34px;padding-top:22px;border-top:1px dashed var(--line);text-align:center;font-size:11.5px;color:var(--muted);letter-spacing:1px}'
    ].join('');
  }

  /* ------------------------------------------------------------ 响应式 + 打印 */
  function mediaCss() {
    return [
      '@media (max-width:760px){',
      '.hdr{padding:26px 20px 18px;flex-direction:column;gap:14px}',
      '.contacts{align-items:flex-start;text-align:left;padding-top:0}',
      '.contacts a,.contacts span{white-space:normal}',
      '.sec{padding:0 20px;margin-top:20px}',
      '.name{font-size:23px}',
      '.tl-item{display:block}',
      '.tl-date{margin-bottom:3px}',
      '.skills{grid-template-columns:1fr}',
      '.courses{grid-template-columns:1fr}',
      '.award{grid-template-columns:1fr;gap:4px}',
      '.award-tag{justify-self:start}',
      '.modern-wrap{grid-template-columns:1fr}',
      '.side{padding:30px 22px 34px}',
      '.main{padding:26px 20px 34px}',
      '.doc-foot{padding-left:20px;padding-right:20px}',
      '}',
      '@media print{',
      'html,body{background:#fff}',
      '.doc{max-width:none;min-height:auto;box-shadow:none}',
      '.sec,.tl-item,.award,.course-card{break-inside:avoid}',
      '.sec-h{break-after:avoid}',
      '.modern-wrap{min-height:auto}',
      '.side{-webkit-print-color-adjust:exact;print-color-adjust:exact}',
      '.accent-bar,.award,.tag,.course-tag,.pill,.role,.avatar{-webkit-print-color-adjust:exact;print-color-adjust:exact}',
      '}',
      '@page{margin:12mm}'
    ].join('');
  }

  /* ------------------------------------------------------------ 主入口 */
  function build(data) {
    data = data || {};
    var b = data.basics || {};
    var t = data.theme || {};
    var tpl = t.template || 'classic';
    var css = baseCss(data);

    if (tpl === 'modern') css += modernCss();
    else if (tpl === 'ats') css += atsCss();
    else css += classicCss();
    css += mediaCss();

    var body;
    if (tpl === 'modern') body = layoutModern(data);
    else body = layoutClassic(data);

    var cls = tpl === 'modern' ? 'tpl-modern' : (tpl === 'ats' ? 'tpl-ats' : 'tpl-classic');
    var title = (b.name || '个人简历') + ' · 个人简历';
    var desc = [b.name, b.title, b.school].filter(has).join(' · ');
    var foot = '<div class="doc-foot">' + esc(b.name || '') + ' · 个人简历 · 更新于 ' + new Date().toISOString().slice(0, 10) + '</div>';

    return '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n<meta charset="UTF-8"/>\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0"/>\n' +
      '<meta name="description" content="' + esc(desc) + '"/>\n' +
      '<title>' + esc(title) + '</title>\n' +
      '<style>' + css + '</style>\n</head>\n<body class="' + cls + '">\n' +
      '<div class="doc"><div class="accent-bar"></div>' + body + foot + '</div>\n</body>\n</html>';
  }

  return { build: build, esc: esc, shade: shade, VERSION: '1.0.0' };
});
