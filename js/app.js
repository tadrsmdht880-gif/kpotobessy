/* ================= عرض الموقع ================= */
let searchIndex = [];
let state = { view: 'home', sectionKey: null, iconId: null };

document.addEventListener('DOMContentLoaded', initApp);

function initApp(){
  document.getElementById('year').textContent = new Date().getFullYear();
  applyBrand();
  buildSearchIndex();
  goHome();

  const si = document.getElementById('searchInput');
  si.addEventListener('input', onSearchInput);
  si.addEventListener('keydown', function(e){
    if(e.key === 'Enter'){
      const first = document.querySelector('#searchResults .result-item');
      if(first) first.click();
    }
    if(e.key === 'Escape') hideResults();
  });
  document.addEventListener('click', function(e){
    if(!e.target.closest('.search-box')) hideResults();
  });
}

function applyBrand(){
  const s = DB.settings;
  document.getElementById('siteName').textContent = s.siteName || 'بوابة الشركة';
  document.getElementById('siteTag').textContent = s.siteTagline || '';
  const img = document.getElementById('logoImg');
  const fb = document.getElementById('logoFallback');
  if(s.logo){ img.src = s.logo; img.hidden = false; fb.style.display = 'none'; }
  else { img.hidden = true; fb.style.display = 'flex'; }
  document.title = (s.siteName || 'بوابة الشركة') + ' | قاعدة المعلومات';
}

/* ================= البحث الشامل ================= */
function buildSearchIndex(){
  searchIndex = [];
  for(const key of Object.keys(DB.sections)){
    const sec = DB.sections[key];
    searchIndex.push({ type:'section', sectionKey:key, iconId:null, title:sec.title, section:'قسم رئيسي', text:sec.title });
    (sec.icons || []).forEach(function(icon){
      searchIndex.push({ type:'icon', sectionKey:key, iconId:icon.id, title:icon.title, section:sec.title, text:icon.title + ' ' + sec.title });
      (icon.tables || []).forEach(function(t){
        let text = t.title + ' ' + t.columns.join(' ');
        t.rows.forEach(function(r){ text += ' ' + r.join(' '); });
        searchIndex.push({ type:'table', sectionKey:key, iconId:icon.id, title:t.title, section:sec.title + ' › ' + icon.title, text:text });
      });
      (icon.pages || []).forEach(function(p){
        searchIndex.push({ type:'page', sectionKey:key, iconId:icon.id, title:(p.title || icon.title), section:sec.title + ' › ' + icon.title, text:(p.title||'') + ' ' + (p.text||'') });
      });
    });
  }
}

function onSearchInput(){
  const q = norm(this.value);
  const box = document.getElementById('searchResults');
  if(q.length < 2){ hideResults(); return; }
  const hits = searchIndex.filter(function(item){
    return norm(item.text).includes(q) || norm(item.title).includes(q);
  }).slice(0, 10);

  box.innerHTML = '';
  if(!hits.length){
    box.innerHTML = '<div class="no-result">لا توجد نتائج مطابقة</div>';
    box.hidden = false;
    return;
  }
  hits.forEach(function(h){
    const div = document.createElement('div');
    div.className = 'result-item';
    const ico = h.type === 'table' ? 'fa-table' : (h.type === 'page' ? 'fa-file-lines' : (h.type === 'section' ? 'fa-folder-open' : 'fa-folder-tree'));
    div.innerHTML = '<i class="fa-solid ' + ico + '"></i><div><b>' + esc(h.title) + '</b><small>' + esc(h.section) + '</small></div>';
    div.addEventListener('click', function(){
      hideResults();
      document.getElementById('searchInput').value = '';
      if(h.type === 'section') showSection(h.sectionKey);
      else showIcon(h.sectionKey, h.iconId);
    });
    box.appendChild(div);
  });
  box.hidden = false;
}
function hideResults(){ const b = document.getElementById('searchResults'); if(b) b.hidden = true; }

