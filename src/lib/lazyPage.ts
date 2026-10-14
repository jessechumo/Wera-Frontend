import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

/** A page loaded on first visit; preload() fetches its code ahead of time. */
export type LazyPage<P> = LazyExoticComponent<ComponentType<P>> & { preload: () => Promise<unknown> };

export function lazyPage<P>(load: () => Promise<{ default: ComponentType<P> }>): LazyPage<P> {
  const page = lazy(load) as LazyPage<P>;
  page.preload = load;
  return page;
}
