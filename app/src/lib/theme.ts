/** Follow the OS light/dark preference (the design system ships both themes). */
export function startThemeSync() {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const apply = () => {
    if (mq.matches) document.documentElement.setAttribute("data-pp-theme", "dark");
    else document.documentElement.removeAttribute("data-pp-theme");
  };
  apply();
  mq.addEventListener("change", apply);
}
