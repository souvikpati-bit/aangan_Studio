import Dashboard from "../components/Dashboard";
import { getLeads } from "../lib/leads";

export const dynamic = "force-dynamic"; // always read fresh leads from the database

export default async function Page() {
  try {
    const leads = await getLeads();
    return <Dashboard initial={leads} />;
  } catch (e) {
    return (
      <div className="banner" role="alert">
        Could not load leads from the database. {(e as Error).message}
      </div>
    );
  }
}
