import { Observer, EventKey, AppEvents } from "./event-emitter";

export class LoggerObserver implements Observer<EventKey> {
  async update<T extends EventKey>(eventName: T, data: AppEvents[T]): Promise<void> {
    const timestamp = new Date().toISOString();
    
    switch (eventName) {
      case "tournament:statusChanged": {
        const payload = data as AppEvents["tournament:statusChanged"];
        console.log(`[${timestamp}] 🏆 ${eventName} — Torneo ${payload.tournamentId} cambió de ${payload.oldStatus} → ${payload.newStatus} (Usuario: ${payload.userId})`);
        break;
      }
      case "enrollment:playerJoined": {
        const payload = data as AppEvents["enrollment:playerJoined"];
        console.log(`[${timestamp}] 👤 ${eventName} — Jugador ${payload.userId} se inscribió al torneo ${payload.tournamentId}`);
        break;
      }
      case "enrollment:teamJoined": {
        const payload = data as AppEvents["enrollment:teamJoined"];
        console.log(`[${timestamp}] 👥 ${eventName} — Equipo ${payload.teamId} se inscribió al torneo ${payload.tournamentId}`);
        break;
      }
      case "team:created": {
        const payload = data as AppEvents["team:created"];
        console.log(`[${timestamp}] 🛡️ ${eventName} — Equipo "${payload.name}" (${payload.teamId}) creado por el capitán ${payload.captainId}`);
        break;
      }
      default:
        console.log(`[${timestamp}] 🔔 ${eventName} —`, data);
    }
  }
}
