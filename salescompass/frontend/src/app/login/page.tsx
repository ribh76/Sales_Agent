import Image from "next/image";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-field px-4 py-10">
      <div className="w-full">
        <Link href="/dashboard" className="mx-auto mb-6 flex w-fit items-center gap-3 font-semibold">
          <Image src="/logo.svg" alt="" width={40} height={40} />
          SalesCompass
        </Link>
        <LoginForm />
      </div>
    </main>
  );
}

