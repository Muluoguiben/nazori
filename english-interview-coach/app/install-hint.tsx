'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};
const getServerSnapshot = () => false;

function getSnapshot() {
  const isIOS =
    /ipad|iphone|ipod/i.test(navigator.userAgent) && !('MSStream' in window);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  return isIOS && !isStandalone;
}

export function InstallHint() {
  const show = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!show) return null;

  return (
    <p className="mt-3 text-center text-xs text-neutral-500">
      Install: tap Share, then &ldquo;Add to Home Screen&rdquo;.
    </p>
  );
}
