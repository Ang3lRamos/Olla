"use client";

import { CheckEmail } from "@/features/auth/components/check-email";

export function CheckEmailPreview() {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="letrero text-xl">Tras registrarse</h2>
      <div className="max-w-sm rounded-md border border-hairline p-6">
        <CheckEmail email="tu@correo.com" onUseAnotherEmail={() => undefined} />
      </div>
    </section>
  );
}
