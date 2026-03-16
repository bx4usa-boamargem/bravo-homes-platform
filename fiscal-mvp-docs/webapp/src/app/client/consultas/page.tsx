import { getAllConsultas } from "@/actions/consultas";
import ConsultasList from "@/components/consultas/ConsultasList";

export default async function CertidoesPage() {
  const consultas = await getAllConsultas();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Certidões e Histórico</h1>
        <p className="text-sm text-text-secondary mt-1">
          Acompanhe o histórico de todas runs do robô no e-CAC e visualize os PDFs.
        </p>
      </div>

      <ConsultasList initialConsultas={consultas} />
    </div>
  );
}
