import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { options } from '../test/fixtures';
import { RoleFamilyPicker } from './RoleFamilyPicker';

function Harness({ start = [] as string[], flat = false }) {
  const [v, setV] = useState<string[]>(start);
  return (
    <>
      <RoleFamilyPicker fields={flat ? undefined : options.fields} families={options.role_families} value={v} onChange={setV} />
      <output>{v.join(',')}</output>
    </>
  );
}

const chips = () => within(screen.getByRole('group', { name: 'Role families' })).getAllByRole('button').map((b) => b.textContent);

describe('RoleFamilyPicker', () => {
  it('shows one career field at a time and keeps picks across fields', async () => {
    render(<Harness start={['sre']} />);
    expect(screen.getByRole('tab', { name: /Technology & data/ })).toHaveAttribute('aria-selected', 'true');
    expect(chips()).toEqual(['Data science', 'Platform engineering', 'Site reliability']);
    expect(screen.getByLabelText('1 picked')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: /Healthcare/ }));
    expect(chips()).toEqual(['Registered nursing (RN)']);
    await userEvent.click(screen.getByRole('button', { name: 'Registered nursing (RN)' }));
    expect(screen.getByRole('status')).toHaveTextContent('sre,registered_nursing');
    await userEvent.click(screen.getByRole('button', { name: /Registered nursing/ }));
    expect(screen.getByRole('status')).toHaveTextContent(/^sre$/);
  });

  it('opens on the field of what is already picked', () => {
    render(<Harness start={['registered_nursing']} />);
    expect(screen.getByRole('tab', { name: /Healthcare/ })).toHaveAttribute('aria-selected', 'true');
  });

  it('lists every role when the server sends no fields', () => {
    render(<Harness flat />);
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(chips()).toHaveLength(4);
  });
});
