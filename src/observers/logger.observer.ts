import { Observer, EventKey } from "./event-emitter";

export class LoggerObserver implements Observer<EventKey> {
  async update(eventName: EventKey, data: any): Promise<void> {
    const timestamp = new Date().toISOString();
    
    switch (eventName) {
      case "tournament:statusChanged":
        console.log(`[${timestamp}] 🏆 ${eventName} — Torneo ${data.tournamentId} cambió de ${data.oldStatus} → ${data.newStatus} (Usuario: ${data.userId})`);
        break;
      case "enrollment:playerJoined":
        console.log(`[${timestamp}] 👤 ${eventName} — Jugador ${data.userId} se inscribió al torneo ${data.tournamentId}`);
        break;
      case "enrollment:teamJoined":
        console.log(`[${timestamp}] 👥 ${eventName} — Equipo ${data.teamId} se inscribió al torneo ${data.tournamentId}`);
        break;
      case "team:created":
        console.log(`[${timestamp}] 🛡️ ${eventName} — Equipo "${data.name}" (${data.teamId}) creado por el capitán ${data.captainId}`);
        break;
      default:
        console.log(`[${timestamp}] 🔔 ${eventName} —`, data);
    }
  }
}
