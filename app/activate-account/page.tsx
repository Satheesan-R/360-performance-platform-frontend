import ActivationCard from "@/components/auth/activation-card";

interface ActivateAccountPageProps {
  searchParams: Promise<{ token?: string | string[] }>;
}

export default async function ActivateAccountPage({ searchParams }: ActivateAccountPageProps) {
  const query = await searchParams;
  const tokenValue = query.token;
  const token = Array.isArray(tokenValue) ? tokenValue[0] : tokenValue ?? null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12">
      <ActivationCard token={token} />
    </main>
  );
}
