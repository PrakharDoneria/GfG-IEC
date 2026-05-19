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
  document.addEventListener('keydown', e => { if(e.key==='Escape') closeModal(); });

  /* MOBILE MENU */
  function toggleMenu() { document.getElementById('mobileMenu').classList.toggle('open'); }

  /* time updation every second */
const seminarStart = new Date('2026-02-27T10:00:00');
const seminarEnd   = new Date('2026-02-27T12:00:00');

  function pad(n) { return String(Math.max(0,n)).padStart(2,'0'); }

  function tick() {
    const now = Date.now();
    let target, label, sub;

    if (now < seminarStart.getTime()) {
      target = seminarStart.getTime();
      label  = '📚 Seminar Starts In';
      sub    = '27 Feb 2026, 10:00 AM IST';
    } else if (now < seminarEnd.getTime()) {
      target = seminarEnd.getTime();
      label  = '🟢 Session Live — Ends In';
      sub    = '27 Feb 2026, 12:00 PM IST';
    } else {
      document.getElementById('cdLabel').textContent = '🎉 Workshop Complete!';
      document.getElementById('cdSub').textContent   = 'Thank you for attending!';
      ['cD','cH','cM','cS'].forEach(id => document.getElementById(id).textContent = '00');
      return;
    }

    document.getElementById('cdLabel').textContent = label;
    document.getElementById('cdSub').textContent   = sub;

    const diff = Math.max(0, target - now);
    document.getElementById('cD').textContent = pad(Math.floor(diff / 86400000));
    document.getElementById('cH').textContent = pad(Math.floor((diff % 86400000) / 3600000));
    document.getElementById('cM').textContent = pad(Math.floor((diff % 3600000)  / 60000));
    document.getElementById('cS').textContent = pad(Math.floor((diff % 60000)    / 1000));
  }

  tick();
  setInterval(tick, 1000); // updates every second — live!