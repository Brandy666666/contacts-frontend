// ...existing code...
document.addEventListener('DOMContentLoaded', () => {
  const listEl = document.getElementById('contact-list');
  const form = document.getElementById('add-form');

  // 在表单下方插入错误提示容器（复用）
  let errEl = document.createElement('div');
  errEl.className = 'error-message';
  errEl.id = 'form-error';
  form.insertAdjacentElement('afterend', errEl);

  function showError(msg) {
    errEl.textContent = msg;
    errEl.classList.add('visible');
    setTimeout(() => errEl.classList.remove('visible'), 5000);
  }
  function clearError() {
    errEl.textContent = '';
    errEl.classList.remove('visible');
  }

  async function fetchContacts() {
    try {
      const res = await fetch('/api/contacts');
      if (!res.ok) throw new Error('无法获取联系人');
      return await res.json();
    } catch (e) {
      showError('加载失败：' + e.message);
      return [];
    }
  }

  function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, (m)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]); }

  function renderTable(contacts) {
    if (!contacts || contacts.length === 0) {
      listEl.innerHTML = `<div class="empty">暂无联系人</div>`;
      return;
    }
    const rows = contacts.map(c => `
      <tr data-id="${c.id}">
        <td>
          <div class="name-cell">
            <div class="avatar">${escapeHtml((c.name||'').trim().charAt(0).toUpperCase() || '?')}</div>
            <div>
              <div style="font-weight:600">${escapeHtml(c.name)}</div>
              <div style="color:var(--muted);font-size:0.85rem">${escapeHtml(c.phone)}</div>
            </div>
          </div>
        </td>
        <td>${escapeHtml(c.phone)}</td>
        <td style="width:120px">
          <button class="btn delete" data-id="${c.id}">删除</button>
        </td>
      </tr>`).join('');

    listEl.innerHTML = `
      <table class="contact-table" aria-label="通讯录表格">
        <thead>
          <tr><th>姓名</th><th>电话</th><th>操作</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
    attachDeleteHandlers();
  }

  function attachDeleteHandlers() {
    listEl.querySelectorAll('button.delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        if (!confirm('确定删除该联系人？')) return;
        try {
          const res = await fetch('/api/contacts/' + encodeURIComponent(id), { method: 'DELETE' });
          if (!res.ok && res.status !== 204) throw new Error('删除失败');
          await refresh();
        } catch (err) {
          showError('删除失败：' + err.message);
        }
      });
    });
  }

  async function refresh() {
    clearError();
    const contacts = await fetchContacts();
    renderTable(contacts);
  }

  function validatePhone(phone){
    const digits = (phone||'').replace(/\D/g,'');
    if (digits.length < 3) return { ok:false, msg:'电话号码至少需包含 3 位数字' };
    return { ok:true };
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();
    const fd = new FormData(form);
    const name = (fd.get('name')||'').trim();
    const phone = (fd.get('phone')||'').trim();
    if (!name) { showError('请填写姓名'); return; }
    const chk = validatePhone(phone);
    if (!chk.ok) { showError(chk.msg); return; }

    try {
      const res = await fetch('/api/contacts', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ name, phone })
      });
      if (!res.ok) throw new Error('添加失败');
      form.reset();
      await refresh();
    } catch (err) {
      showError('添加失败：' + err.message);
    }
  });

  // 初次加载
  refresh();
});
// ...existing code...