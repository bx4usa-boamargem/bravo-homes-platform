import { getEmpresas } from "@/actions/empresas";
import EmpresasManager from "@/components/empresas/EmpresasManager";

export const dynamic = 'force-dynamic';

export default async function EmpresasPage() {
  const empresas = await getEmpresas();

  return <EmpresasManager initialEmpresas={empresas} />;
}

