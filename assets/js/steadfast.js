// Steadfast demo: forms never leave the page. Catches every submit before Webflow's form handler and shows
// the form's own success message (.w-form-done), so the copied layout behaves like the live site.
document.addEventListener('submit', e => {
  const form = e.target;
  e.preventDefault();
  e.stopImmediatePropagation();
  const wrap = form.closest('.w-form') || form.parentElement;
  const done = wrap && wrap.querySelector('.w-form-done');
  if (done) { form.style.display = 'none'; done.style.display = 'block'; }
  form.reset();
}, true);