/* ================= التنقل ================= */
function clearToolTimers(){
  clearInterval(window.__ctTimer);
  clearInterval(window.__ctNowTimer);
}

function renderBreadcrumb(){
  const bc = document.getElementById('breadcrumb');
  let html = '<span class="crumb" onclick="goHome()"><i class="fa-solid fa-house"></i> الرئيسية</span>';
  if(state.view === 'section' || state.view === 'icon'){
    const sec = DB.sections[state.sectionKey];
    if(sec) html += ' <i class="fa-solid fa-angle-left sep"></i> <span class="crumb" onclick="showSection(\'' + state.sectionKey + '\')">' + esc(sec.title) + '</span>';
  }
  if(state.view === 'icon'){
    const sec = DB.sections[state.sectionKey];
    const icon = sec && (sec.icons || []).find(function(i){ return i.id === state.iconId; });
    if(icon) html += ' <i class="fa-solid fa-angle-left sep"></i> <span class="crumb current">' + esc(icon.title) + '</span>';
  }
  if(state.view === 'tool') html += ' <i class="fa-solid fa-angle-left sep"></i> <span class="crumb current">صلاحية كود فوري</span>';
  bc.innerHTML = html;
  bc.hidden = state.view === 'home';
}

function goHome(){
  clearToolTimers();
  state = { view:'home', sectionKey:null, iconId:null };
  renderBreadcrumb();
  const s = DB.settings;
  let html =
    '<section class="hero glass fade-in">' +
      '<div class="hero-logo">' + (s.logo ? '<img src="' + esc(s.logo) + '" alt="لوجو">' : '<i class="fa-solid fa-bus"></i>') + '</div>' +
      '<h2 class="hero-title">' + esc(s.siteName) + '</h2>' +
      '<p class="hero-sub">' + esc(s.siteTagline || '') + '</p>' +
      '<div class="hero-badge">استخدم البحث الشامل فوق، أو اختر القسم المناسب 👇</div>' +
    '</section>' +
    '<div class="cards-grid">';
  for(const key of Object.keys(DB.sections)){
    const sec = DB.sections[key];
    html +=
      '<div class="card fade-in" onclick="showSection(\'' + key + '\')">' +
        '<div class="card-emoji">' + (sec.emoji || '📁') + '</div>' +
        '<h3>' + esc(sec.title) + '</h3>' +
        '<p>' + (sec.icons || []).length + ' أيقونة داخلية</p>' +
        '<span class="card-arrow"><i class="fa-solid fa-arrow-left"></i></span>' +
      '</div>';
  }
  html +=
      '<div class="card special fade-in" onclick="showTool()">' +
        '<div class="card-emoji">⏱️</div>' +
        '<h3>صلاحية كود فوري</h3>' +
        '<p>احسب الوقت المتبقي وهل الحجز متاح الآن</p>' +
        '<span class="card-arrow"><i class="fa-solid fa-arrow-left"></i></span>' +
      '</div>' +
    '</div>';
  document.getElementById('app').innerHTML = html;
}

function showSection(key){
  clearToolTimers();
  const sec = DB.sections[key];
  if(!sec){ goHome(); return; }
  state = { view:'section', sectionKey:key, iconId:null };
  renderBreadcrumb();
  let html = '<section class="section-head glass fade-in"><div class="sec-emoji">' + (sec.emoji || '📁') + '</div><h2>' + esc(sec.title) + '</h2></section><div class="cards-grid">';
  (sec.icons || []).forEach(function(icon){
    html +=
      '<div class="card fade-in" onclick="showIcon(\'' + key + '\',\'' + icon.id + '\')">' +
        '<div class="card-emoji">' + (icon.emoji || '📄') + '</div>' +
        '<h3>' + esc(icon.title) + '</h3>' +
        '<p>' + (icon.tables || []).length + ' جدول • ' + (icon.pages || []).length + ' صفحة</p>' +
        '<span class="card-arrow"><i class="fa-solid fa-arrow-left"></i></span>' +
      '</div>';
  });
  html += '</div>';
  document.getElementById('app').innerHTML = html;
  window.scrollTo({ top:0, behavior:'smooth' });
}

