/* ================= لوحة الأدمن ================= */
let adminState = { view:'section', sectionKey:null, iconId:null };

document.addEventListener('DOMContentLoaded', initAdmin);

function initAdmin(){
  if(sessionStorage.getItem('cp_admin') === '1') openPanel();
  else showLogin();
}

/* ---------- الدخول ---------- */
function showLogin(){
  document.getElementById('loginView').hidden = false;
  document.getElementById('panelView').hidden = true;
}
function adminLogin(e){
  e.preventDefault();
  const u = document.getElementById('adUser').value.trim();
  const p = document.getElementById('adPass').value;
  if(u === DB.settings.adminUser && p === DB.settings.adminPass){
    sessionStorage.setItem('cp_admin', '1');
    openPanel();
    showToast('أهلاً بك يا أدمن 👑', 'success');
  } else {
    showToast('اسم المستخدم أو كلمة المرور غير صحيحة', 'error');
  }
}
function adminLogout(){
  sessionStorage.removeItem('cp_admin');
  showLogin();
}
function openPanel(){
  document.getElementById('loginView').hidden = true;
  document.getElementById('panelView').hidden = false;
  renderMenu();
  if(adminState.view === 'settings') renderSettingsContent();
  else if(adminState.view === 'icon' && adminState.sectionKey && adminState.iconId) renderIconContent();
  else if(adminState.sectionKey) renderSectionContent();
  else showSectionAdmin(Object.keys(DB.sections)[0]);
}

/* ---------- القوائم ---------- */
function renderMenu(){
  let html = '<a class="menu-item" href="index.html" target="_blank"><span>🌐</span> فتح الموقع الرئيسي</a>';
  for(const key of Object.keys(DB.sections)){
    const sec = DB.sections[key];
    const active = (adminState.view !== 'settings' && adminState.sectionKey === key) ? 'active' : '';
    html += '<button class="menu-item ' + active + '" onclick="showSectionAdmin(\'' + key + '\')"><span>' + (sec.emoji || '📁') + '</span> ' + esc(sec.title) + '</button>';
  }
  html += '<button class="menu-item ' + (adminState.view === 'settings' ? 'active' : '') + '" onclick="showSettingsAdmin()"><span>⚙️</span> الإعدادات واللوجو</button>';
  html += '<button class="menu-item logout" onclick="adminLogout()"><span>🚪</span> تسجيل خروج</button>';
  document.getElementById('adminMenu').innerHTML = html;
}

function showSectionAdmin(key){
  adminState = { view:'section', sectionKey:key, iconId:null };
  renderMenu();
  renderSectionContent();
}
function showIconAdmin(sk, iid){
  adminState = { view:'icon', sectionKey:sk, iconId:iid };
  renderMenu();
  renderIconContent();
}
function showSettingsAdmin(){
  adminState = { view:'settings', sectionKey:null, iconId:null };
  renderMenu();
  renderSettingsContent();
}

/* ---------- أدوات مساعدة ---------- */
function findIcon(sk, iid){
  const sec = DB.sections[sk];
  return sec && sec.icons.find(function(i){ return i.id === iid; });
}
function findTable(icon, tid){
  return (icon.tables || []).find(function(t){ return t.id === tid; });
}

