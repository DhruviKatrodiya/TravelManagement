export function scrollAdminContentTop(): void {
  setTimeout(() => {
    const el = document.querySelector('.admin-shell .content');
    if (el) {
      el.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, 0);
}
