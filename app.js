const icons = () => window.lucide && window.lucide.createIcons();

document.addEventListener('DOMContentLoaded', () => {
  icons();
  const modal = document.querySelector('#session-modal');
  const form = document.querySelector('#session-form');
  const success = document.querySelector('.form-success');
  const menu = document.querySelector('.menu-button');
  const nav = document.querySelector('#navigation');

  document.querySelectorAll('[data-open-modal]').forEach((button) => button.addEventListener('click', () => modal.showModal()));
  document.querySelectorAll('[data-close-modal]').forEach((button) => button.addEventListener('click', () => modal.close()));
  modal.addEventListener('click', (event) => { if (event.target === modal) modal.close(); });
  form.addEventListener('submit', (event) => {
    event.preventDefault(); form.hidden = true; success.hidden = false; icons();
  });
  menu.addEventListener('click', () => {
    const open = nav.classList.toggle('open'); menu.setAttribute('aria-expanded', String(open));
  });
  nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false');
  }));
});