/* ---------- تحرير القسم الرئيسي ---------- */
function renderSectionContent(){
  const key = adminState.sectionKey;
  const sec = DB.sections[key];
  let html =
    '<div class="editor glass">' +
      '<h3><i class="fa-solid fa-pen"></i> بيانات القسم الرئيسي</h3>' +
      '<div class="inline-grid">' +
        '<label>عنوان القسم <input value="' + esc(sec.title) + '" oninput="DB.sections[\'' + key + '\'].title=this.value; saveDB(); renderMenu();"></label>' +
        '<label>الإيموجي <input value="' + esc(sec.emoji || '') + '" oninput="DB.sections[\'' + key + '\'].emoji=this.value; saveDB(); renderMenu();"></label>' +
      '</div>' +
    '</div>' +
    '<h3 class="area-title"><i class="fa-solid fa-layer-group"></i> الأيقونات داخل «' + esc(sec.title) + '»</h3>' +
    '<div class="icons-manage">';
  (sec.icons || []).forEach(function(icon){
    html +=
      '<div class="icon-row glass">' +
        '<span class="ir-emoji">' + (icon.emoji || '📄') + '</span>' +
        '<b class="ir-title">' + esc(icon.title) + '</b>' +
        '<small>' + (icon.tables || []).length + ' جدول • ' + (icon.pages || []).length + ' صفحة</small>' +
        '<div class="ir-actions">' +
          '<button class="btn primary sm" onclick="showIconAdmin(\'' + key + '\',\'' + icon.id + '\')"><i class="fa-solid fa-sliders"></i> تعديل المحتوى</button>' +
          '<button class="btn danger sm" onclick="deleteIcon(\'' + key + '\',\'' + icon.id + '\')"><i class="fa-solid fa-trash"></i> حذف</button>' +
        '</div>' +
      '</div>';
  });
  html +=
    '</div>' +
    '<div class="editor glass">' +
      '<h3><i class="fa-solid fa-plus"></i> إضافة أيقونة جديدة</h3>' +
      '<div class="inline-grid">' +
        '<label>عنوان الأيقونة <input id="newIconTitle" placeholder="مثال: مكاتب أتوبيسي"></label>' +
        '<label>الإيموجي <input id="newIconEmoji" placeholder="🏢"></label>' +
      '</div>' +
      '<button class="btn primary" onclick="addIcon(\'' + key + '\')">إضافة الأيقونة</button>' +
    '</div>';
  document.getElementById('adminContent').innerHTML = html;
}

function addIcon(key){
  const t = document.getElementById('newIconTitle').value.trim();
  const e = document.getElementById('newIconEmoji').value.trim() || '📄';
  if(!t){ showToast('اكتب عنوان الأيقونة', 'warn'); return; }
  DB.sections[key].icons.push({ id: uid(), title: t, emoji: e, tables: [], pages: [] });
  saveDB();
  showToast('تمت إضافة الأيقونة', 'success');
  renderSectionContent();
}
function deleteIcon(key, iconId){
  if(!confirm('متأكد من حذف هذه الأيقونة وكل محتواها؟')) return;
  const sec = DB.sections[key];
  sec.icons = sec.icons.filter(function(i){ return i.id !== iconId; });
  saveDB();
  showToast('تم الحذف', 'success');
  renderSectionContent();
}

/* ---------- تحرير محتوى الأيقونة ---------- */
function renderIconContent(){
  const sk = adminState.sectionKey, iid = adminState.iconId;
  const icon = findIcon(sk, iid);
  if(!icon){ showSectionAdmin(sk); return; }
  let html =
    '<div class="editor glass">' +
      '<h3>' + (icon.emoji || '') + ' ' + esc(icon.title) + '</h3>' +
      '<div class="inline-grid">' +
        '<label>عنوان الأيقونة <input value="' + esc(icon.title) + '" oninput="setIconMeta(\'' + sk + '\',\'' + iid + '\',\'title\',this.value)"></label>' +
        '<label>الإيموجي <input value="' + esc(icon.emoji || '') + '" oninput="setIconMeta(\'' + sk + '\',\'' + iid + '\',\'emoji\',this.value)"></label>' +
      '</div>' +
      '<button class="btn ghost sm" onclick="showSectionAdmin(\'' + sk + '\')"><i class="fa-solid fa-arrow-right"></i> رجوع لأيقونات القسم</button>' +
    '</div>';

  html += '<h3 class="area-title"><i class="fa-solid fa-table"></i> الجداول</h3>';
  (icon.tables || []).forEach(function(t){ html += renderTableEditor(sk, iid, t); });
  html += '<div class="editor glass add-bar"><button class="btn primary" onclick="addTable(\'' + sk + '\',\'' + iid + '\')"><i class="fa-solid fa-plus"></i> إضافة جدول جديد</button></div>';

  html += '<h3 class="area-title"><i class="fa-solid fa-file-lines"></i> الصفحات النصية</h3>';
  (icon.pages || []).forEach(function(p){ html += renderPageEditor(sk, iid, p); });
  html += '<div class="editor glass add-bar"><button class="btn primary" onclick="addPage(\'' + sk + '\',\'' + iid + '\')"><i class="fa-solid fa-plus"></i> إضافة صفحة نصية</button></div>';

  document.getElementById('adminContent').innerHTML = html;
}

