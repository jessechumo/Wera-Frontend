import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { jsonResponse, mockApi, renderApp } from '../test/render';
import NewPostPage from './NewPostPage';

const body = 'I faked two references and it worked. '.repeat(8);

describe('NewPostPage', () => {
  it('shows why moderation refused a post', async () => {
    mockApi({
      'POST /api/posts': () =>
        jsonResponse(422, { error: 'This post advises faking references.', categories: ['unethical'] }),
    });
    renderApp(<NewPostPage />);
    const publish = screen.getByRole('button', { name: 'Publish' });
    expect(publish).toBeDisabled();

    await userEvent.type(screen.getByLabelText('Title'), 'How I got past reference checks');
    await userEvent.click(screen.getByLabelText('Post body'));
    await userEvent.paste(body);
    await userEvent.click(screen.getByRole('button', { name: '#interviews' }));
    expect(publish).toBeEnabled();
    await userEvent.click(publish);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Not published');
    expect(alert).toHaveTextContent('This post advises faking references.');
  });

  it('previews the formatted post', async () => {
    mockApi({});
    renderApp(<NewPostPage />);
    await userEvent.click(screen.getByLabelText('Post body'));
    await userEvent.paste('## Heading\n\n- a point');
    await userEvent.click(screen.getByRole('button', { name: /Preview/ }));
    expect(screen.getByRole('heading', { name: 'Heading' })).toBeInTheDocument();
  });
});
