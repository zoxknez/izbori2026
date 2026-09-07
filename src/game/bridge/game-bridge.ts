import type { GameBridgeEventMap, GameBridgeEventName } from "./game-events";

type EventHandler<T> = (data: T) => void;

export interface GameBridge {
  emit<K extends GameBridgeEventName>(event: K, data: GameBridgeEventMap[K]): void;
  on<K extends GameBridgeEventName>(event: K, handler: EventHandler<GameBridgeEventMap[K]>): () => void;
  off<K extends GameBridgeEventName>(event: K, handler: EventHandler<GameBridgeEventMap[K]>): void;
  destroy(): void;
}

type StoredHandler = (data: unknown) => void;

/**
 * Fabrika za kreiranje instance-scoped GameBridge-a.
 * Svaka nova sesija simulatora dobija sopstveni bridge, što sprečava curenje
 * memorije i dupliciranje listenera pri unmount-u ili Fast Refresh-u.
 */
export function createGameBridge(): GameBridge {
  const listeners = new Map<GameBridgeEventName, Set<StoredHandler>>();

  return {
    emit<K extends GameBridgeEventName>(event: K, data: GameBridgeEventMap[K]): void {
      const set = listeners.get(event);
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
      const storedHandler = handler as unknown as StoredHandler;
      let set = listeners.get(event);
      if (!set) {
        set = new Set<StoredHandler>();
        listeners.set(event, set);
      }
      set.add(storedHandler);
      return () => {
        set.delete(storedHandler);
      };
    },

    off<K extends GameBridgeEventName>(
      event: K,
      handler: EventHandler<GameBridgeEventMap[K]>,
    ): void {
      const storedHandler = handler as unknown as StoredHandler;
      listeners.get(event)?.delete(storedHandler);
    },

    destroy(): void {
      listeners.forEach((set) => set.clear());
      listeners.clear();
    },
  };
}