function setIconMeta(sk, iid, field, value){
  const ic = findIcon(sk, iid);
  if(!ic) return;
  ic[field] = value;
  saveDB();
  renderMenu();
}

/* ---------- محرر الجدول ---------- */
function renderTableEditor(sk, iid, t){
  let html =
    '<div class="editor glass">' +
      '<div class="te-head">' +
        '<label>عنوان الجدول <input value="' + esc(t.title) + '" oninput="setTableTitle(\'' + sk + '\',\'' + iid + '\',\'' + t.id + '\',this.value)"></label>' +
        '<button class="btn danger sm" onclick="deleteTable(\'' + sk + '\',\'' + iid + '\',\'' + t.id + '\')"><i class="fa-solid fa-trash"></i> حذف الجدول</button>' +
      '</div>' +
      '<h4>الأعمدة (' + t.columns.length + ')</h4>' +
      '<div class="cols-wrap">';
  t.columns.forEach(function(col, ci){
    html +=
      '<div class="col-item">' +
        '<input value="' + esc(col) + '" oninput="renameColumn(\'' + sk + '\',\'' + iid + '\',\'' + t.id + '\',' + ci + ',this.value)">' +
        '<button class="btn danger sm" onclick="deleteColumn(\'' + sk + '\',\'' + iid + '\',\'' + t.id + '\',' + ci + ')" title="حذف العمود"><i class="fa-solid fa-xmark"></i></button>' +
      '</div>';
  });
  html +=
      '</div>' +
      '<button class="btn ghost sm" onclick="addColumn(\'' + sk + '\',\'' + iid + '\',\'' + t.id + '\')"><i class="fa-solid fa-plus"></i> إضافة عمود</button>' +
      '<h4>صف الرؤوس المدمجة (اختيارى)</h4>' +
      '<p class="hint">اكتب عناوين المجموعات مفصولة بعلامة | وبنفس عدد الأعمدة (' + t.columns.length + ') — اتركها فارغة لتدمج مع العمود السابق. مثال: طريقة الحجز|طريقة الدفع|التعديل|||الإلغاء|||</p>' +
      '<input class="wide" value="' + esc((t.groupRow || []).join('|')) + '" oninput="setGroupRow(\'' + sk + '\',\'' + iid + '\',\'' + t.id + '\',this.value)">' +
      '<h4>الصفوف (' + t.rows.length + ')</h4>' +
      '<div class="scroll-x"><table class="edit-grid"><thead><tr><th>#</th>';
  t.columns.forEach(function(col){ html += '<th>' + (esc(col) || '—') + '</th>'; });
  html += '<th>إجراءات</th></tr></thead><tbody>';
  if(!t.rows.length){
    html += '<tr><td class="empty-cell" colspan="' + (t.columns.length + 2) + '">لا توجد صفوف — اضغط «إضافة صف»</td></tr>';
  }
  t.rows.forEach(function(row, ri){
    html += '<tr><td class="rownum">' + (ri + 1) + '</td>';
    row.forEach(function(cell, ci){
      html += '<td><input value="' + esc(cell) + '" oninput="updateCell(\'' + sk + '\',\'' + iid + '\',\'' + t.id + '\',' + ri + ',' + ci + ',this.value)"></td>';
    });
    html +=
      '<td class="actions-cell">' +
        '<button class="btn ghost sm" onclick="moveRow(\'' + sk + '\',\'' + iid + '\',\'' + t.id + '\',' + ri + ',-1)" title="لأعلى"><i class="fa-solid fa-angle-up"></i></button>' +
        '<button class="btn ghost sm" onclick="moveRow(\'' + sk + '\',\'' + iid + '\',\'' + t.id + '\',' + ri + ',1)" title="لأسفل"><i class="fa-solid fa-angle-down"></i></button>' +
        '<button class="btn danger sm" onclick="deleteRow(\'' + sk + '\',\'' + iid + '\',\'' + t.id + '\',' + ri + ')"><i class="fa-solid fa-trash"></i></button>' +
      '</td></tr>';
  });
  html +=
      '</tbody></table></div>' +
      '<button class="btn primary sm" onclick="addRow(\'' + sk + '\',\'' + iid + '\',\'' + t.id + '\')"><i class="fa-solid fa-plus"></i> إضافة صف</button>' +
    '</div>';
  return html;
}

