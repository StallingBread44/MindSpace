document.querySelector('#your-option3-link').addEventListener('click', function(e){
  e.preventDefault();
  document.getElementById('option3').scrollIntoView({behavior:'smooth'});
});
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', function(e) {
    const id = this.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if(!el) return;
    e.preventDefault();
    const headerHeight = document.querySelector('.navbar')?.offsetHeight || 0; // adjust selector
    const targetY = el.getBoundingClientRect().top + window.scrollY - headerHeight - 12; // 12px gap
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  });
});
