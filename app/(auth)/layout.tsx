import { GraduationCap } from "lucide-react";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[linear-gradient(160deg,var(--brand-top),var(--brand-bottom))] p-12 lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-white/10 text-white">
            <GraduationCap className="size-5" aria-hidden="true" />
          </span>
          <span className="text-base font-semibold text-white">School Management</span>
        </div>

        <div className="max-w-sm">
          <p className="text-2xl leading-snug font-semibold text-white">
            Run your entire school from one calm, connected system.
          </p>
          <p className="mt-3 text-sm text-white/60">
            Enrolment, attendance, results, fees, and parent communication — in one place.
          </p>
        </div>

        <p className="text-xs text-white/40">© {new Date().getFullYear()} School Management</p>
      </div>

      <div className="flex items-center justify-center bg-[var(--bg)] px-6 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
