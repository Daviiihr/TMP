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

  private observers: { [K in EventKey]?: Set<Observer<K>> } = {};


  private getObservers<T extends EventKey>(eventName: T): Set<Observer<T>> {
    if (!this.observers[eventName]) {
      this.observers[eventName] = new Set<Observer<T>>() as unknown as {
        [K in EventKey]?: Set<Observer<K>>;
      }[T];
    }

    return this.observers[eventName] as Set<Observer<T>>;
  }

  on<T extends EventKey>(eventName: T, observer: Observer<T>) {
    this.getObservers(eventName).add(observer);
  }

  off<T extends EventKey>(eventName: T, observer: Observer<T>) {
    this.getObservers(eventName).delete(observer);
  }

  async emit<T extends EventKey>(eventName: T, data: AppEvents[T]) {
    const handlers = this.getObservers(eventName);

    // Execute all handlers concurrently
    await Promise.all(Array.from(handlers).map((observer) => observer.update(eventName, data)));
  }
}
