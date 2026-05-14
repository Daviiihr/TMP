import { appFactory } from "@/factories/app.factory";
import SearchTeamsClient from "@/components/teams/SearchTeamsClient";

export const dynamic = "force-dynamic";

export default async function SearchTeamsPage() {
  const teamService = appFactory.createTeamService();
  const teams = await teamService.searchTeams("");

  return <SearchTeamsClient initialTeams={teams} />;
}
