import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
  type UIEvent,
} from 'react';

interface SyncScrollContext {
  add: (el: HTMLElement) => void;
  remove: (el: HTMLElement) => void;
  onScroll: (e: UIEvent<HTMLElement>) => void;
}

const Ctx = createContext<SyncScrollContext | null>(null);

/**
 * Synchronised scrolling across registered panes (FR-11). Scroll position is
 * mirrored proportionally so source and translation stay aligned.
 */
export function SyncScrollProvider({ children }: { children: ReactNode }) {
  const els = useRef<Set<HTMLElement>>(new Set());
  const locked = useRef(false);

  const onScroll = useCallback((e: UIEvent<HTMLElement>) => {
    if (locked.current) return;
    locked.current = true;
    const src = e.currentTarget;
    const denom = src.scrollHeight - src.clientHeight;
    const ratio = denom > 0 ? src.scrollTop / denom : 0;
    for (const el of els.current) {
      if (el !== src) {
        el.scrollTop = ratio * (el.scrollHeight - el.clientHeight);
      }
    }
    requestAnimationFrame(() => {
      locked.current = false;
    });
  }, []);

  const value = useMemo<SyncScrollContext>(
    () => ({
      add: (el) => els.current.add(el),
      remove: (el) => els.current.delete(el),
      onScroll,
    }),
    [onScroll],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Returns a ref callback + onScroll handler to register a scrollable element. */
export function useSyncScroll() {
  const ctx = useContext(Ctx);
  const current = useRef<HTMLElement | null>(null);

  const ref = useCallback(
    (el: HTMLElement | null) => {
      if (!ctx) return;
      if (current.current) ctx.remove(current.current);
      current.current = el;
      if (el) ctx.add(el);
    },
    [ctx],
  );

  return { ref, onScroll: ctx?.onScroll };
}
