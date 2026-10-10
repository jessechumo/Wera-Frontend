import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export type ReactionKind = 'like' | 'insightful' | 'celebrate';

export interface Author {
  id: number;
  name: string;
  avatar_version: number | null;
}

export interface PostSummary {
  id: number;
  title: string;
  excerpt: string;
  tags: string[];
  author: Author;
  created_at: string;
  read_minutes: number;
  reactions: Partial<Record<ReactionKind, number>>;
  my_reactions: ReactionKind[];
  comment_count: number;
  is_mine: boolean;
}

export interface PostComment {
  id: number;
  body: string;
  author: Author;
  created_at: string;
  is_mine: boolean;
}

export interface Post extends PostSummary {
  body: string;
  comments: PostComment[];
}

export interface Feed {
  posts: PostSummary[];
  tags: { tag: string; count: number }[];
}

export function usePosts(tag: string) {
  return useQuery({
    queryKey: ['posts', tag],
    queryFn: () => api<Feed>(`/api/posts?limit=50${tag ? `&tag=${encodeURIComponent(tag)}` : ''}`),
  });
}

export function usePost(id: number) {
  return useQuery({ queryKey: ['post', id], queryFn: () => api<Post>(`/api/posts/${id}`) });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { title: string; body: string; tags: string[] }) =>
      api<Post>('/api/posts', { method: 'POST', body: JSON.stringify(p) }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['posts'] }),
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api<void>(`/api/posts/${id}`, { method: 'DELETE' }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['posts'] }),
  });
}

export function useComment(postId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      api<Post>(`/api/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ body }) }),
    onSuccess: (post) => {
      qc.setQueryData(['post', postId], post);
      void qc.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useDeleteComment(postId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api<void>(`/api/posts/${postId}/comments/${id}`, { method: 'DELETE' }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['post', postId] }),
  });
}

/** Toggles a reaction optimistically on the post and in the feed. */
export function useReact(postId: number) {
  const qc = useQueryClient();
  const apply = <T extends PostSummary>(p: T, kind: ReactionKind, on: boolean): T => ({
    ...p,
    reactions: { ...p.reactions, [kind]: Math.max(0, (p.reactions[kind] ?? 0) + (on ? 1 : -1)) },
    my_reactions: on ? [...p.my_reactions, kind] : p.my_reactions.filter((k) => k !== kind),
  });
  return useMutation({
    mutationFn: (v: { kind: ReactionKind; on: boolean }) =>
      api<void>(`/api/posts/${postId}/reactions/${v.kind}`, { method: v.on ? 'PUT' : 'DELETE' }),
    onMutate: ({ kind, on }) => {
      qc.setQueryData<Post>(['post', postId], (p) => p && apply(p, kind, on));
      qc.setQueriesData<Feed>({ queryKey: ['posts'] }, (f) =>
        f && { ...f, posts: f.posts.map((p) => (p.id === postId ? apply(p, kind, on) : p)) },
      );
    },
    onError: () => void qc.invalidateQueries({ queryKey: ['post', postId] }),
  });
}
