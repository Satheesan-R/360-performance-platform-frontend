import OtpForm from "@/components/auth/otp-form";

interface VerifyOtpPageProps {
  searchParams: Promise<{
    token?: string | string[];
    email?: string | string[];
  }>;
}

function firstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function VerifyOtpPage({ searchParams }: VerifyOtpPageProps) {
  const query = await searchParams;
  const token = firstValue(query.token) ?? null;
  const email = firstValue(query.email);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12">
      <OtpForm token={token} email={email} />
    </main>
  );
}
