// Sidebar é agora um Server Component — busca o count de pendências no servidor
// e passa como prop para o SidebarClient (Client Component).
import SidebarClient from "./SidebarClient";
import { getPendenciasCount } from "@/actions/dashboard";

export default async function Sidebar() {
  const pendenciasCount = await getPendenciasCount();
  return <SidebarClient pendenciasCount={pendenciasCount} />;
}