function setTableTitle(sk, iid, tid, val){
  const icon = findIcon(sk, iid); if(!icon) return;
  const t = findTable(icon, tid); if(!t) return;
  t.title = val; saveDB();
}
function addTable(sk, iid){
  const icon = findIcon(sk, iid); if(!icon) return;
  icon.tables.push({ id: uid(), title: 'جدول جديد', columns: ['عمود 1','عمود 2'], rows: [], groupRow: [] });
  saveDB(); renderIconContent();
}
function deleteTable(sk, iid, tid){
  if(!confirm('متأكد من حذف هذا الجدول؟')) return;
  const icon = findIcon(sk, iid); if(!icon) return;
  icon.tables = icon.tables.filter(function(t){ return t.id !== tid; });
  saveDB(); renderIconContent();
}
function addColumn(sk, iid, tid){
  const icon = findIcon(sk, iid); if(!icon) return;
  const t = findTable(icon, tid); if(!t) return;
  t.columns.push('');
  t.rows.forEach(function(r){ r.push(''); });
  t.groupRow.push('');
  saveDB(); renderIconContent();
}
function renameColumn(sk, iid, tid, ci, val){
  const icon = findIcon(sk, iid); if(!icon) return;
  const t = findTable(icon, tid); if(!t) return;
  t.columns[ci] = val; saveDB();
}
function deleteColumn(sk, iid, tid, ci){
  const icon = findIcon(sk, iid); if(!icon) return;
  const t = findTable(icon, tid); if(!t) return;
  if(t.columns.length <= 1){ showToast('لا يمكن حذف العمود الأخير', 'warn'); return; }
  t.columns.splice(ci, 1);
  t.rows.forEach(function(r){ r.splice(ci, 1); });
  if(t.groupRow) t.groupRow.splice(ci, 1);
  saveDB(); renderIconContent();
}
function setGroupRow(sk, iid, tid, value){
  const icon = findIcon(sk, iid); if(!icon) return;
  const t = findTable(icon, tid); if(!t) return;
  const arr = value.split('|').map(function(s){ return s.trim(); });
  while(arr.length < t.columns.length) arr.push('');
  t.groupRow = arr.slice(0, t.columns.length);
  saveDB();
}
function addRow(sk, iid, tid){
  const icon = findIcon(sk, iid); if(!icon) return;
  const t = findTable(icon, tid); if(!t) return;
  t.rows.push(t.columns.map(function(){ return ''; }));
  saveDB(); renderIconContent();
}
function deleteRow(sk, iid, tid, ri){
  const icon = findIcon(sk, iid); if(!icon) return;
  const t = findTable(icon, tid); if(!t) return;
  t.rows.splice(ri, 1);
  saveDB(); renderIconContent();
}
function moveRow(sk, iid, tid, ri, dir){
  const icon = findIcon(sk, iid); if(!icon) return;
  const t = findTable(icon, tid); if(!t) return;
  const ni = ri + dir;
  if(ni < 0 || ni >= t.rows.length) return;
  const tmp = t.rows[ri]; t.rows[ri] = t.rows[ni]; t.rows[ni] = tmp;
  saveDB(); renderIconContent();
}
function updateCell(sk, iid, tid, ri, ci, val){
  const icon = findIcon(sk, iid); if(!icon) return;
  const t = findTable(icon, tid); if(!t || !t.rows[ri]) return;
  t.rows[ri][ci] = val; saveDB();
}

