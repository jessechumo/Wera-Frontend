/**
 * Copies text and reports whether it worked. Browsers offer
 * navigator.clipboard only on https and localhost, and the home server's
 * dashboard is plain http, so the older way stays as the fallback.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // refused: try the older way
  }
  const before = document.activeElement as HTMLElement | null;
  const box = Object.assign(document.createElement('textarea'), { value: text });
  box.style.position = 'fixed';
  box.style.opacity = '0';
  document.body.appendChild(box);
  box.focus();
  box.select();
  const ok = document.execCommand('copy');
  box.remove();
  before?.focus();
  return ok;
}
