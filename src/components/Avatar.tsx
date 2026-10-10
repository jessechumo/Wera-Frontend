import clsx from 'clsx';
import type { User } from '../api/types';

/** The user's picture, or their initial on an accent disc. */
export function Avatar({ user, size = 28, className }: { user: User; size?: number; className?: string }) {
  const initial = (user.name || user.email).slice(0, 1).toUpperCase();
  return user.avatar_version ? (
    <img
      src={`/api/profile/avatar?v=${user.avatar_version}`}
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
