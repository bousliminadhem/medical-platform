"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewStaffRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/staff");
  }, [router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        <p className="font-mono text-xs text-zinc-500 uppercase tracking-wider">
          Redirecting to Staff Directory…
        </p>
      </div>
    </div>
  );
}
