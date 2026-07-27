"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallAppPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    setIsStandalone(standalone);

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      const dismissed = localStorage.getItem("scenario-trainer-install-dismissed");
      if (!dismissed) setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  if (isStandalone || !visible || !deferred) return null;

  return (
    <div className="fixed inset-x-4 bottom-20 z-50 rounded-xl border border-sky-200 bg-white p-4 shadow-lg sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-sm">
      <p className="text-sm font-semibold text-slate-900">Install ScenarioTrainer</p>
      <p className="mt-1 text-sm text-slate-600">
        Add this app to your home screen for quicker Practice Lab access.
      </p>
      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          onClick={async () => {
            await deferred.prompt();
            const choice = await deferred.userChoice;
            setVisible(false);
            setDeferred(null);
            if (choice.outcome === "dismissed") {
              localStorage.setItem("scenario-trainer-install-dismissed", "1");
            }
          }}
        >
          Install App
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            localStorage.setItem("scenario-trainer-install-dismissed", "1");
            setVisible(false);
          }}
        >
          Not now
        </Button>
      </div>
    </div>
  );
}
