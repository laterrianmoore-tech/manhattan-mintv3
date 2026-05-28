import { supabaseAdmin } from "@/lib/supabase";
import FeedbackForm from "./FeedbackForm";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ bookingId: string }>;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f9fafb" }}>
      <p className="text-base" style={{ color: "#9ca3af" }}>Page not found.</p>
    </div>
  );
}

function AlreadyReceived() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#f9fafb" }}>
      <div className="w-full max-w-[28rem] bg-white rounded-2xl shadow-sm p-8 text-center">
        <div className="text-4xl mb-4">✓</div>
        <h2 className="text-xl font-semibold mb-2" style={{ color: "#0f0f0f" }}>
          We already received your feedback — thank you!
        </h2>
        <p className="text-sm" style={{ color: "#6b7280" }}>
          — Manhattan Mint NYC
        </p>
      </div>
    </div>
  );
}

export default async function FeedbackPage({ params }: Props) {
  const { bookingId } = await params;

  if (!UUID_RE.test(bookingId)) {
    return <NotFound />;
  }

  // Fetch booking + customer
  const { data: booking } = await supabaseAdmin
    .from("bookings")
    .select("id, service_date, service_summary, assigned_cleaner_id, customers(first_name)")
    .eq("id", bookingId)
    .single();

  if (!booking) {
    return <NotFound />;
  }

  // Fetch cleaner name if assigned
  let cleanerFirstName = "your cleaner";
  if (booking.assigned_cleaner_id) {
    const { data: cleaner } = await supabaseAdmin
      .from("cleaners")
      .select("first_name")
      .eq("id", booking.assigned_cleaner_id)
      .single();
    if (cleaner?.first_name) {
      cleanerFirstName = cleaner.first_name;
    }
  }

  // Check for existing feedback
  const { data: existing } = await supabaseAdmin
    .from("feedback")
    .select("id")
    .eq("booking_id", bookingId)
    .maybeSingle();

  if (existing) {
    return <AlreadyReceived />;
  }

  return (
    <FeedbackForm
      bookingId={bookingId}
      cleanerFirstName={cleanerFirstName}
      serviceDate={booking.service_date}
      serviceSummary={booking.service_summary}
    />
  );
}
