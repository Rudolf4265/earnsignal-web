import Link from "next/link";

export default function SignupPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Create account</h1>
      <p className="mt-3 text-sm text-zinc-400">Create your EarnSigma account to get started.</p>

      <form className="mt-8 space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-300">Email</span>
          <input type="email" placeholder="you@studio.com" className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-300">Password</span>
          <input type="password" placeholder="••••••••" className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none" />
        </label>
        <button type="button" className="w-full rounded-xl bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-950">
          Start free trial
        </button>
      </form>

      <p className="mt-6 text-sm text-zinc-400">
        Already have an account? <Link href="/login" className="font-medium text-zinc-200 underline">Log in</Link>
      </p>
    </main>
  );
}
