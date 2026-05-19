  /* TABS */
  function showTab(name, el) {
    document.querySelectorAll('[id^="tab-"]').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-' + name).style.display = 'block';
    el.classList.add('active');
  }

  /* MODAL */
  function openModal() { document.getElementById('modal').classList.add('open'); }
  function closeModal() { document.getElementById('modal').classList.remove('open'); }
  document.addEventListener('keydown', e => { if(e.key === 'Escape') closeModal(); });

  /* MOBILE MENU */
  function toggleMenu() {
    document.getElementById('mobileMenu').classList.toggle('open');
  }

  /* time updation every second */
  // milestones in UTC (IST = UTC+5:30)
  const milestones = [
    {
      label: '📋 Reg. Deadline In',
      sub:   '15 Mar 2026, 12:00 AM IST',
      utc:   new Date('2026-03-14T18:30:00Z')   // 15 Mar 00:00 IST
    },
    {
      label: '🎙️ Orientation In',
      sub:   '17 Mar 2026, 9:30 PM IST',
      utc:   new Date('2026-03-17T16:00:00Z')   // 17 Mar 21:30 IST
    },
    {
      label: '💡 Idea Submission In',
      sub:   '24 Mar 2026, 12:00 AM IST',
      utc:   new Date('2026-03-23T18:30:00Z')   // 24 Mar 00:00 IST
    },
    {
      label: '🏫 Offline Round In',
      sub:   '28 Mar 2026, 10:30 AM IST',
      utc:   new Date('2026-03-28T05:00:00Z')   // 28 Mar 10:30 IST
    },
    {
      label: '📤 Submission Closes In',
      sub:   '28 Mar 2026, 5:00 PM IST',
      utc:   new Date('2026-03-28T11:30:00Z')   // 28 Mar 17:00 IST
    },
    {
      label: '📝 GfG Connect Post Closes In',
      sub:   '30 Mar 2026, 12:05 AM IST',
      utc:   new Date('2026-03-29T18:35:00Z')   // 30 Mar 00:05 IST
    }
  ];

  function pad(n) { return String(Math.max(0, n)).padStart(2, '0'); }

  function tick() {
    const now = Date.now();
    let ms = null;
    for (let m of milestones) {
      if (m.utc.getTime() > now) { ms = m; break; }
    }

    if (!ms) {
      document.getElementById('cdLabel').textContent = '🎉 Hack-A-Geek 2026';
      document.getElementById('cdSub').textContent   = 'Event Complete!';
      ['cD','cH','cM','cS'].forEach(id => document.getElementById(id).textContent = '00');
      return;
    }

    document.getElementById('cdLabel').textContent = ms.label;
    document.getElementById('cdSub').textContent   = ms.sub;

    const diff = Math.max(0, ms.utc.getTime() - now);
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000)  / 60000);
    const s = Math.floor((diff % 60000)    / 1000);

    document.getElementById('cD').textContent = pad(d);
    document.getElementById('cH').textContent = pad(h);
    document.getElementById('cM').textContent = pad(m);
    document.getElementById('cS').textContent = pad(s);
  }

  tick();
  setInterval(tick, 1000); // time countdown