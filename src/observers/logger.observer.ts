import { Observer, EventKey, AppEvents } from "./event-emitter";

export class LoggerObserver implements Observer<EventKey> {
  async update(eventName: EventKey, data: AppEvents[EventKey]): Promise<void> {
    const timestamp = new Date().toISOString();
    
    switch (eventName) {
      case "tournament:statusChanged": {
        const eventData = data as AppEvents["tournament:statusChanged"];
        console.log(`[${timestamp}] 🏆 ${eventName} — Torneo ${eventData.tournamentId} cambió de ${eventData.oldStatus} → ${eventData.newStatus} (Usuario: ${eventData.userId})`);
        break;
      }
      case "enrollment:playerJoined": {
        const eventData = data as AppEvents["enrollment:playerJoined"];
        console.log(`[${timestamp}] 👤 ${eventName} — Jugador ${eventData.userId} se inscribió al torneo ${eventData.tournamentId}`);
        break;
      }
      case "enrollment:teamJoined": {
        const eventData = data as AppEvents["enrollment:teamJoined"];
        console.log(`[${timestamp}] 👥 ${eventName} — Equipo ${eventData.teamId} se inscribió al torneo ${eventData.tournamentId}`);
        break;
      }
      case "team:created": {
        const eventData = data as AppEvents["team:created"];
        console.log(`[${timestamp}] 🛡️ ${eventName} — Equipo "${eventData.name}" (${eventData.teamId}) creado por el capitán ${eventData.captainId}`);
        break;
      }
      default:
        console.log(`[${timestamp}] 🔔 ${eventName} —`, data);
    }
  }
}
