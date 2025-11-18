import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex h-screen items-center justify-center bg-muted/40">
      <SignUp signInUrl="/sign-in" afterSignUpUrl="/app/dashboard" redirectUrl="/app/dashboard" />
    </div>
  );
}