/* ---------- الصفحات النصية ---------- */
function renderPageEditor(sk, iid, p){
  return '<div class="editor glass">' +
    '<div class="te-head">' +
      '<label>عنوان الصفحة <input value="' + esc(p.title) + '" oninput="setPageMeta(\'' + sk + '\',\'' + iid + '\',\'' + p.id + '\',\'title\',this.value)"></label>' +
      '<button class="btn danger sm" onclick="deletePage(\'' + sk + '\',\'' + iid + '\',\'' + p.id + '\')"><i class="fa-solid fa-trash"></i> حذف الصفحة</button>' +
    '</div>' +
    '<textarea rows="10" placeholder="اكتب كل التفاصيل هنا... (يدعم أسطر متعددة)" oninput="setPageMeta(\'' + sk + '\',\'' + iid + '\',\'' + p.id + '\',\'text\',this.value)">' + esc(p.text || '') + '</textarea>' +
  '</div>';
}
function setPageMeta(sk, iid, pid, field, value){
  const icon = findIcon(sk, iid); if(!icon) return;
  const page = (icon.pages || []).find(function(p){ return p.id === pid; });
  if(!page) return;
  page[field] = value; saveDB();
}
function addPage(sk, iid){
  const icon = findIcon(sk, iid); if(!icon) return;
  icon.pages.push({ id: uid(), title: 'صفحة جديدة', text: '' });
  saveDB(); renderIconContent();
}
function deletePage(sk, iid, pid){
  if(!confirm('متأكد من حذف هذه الصفحة؟')) return;
  const icon = findIcon(sk, iid); if(!icon) return;
  icon.pages = icon.pages.filter(function(p){ return p.id !== pid; });
  saveDB(); renderIconContent();
}

