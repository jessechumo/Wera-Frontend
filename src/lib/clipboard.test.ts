import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyText } from './clipboard';

describe('copyText', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('uses the clipboard when the page has one', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    await expect(copyText('hello')).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('hello');
  });

  it('works on plain http, where browsers offer no clipboard', async () => {
    vi.stubGlobal('navigator', {});
    let selected = '';
    document.execCommand = vi.fn(() => {
      selected = (document.activeElement as HTMLTextAreaElement | null)?.value ?? '';
      return true;
    });
    await expect(copyText('hello')).resolves.toBe(true);
    expect(selected).toBe('hello');
    expect(document.querySelector('textarea')).toBeNull();
  });

  it('reports a copy that failed', async () => {
    vi.stubGlobal('navigator', {});
    document.execCommand = vi.fn(() => false);
    await expect(copyText('hello')).resolves.toBe(false);
  });
});
