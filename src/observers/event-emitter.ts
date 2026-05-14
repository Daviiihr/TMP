export type AppEvents = {
  "tournament:statusChanged": { tournamentId: string; oldStatus: string; newStatus: string; userId: string };
  "enrollment:playerJoined": { userId: string; tournamentId: string };
  "enrollment:teamJoined": { teamId: string; tournamentId: string };
  "team:created": { teamId: string; captainId: string; name: string };
};

export type EventKey = keyof AppEvents;

export interface Observer<T extends EventKey> {
  update(eventName: T, data: AppEvents[T]): void | Promise<void>;
}

type AnyObserver = {
  update<T extends EventKey>(eventName: T, data: AppEvents[T]): void | Promise<void>;
};

export class AppEventEmitter {
  private observers: Map<EventKey, Set<AnyObserver>> = new Map();

  on<T extends EventKey>(eventName: T, observer: Observer<T>) {
    if (!this.observers.has(eventName)) {
      this.observers.set(eventName, new Set());
    }
    this.observers.get(eventName)!.add(observer as AnyObserver);
  }

  off<T extends EventKey>(eventName: T, observer: Observer<T>) {
    this.observers.get(eventName)?.delete(observer as AnyObserver);
  }

  async emit<T extends EventKey>(eventName: T, data: AppEvents[T]) {
    const handlers = this.observers.get(eventName);
    if (handlers) {
      // Execute all handlers concurrently
      await Promise.all(Array.from(handlers).map((observer) => observer.update(eventName, data)));
    }
  }
}
