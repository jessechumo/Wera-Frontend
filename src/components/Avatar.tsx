import clsx from 'clsx';

interface Person {
  id: number;
  name: string;
  email?: string;
  avatar_version?: number | null;
}

/**
 * A person's picture, or their initial on an accent disc. `self` reads the
 * signed-in user's own picture; others come from /api/users/{id}/avatar.
 */
export function Avatar({ user, size = 28, className, self = true }: {
  user: Person; size?: number; className?: string; self?: boolean;
}) {
  const initial = (user.name || user.email || '?').slice(0, 1).toUpperCase();
  return user.avatar_version ? (
    <img
      src={`${self ? '/api/profile/avatar' : `/api/users/${user.id}/avatar`}?v=${user.avatar_version}`}
      alt=""
      width={size}
      height={size}
      className={clsx('shrink-0 rounded-full object-cover ring-1 ring-border', className)}
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      aria-hidden
      className={clsx('flex shrink-0 items-center justify-center rounded-full bg-accent/15 font-semibold text-accent', className)}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {initial}
    </span>
  );
}