/* ---------- الإعدادات ---------- */
function renderSettingsContent(){
  const s = DB.settings;
  document.getElementById('adminContent').innerHTML =
    '<div class="editor glass">' +
      '<h3><i class="fa-solid fa-gear"></i> إعدادات الموقع</h3>' +
      '<div class="inline-grid">' +
        '<label>اسم الموقع <input id="stName" value="' + esc(s.siteName) + '"></label>' +
        '<label>الوصف تحت الاسم <input id="stTag" value="' + esc(s.siteTagline || '') + '"></label>' +
      '</div>' +
      '<label class="block">ملاحظة أداة الكود الفوري <textarea id="stNote" rows="3">' + esc(s.toolNote || '') + '</textarea></label>' +
      '<button class="btn primary" onclick="saveSettingsText()">حفظ الإعدادات</button>' +
    '</div>' +
    '<div class="editor glass">' +
      '<h3><i class="fa-solid fa-image"></i> لوجو الشركة</h3>' +
      '<div class="logo-zone">' +
        '<div class="logo-preview">' + (s.logo ? '<img src="' + esc(s.logo) + '">' : '<span>لا يوجد لوجو</span>') + '</div>' +
        '<div>' +
          '<input type="file" id="logoFile" accept="image/*" onchange="uploadLogo(this)">' +
          '<p class="hint">الأفضل صورة صغيرة (أقل من 300KB) بصيغة PNG بخلفية شفافة.</p>' +
          '<button class="btn danger sm" onclick="removeLogo()">إزالة اللوجو</button>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="editor glass">' +
      '<h3><i class="fa-solid fa-user-shield"></i> بيانات دخول الأدمن</h3>' +
      '<div class="inline-grid">' +
        '<label>اسم المستخدم <input id="stUser" value="' + esc(s.adminUser) + '"></label>' +
        '<label>كلمة المرور <input id="stPass" value="' + esc(s.adminPass) + '"></label>' +
      '</div>' +
      '<button class="btn primary" onclick="saveCreds()">حفظ بيانات الدخول</button>' +
      '<p class="hint">تنبيه: هذه حماية بسيطة داخل المتصفح للنموذج — للحماية الحقيقية تحتاج سيرفر (Backend).</p>' +
    '</div>' +
    '<div class="editor glass">' +
      '<h3><i class="fa-solid fa-database"></i> النسخ الاحتياطي</h3>' +
      '<div class="btn-row">' +
        '<button class="btn primary" onclick="exportData()"><i class="fa-solid fa-download"></i> تصدير نسخة (JSON)</button>' +
        '<label class="btn ghost file-btn"><i class="fa-solid fa-upload"></i> استيراد نسخة <input type="file" id="importFile" accept="application/json" onchange="importData(this)"></label>' +
        '<button class="btn danger" onclick="resetData()"><i class="fa-solid fa-rotate-left"></i> استعادة البيانات الافتراضية</button>' +
      '</div>' +
    '</div>';
}
function saveSettingsText(){
  DB.settings.siteName = document.getElementById('stName').value.trim() || 'بوابة الشركة';
  DB.settings.siteTagline = document.getElementById('stTag').value.trim();
  DB.settings.toolNote = document.getElementById('stNote').value;
  saveDB();
  showToast('تم حفظ الإعدادات — افتح الموقع الرئيسي لترى التغييرات', 'success');
}
function uploadLogo(input){
  const f = input.files && input.files[0];
  if(!f) return;
  if(f.size > 600 * 1024){ showToast('حجم الصورة كبير (أكثر من 600KB) — اختر صورة أصغر', 'warn'); input.value = ''; return; }
  const reader = new FileReader();
  reader.onload = function(e){
    DB.settings.logo = e.target.result;
    saveDB();
    showToast('تم تحديث اللوجو', 'success');
    renderSettingsContent();
  };
  reader.readAsDataURL(f);
}
function removeLogo(){ DB.settings.logo = ''; saveDB(); renderSettingsContent(); }
function saveCreds(){
  const u = document.getElementById('stUser').value.trim();
  const p = document.getElementById('stPass').value;
  if(!u || !p){ showToast('اكتب اسم المستخدم وكلمة المرور', 'warn'); return; }
  DB.settings.adminUser = u;
  DB.settings.adminPass = p;
  saveDB();
  showToast('تم حفظ بيانات الدخول', 'success');
}
function exportData(){
  const blob = new Blob([JSON.stringify(DB, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'company-portal-backup.json';
  a.click();
  URL.revokeObjectURL(a.href);
}
function importData(input){
  const f = input.files && input.files[0];
  if(!f) return;
  const reader = new FileReader();
  reader.onload = function(e){
    try{
      const parsed = JSON.parse(e.target.result);
      if(!parsed || !parsed.sections) throw new Error('صيغة غير صحيحة');
      DB = parsed;
      saveDB();
      showToast('تم الاستيراد بنجاح', 'success');
      setTimeout(function(){ location.reload(); }, 800);
    }catch(err){
      showToast('الملف غير صالح: ' + err.message, 'error');
    }
  };
  reader.readAsText(f);
}
function resetData(){
  if(!confirm('سيتم مسح كل التعديلات والعودة للبيانات الافتراضية. متأكد؟')) return;
  DB = clone(DEFAULT_DB);
  saveDB();
  location.reload();
}