function showIcon(sectionKey, iconId){
  clearToolTimers();
  const sec = DB.sections[sectionKey];
  const icon = sec && (sec.icons || []).find(function(i){ return i.id === iconId; });
  if(!icon){ goHome(); return; }
  state = { view:'icon', sectionKey:sectionKey, iconId:iconId };
  renderBreadcrumb();
  let html = '<section class="icon-head glass fade-in"><h2>' + (icon.emoji || '') + ' ' + esc(icon.title) + '</h2></section>';
  const tables = icon.tables || [];
  const pages = icon.pages || [];
  if(!tables.length && !pages.length){
    html += '<div class="empty glass">لا يوجد محتوى بعد — الأدمن يضيف الجداول والصفحات من لوحة التحكم.</div>';
  }
  tables.forEach(function(t){ html += renderTableView(t); });
  pages.forEach(function(p){ html += renderPageView(p); });
  html += '<div class="back-row"><button class="btn ghost" onclick="showSection(\'' + sectionKey + '\')"><i class="fa-solid fa-arrow-right"></i> رجوع للقسم</button></div>';
  document.getElementById('app').innerHTML = html;
  window.scrollTo({ top:0, behavior:'smooth' });
}

/* ================= عرض الجداول والصفحات ================= */
function renderTableView(t){
  let html =
    '<div class="table-wrap glass fade-in">' +
      '<div class="table-title"><i class="fa-solid fa-table-list"></i> ' + esc(t.title || '') + '</div>' +
      '<div class="scroll-x"><table class="fancy">';
  const gr = t.groupRow || [];
  const hasGroups = gr.some(function(g){ return (g || '').trim(); });
  html += '<thead>';
  if(hasGroups){
    html += '<tr class="group-row">';
    let i = 0;
    while(i < t.columns.length){
      const g = (gr[i] || '').trim();
      let span = 1, j = i + 1;
      while(j < t.columns.length && !(gr[j] || '').trim()){ span++; j++; }
      html += '<th colspan="' + span + '"' + (g ? '' : ' class="grp-empty"') + '>' + (g ? esc(g) : '') + '</th>';
      i = j;
    }
    html += '</tr>';
  }
  html += '<tr class="cols-row">';
  t.columns.forEach(function(c){ html += '<th>' + (esc(c) || '—') + '</th>'; });
  html += '</tr></thead><tbody>';
  if(!t.rows.length){
    html += '<tr><td class="empty-cell" colspan="' + t.columns.length + '">لا توجد بيانات بعد — الأدمن يضيفها من لوحة التحكم</td></tr>';
  } else {
    t.rows.forEach(function(r){
      html += '<tr>';
      t.columns.forEach(function(c, ci){ html += '<td>' + (esc(r[ci]) || '—') + '</td>'; });
      html += '</tr>';
    });
  }
  html += '</tbody></table></div></div>';
  return html;
}

function renderPageView(p){
  return '<div class="page-box glass fade-in">' +
    (p.title ? '<h3 class="page-title">' + esc(p.title) + '</h3>' : '') +
    '<div class="page-text">' + esc(p.text || '').replace(/\n/g, '<br>') + '</div>' +
  '</div>';
}

