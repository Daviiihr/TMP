type AppEvents = {
  "tournament:statusChanged": { tournamentId: string; oldStatus: string; newStatus: string; userId: string };
  "enrollment:playerJoined": { userId: string; tournamentId: string };
  "enrollment:teamJoined": { teamId: string; tournamentId: string };
  "team:created": { teamId: string; captainId: string; name: string };
};

export type EventKey = keyof AppEvents;

export interface Observer<T extends EventKey> {
  update(eventName: T, data: AppEvents[T]): void | Promise<void>;
}

export class AppEventEmitter {
  private observers: Map<EventKey, Set<Observer<any>>> = new Map();

  on<T extends EventKey>(eventName: T, observer: Observer<T>) {
    if (!this.observers.has(eventName)) {
      this.observers.set(eventName, new Set());
    }
    this.observers.get(eventName)!.add(observer);
  }

  off<T extends EventKey>(eventName: T, observer: Observer<T>) {
    if (this.observers.has(eventName)) {
      this.observers.get(eventName)!.delete(observer);
    }
  }

  async emit<T extends EventKey>(eventName: T, data: AppEvents[T]) {
    if (this.observers.has(eventName)) {
      const handlers = Array.from(this.observers.get(eventName)!);
      // Execute all handlers concurrently
      await Promise.all(handlers.map((observer) => observer.update(eventName, data)));
    }
  }
}
