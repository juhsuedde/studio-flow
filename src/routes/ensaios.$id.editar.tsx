import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/AppShell";
import { BookingForm } from "@/components/booking/BookingForm";
import { bookingToDraft } from "@/lib/data/bookings";
import { bookingQuery } from "@/lib/data/queries";

export const Route = createFileRoute("/ensaios/$id/editar")({
  loader: async ({ context, params }) => { const b = await context.queryClient.ensureQueryData(bookingQuery(params.id)); if (!b) throw notFound(); return b; },
  head: () => ({ meta: [
    { title: "Editar ensaio — Estúdio" }, { name: "description", content: "Atualize os dados do ensaio." },
    { property: "og:title", content: "Editar ensaio — Estúdio" }, { property: "og:description", content: "Atualize os dados do ensaio." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: EditBooking,
});
function EditBooking() { const { id } = Route.useParams(); const { data } = useSuspenseQuery(bookingQuery(id)); if (!data) return null; return <div><PageHeader title="Editar ensaio" description={data.client?.name ?? ""} /><BookingForm initial={bookingToDraft(data)} bookingId={id} /></div>; }