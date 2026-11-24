import AssignedReviews from "@/components/review-cycles/assigned-reviews";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ cycleId?: string | string[] }>;
}) {
  const { cycleId } = await searchParams;
  const initialCycleId = typeof cycleId === "string" && /^[a-f0-9]{24}$/i.test(cycleId) ? cycleId : "";
<<<<<<< HEAD
  return <AssignedReviews key={initialCycleId} initialCycleId={initialCycleId} />;
=======
  return <AssignedReviews key={initialCycleId} initialCycleId={initialCycleId} fullWidth />;
>>>>>>> ecfcbb161f14d418976efe362e26cf78268e9677
}
