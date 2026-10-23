"use client";

import { useEffect } from "react";
import { useI18n } from "@/components/providers";
import { SystemState } from "@/components/ui/system-state";
import { reloadIfStaleDeployment } from "@/lib/stale-deployment";

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const { t, locale } = useI18n();

  useEffect(() => {
    if (!reloadIfStaleDeployment(error)) console.error(error);
  }, [error]);

  return <SystemState code="!" eyebrow={t.errors.loadLabel} title={t.errors.loadTitle}
    body={t.errors.loadBody} locale={locale} homeLabel={t.errors.goHome}
    retryLabel={t.errors.tryAgain} onRetry={retry} />;
}