/* ================= أداة صلاحية كود فوري ================= */
function showTool(){
  state = { view:'tool', sectionKey:null, iconId:null };
  renderBreadcrumb();
  document.getElementById('app').innerHTML =
    '<section class="tool-hero glass fade-in">' +
      '<h2><i class="fa-regular fa-clock"></i> صلاحية كود فوري</h2>' +
      '<p class="note">' + esc(DB.settings.toolNote || '') + '</p>' +
      '<div class="now-bar">الساعة الآن (نظام 24): <b id="ctNow">--:--:--</b></div>' +
      '<div class="tool-grid">' +
        '<label>تاريخ الرحلة <input type="date" id="ctDate"></label>' +
        '<label>ساعة الرحلة (نظام 24) <input type="time" id="ctTime"></label>' +
        '<label>مسافة الرحلة (كم) — اختيارى <input type="number" id="ctDist" min="0" placeholder="مثال: 350"></label>' +
        '<label>متوسط السرعة (كم/س) — اختيارى <input type="number" id="ctSpeed" min="1" value="80"></label>' +
      '</div>' +
      '<button class="btn primary big" onclick="runCodeTool()"><i class="fa-solid fa-bolt"></i> احسب صلاحية الحجز</button>' +
      '<div id="ctResult" class="ct-result" hidden></div>' +
    '</section>';
  clearInterval(window.__ctTimer);
  clearInterval(window.__ctNowTimer);
  tickNow();
  window.__ctNowTimer = setInterval(tickNow, 1000);
  window.scrollTo({ top:0, behavior:'smooth' });
}

function tickNow(){
  const el = document.getElementById('ctNow');
  if(!el) return;
  el.textContent = new Date().toLocaleTimeString('ar-EG', { hour12:false });
}

function runCodeTool(){
  const date = document.getElementById('ctDate').value;
  const time = document.getElementById('ctTime').value;
  const dist = parseFloat(document.getElementById('ctDist').value);
  const speed = parseFloat(document.getElementById('ctSpeed').value) || 80;
  const box = document.getElementById('ctResult');

  if(!date || !time){ showToast('من فضلك اكتب التاريخ والساعة أولًا', 'warn'); box.hidden = true; return; }
  const target = new Date(date + 'T' + time + ':00');
  if(isNaN(target.getTime())){ showToast('صيغة التاريخ/الساعة غير صحيحة', 'error'); return; }

  clearInterval(window.__ctTimer);
  const render = function(){
    const now = new Date();
    const diff = target - now;
    if(diff <= 0){
      box.innerHTML = '<div class="alert danger pulse"><i class="fa-solid fa-ban"></i> موعد الرحلة وصل أو انتهى — لا يمكن الحجز.</div>';
      box.hidden = false;
      clearInterval(window.__ctTimer);
      return;
    }
    const totalSec = Math.floor(diff / 1000);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    const remainStr = (days > 0 ? days + ' يوم و ' : '') + hours + ' ساعة : ' + mins + ' دقيقة : ' + secs + ' ثانية';
    const allowed = diff >= (4 * 60 * 60 * 1000); /* 4 ساعات */

    let html = '<div class="countdown">المتبقى حتى موعد الرحلة: <b>' + remainStr + '</b></div>';
    if(allowed){
      html += '<div class="alert success"><i class="fa-solid fa-circle-check"></i> الحجز متاح الآن ✅ — المتبقى قبل الرحلة أكثر من 4 ساعات.</div>';
    } else {
      html += '<div class="alert danger pulse"><i class="fa-solid fa-triangle-exclamation"></i> الحجز غير متاح ⛔ — المتبقى قبل الرحلة أقل من 4 ساعات.</div>';
    }
    if(!isNaN(dist) && dist > 0){
      const arrive = new Date(target.getTime() + (dist / speed) * 3600000);
      html += '<div class="extra-info">مدة الرحلة التقديرية بسرعة ' + speed + ' كم/س: <b>' + (dist / speed).toFixed(1) + '</b> ساعة — الوصول المتوقع: <b>' + arrive.toLocaleString('ar-EG', { hour12:false }) + '</b></div>';
    }
    box.innerHTML = html;
    box.hidden = false;
  };
  render();
  window.__ctTimer = setInterval(render, 1000);
  showToast('تم الحساب بنجاح', 'success');
}