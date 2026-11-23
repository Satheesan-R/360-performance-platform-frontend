import LoginPage from "./loginpage";
export default async function Page({ searchParams }: { searchParams: Promise<{ security?: string }> }) {
  const { security } = await searchParams;
  const securityNotice = security === "changed" ? "Your password has been changed. All devices were signed out. Sign in with your new password. A security alert was accepted by the email server." : security === "changed-email-unavailable" ? "Your password has been changed. All devices were signed out. Sign in with your new password. The security email could not be confirmed; contact HR or IT if needed." : "";
  return <LoginPage securityNotice={securityNotice} />;
}
