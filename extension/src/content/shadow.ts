import bubbleStyles from './bubble.css?inline';

const HOST_ID = 'nazori-translation-host';

export function createShadowHost(): {
  host: HTMLElement;
  shadowRoot: ShadowRoot;
} {
  // Remove any existing host to avoid duplicates
  const existing = document.getElementById(HOST_ID);
  if (existing) {
    existing.remove();
  }

  const host = document.createElement('div');
  host.id = HOST_ID;
  host.setAttribute('aria-hidden', 'false');

  // Prevent page styles from affecting the host
  host.style.position = 'fixed';
  host.style.top = '0';
  host.style.left = '0';
  host.style.width = '0';
  host.style.height = '0';
  host.style.overflow = 'visible';
  host.style.zIndex = '2147483647';
  host.style.pointerEvents = 'none';

  const shadowRoot = host.attachShadow({ mode: 'open' });

  // Inject bubble styles into the shadow root
  const styleEl = document.createElement('style');
  styleEl.textContent = bubbleStyles;
  shadowRoot.appendChild(styleEl);

  // Create mount point for React
  const mountPoint = document.createElement('div');
  mountPoint.id = 'nazori-mount';
  mountPoint.style.pointerEvents = 'auto';
  shadowRoot.appendChild(mountPoint);

  document.body.appendChild(host);

  return { host, shadowRoot };
}

export function removeShadowHost(host: HTMLElement): void {
  if (host && host.parentNode) {
    host.parentNode.removeChild(host);
  }
}
