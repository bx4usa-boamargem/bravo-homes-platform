"use client";

import { UserButton, useUser } from "@clerk/nextjs";

export default function Header() {
  const { user } = useUser();

  return (
    <header className="h-16 border-b border-border bg-white px-8 flex items-center justify-between sticky top-0 z-10">
      <div>
        <h2 className="text-sm font-medium text-text-secondary">
          Bom dia, <span className="text-text-primary font-semibold">{user?.firstName || "Contador"}</span>
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right mr-2">
          <p className="text-xs font-semibold text-text-primary leading-none">
            {user?.fullName}
          </p>
          <p className="text-[10px] text-text-secondary uppercase tracking-wider mt-1">
            Plano Básico
          </p>
        </div>
        <UserButton />
      </div>
    </header>
  );
}
