import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex h-screen items-center justify-center bg-muted/40">
      <SignIn signUpUrl="/sign-up" afterSignInUrl="/app/dashboard" redirectUrl="/app/dashboard" />
    </div>
  );
}
