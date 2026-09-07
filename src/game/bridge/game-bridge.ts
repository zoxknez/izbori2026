import type { GameBridgeEventMap, GameBridgeEventName } from "./game-events";

type EventHandler<T> = (data: T) => void;

export interface GameBridge {
  emit<K extends GameBridgeEventName>(event: K, data: GameBridgeEventMap[K]): void;
  on<K extends GameBridgeEventName>(event: K, handler: EventHandler<GameBridgeEventMap[K]>): () => void;
  off<K extends GameBridgeEventName>(event: K, handler: EventHandler<GameBridgeEventMap[K]>): void;
  destroy(): void;
}

/**
 * Fabrika za kreiranje instance-scoped GameBridge-a.
 * Svaka nova sesija simulatora dobija sopstveni bridge, što sprečava curenje
 * memorije i dupliciranje listenera pri unmount-u ili Fast Refresh-u.
 */
export function createGameBridge(): GameBridge {
  const listeners: {
    [K in GameBridgeEventName]?: Set<EventHandler<GameBridgeEventMap[K]>>;
  } = {};

  return {
    emit<K extends GameBridgeEventName>(event: K, data: GameBridgeEventMap[K]): void {
      const set = listeners[event];
      if (set) {
        set.forEach((handler) => {
          try {
            handler(data);
          } catch (err) {
            console.error(`[GameBridge] Greška pri obradi događaja ${event}:`, err);
          }
        });
      }
    },

    on<K extends GameBridgeEventName>(
      event: K,
      handler: EventHandler<GameBridgeEventMap[K]>,
    ): () => void {
      if (!listeners[event]) {
        listeners[event] = new Set();
      }
      listeners[event]!.add(handler);
      return () => {
        listeners[event]?.delete(handler);
      };
    },

    off<K extends GameBridgeEventName>(
      event: K,
      handler: EventHandler<GameBridgeEventMap[K]>,
    ): void {
      listeners[event]?.delete(handler);
    },

    destroy(): void {
      for (const key of Object.keys(listeners) as GameBridgeEventName[]) {
        listeners[key]?.clear();
        delete listeners[key];
      }
    },
  };
}
