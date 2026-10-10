import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { PostSummary } from '../api/community';
import { mockApi, renderApp } from '../test/render';
import { Reactions } from './Reactions';

const post: PostSummary = {
  id: 7, title: 't', excerpt: 'e', tags: [], author: { id: 1, name: 'A', avatar_version: null },
  created_at: '2026-10-10T00:00:00Z', read_minutes: 1, reactions: { like: 2 }, my_reactions: [],
  comment_count: 0, is_mine: false,
};

describe('Reactions', () => {
  it('toggles a reaction optimistically and calls the API', async () => {
    const fetchMock = mockApi({
      'PUT /api/posts/7/reactions/like': () => undefined,
      'DELETE /api/posts/7/reactions/like': () => undefined,
    });
    const { client } = renderApp(<Reactions post={post} />);
    client.setQueryData(['post', 7], { ...post, body: '', comments: [] });

    await userEvent.click(screen.getByRole('button', { name: 'Like (2)' }));
    await waitFor(() => expect(client.getQueryData<PostSummary>(['post', 7])?.reactions.like).toBe(3));
    expect(client.getQueryData<PostSummary>(['post', 7])?.my_reactions).toEqual(['like']);
    expect(fetchMock).toHaveBeenCalledWith('/api/posts/7/reactions/like', expect.objectContaining({ method: 'PUT' }));
  });

  it('compact mode hides reactions nobody used', () => {
    mockApi({});
    renderApp(<Reactions post={post} compact />);
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });
});
