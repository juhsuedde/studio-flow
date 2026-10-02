import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/AppShell";
import { BookingForm } from "@/components/booking/BookingForm";

export const Route = createFileRoute("/ensaios/novo")({
  ssr: false,
  head: () => ({ meta: [
    { title: "Novo ensaio — Estúdio" }, { name: "description", content: "Cadastre um ensaio por formulário guiado ou texto livre." },
    { property: "og:title", content: "Novo ensaio — Estúdio" }, { property: "og:description", content: "Cadastre um ensaio por formulário guiado ou texto livre." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <div><PageHeader title="Novo ensaio" description="Escolha como prefere informar os dados." /><BookingForm /></div>,
});