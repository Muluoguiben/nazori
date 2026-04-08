import { nanoid } from 'nanoid';
import type { Message, MessageType } from './types';

/**
 * Send a typed message through the Chrome extension messaging system.
 * Returns a promise that resolves with the response payload.
 */
export async function sendMessage<TResponse = unknown, TPayload = unknown>(
  type: MessageType,
  payload: TPayload,
): Promise<TResponse> {
  const message: Message<TPayload> = {
    type,
    payload,
    requestId: nanoid(),
    timestamp: Date.now(),
  };

  return new Promise<TResponse>((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(message, (response: Message<TResponse> | undefined) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message ?? 'Unknown messaging error'));
          return;
        }

        if (!response) {
          reject(new Error('No response received'));
          return;
        }

        if (response.type === 'TRANSLATE_ERROR') {
          reject(response.payload);
          return;
        }

        resolve(response.payload);
      });
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });
}

/**
 * Create a typed message object (useful for building responses in the background script).
 */
export function createMessage<T>(type: MessageType, payload: T, requestId?: string): Message<T> {
  return {
    type,
    payload,
    requestId: requestId ?? nanoid(),
    timestamp: Date.now(),
  };
}

export interface StreamPort {
  /** Send a chunk of data through the port. */
  postMessage<T>(type: MessageType, payload: T): void;
  /** Register a handler for incoming messages on the port. */
  onMessage<T>(callback: (message: Message<T>) => void): void;
  /** Register a handler for port disconnection. */
  onDisconnect(callback: () => void): void;
  /** Close the port. */
  disconnect(): void;
}

/**
 * Create a streaming port for long-lived connections (e.g., streaming translation).
 * Wraps chrome.runtime.connect with typed helpers.
 */
export function createStreamPort(name: string): StreamPort {
  const port = chrome.runtime.connect({ name });

  return {
    postMessage<T>(type: MessageType, payload: T): void {
      const message: Message<T> = {
        type,
        payload,
        requestId: nanoid(),
        timestamp: Date.now(),
      };
      port.postMessage(message);
    },

    onMessage<T>(callback: (message: Message<T>) => void): void {
      port.onMessage.addListener((msg: unknown) => {
        callback(msg as Message<T>);
      });
    },

    onDisconnect(callback: () => void): void {
      port.onDisconnect.addListener(() => {
        callback();
      });
    },

    disconnect(): void {
      port.disconnect();
    },
  };
}

/**
 * Wrap an incoming port (from chrome.runtime.onConnect) with typed helpers.
 * Useful in the background script to handle streaming connections.
 */
export function wrapPort(port: chrome.runtime.Port): StreamPort {
  return {
    postMessage<T>(type: MessageType, payload: T): void {
      const message: Message<T> = {
        type,
        payload,
        requestId: nanoid(),
        timestamp: Date.now(),
      };
      port.postMessage(message);
    },

    onMessage<T>(callback: (message: Message<T>) => void): void {
      port.onMessage.addListener((msg: unknown) => {
        callback(msg as Message<T>);
      });
    },

    onDisconnect(callback: () => void): void {
      port.onDisconnect.addListener(() => {
        callback();
      });
    },

    disconnect(): void {
      port.disconnect();
    },
  };
}

/**
 * Listen for one-shot messages in the background script.
 * Returns the full Message object so the handler can use the requestId for responses.
 */
export function onMessage<T = unknown>(
  type: MessageType,
  handler: (
    message: Message<T>,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: Message<unknown>) => void,
  ) => void | boolean,
): void {
  chrome.runtime.onMessage.addListener(
    (rawMessage: unknown, sender: chrome.runtime.MessageSender, sendResponse) => {
      const message = rawMessage as Message<T>;
      if (message?.type === type) {
        return handler(message, sender, sendResponse);
      }
      return undefined;
    },
  );
}
