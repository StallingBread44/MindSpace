document.addEventListener('DOMContentLoaded', () => {

  const option3Link = document.querySelector('#your-option3-link');
  if (option3Link) {
    option3Link.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.getElementById('option3');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function (e) {
      const id = this.getAttribute('href').slice(1);
      const el = document.getElementById(id);
      if (!el) return;

      e.preventDefault();

      const headerHeight =
        document.querySelector('.navbar')?.offsetHeight || 0;

      const targetY =
        el.getBoundingClientRect().top +
        window.scrollY -
        headerHeight -
        12;

      window.scrollTo({
        top: targetY,
        behavior: 'smooth'
      });
    });
  });

});
