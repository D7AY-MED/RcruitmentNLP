/**
 * Imperative confirmation dialog.
 *
 * Wrap the app subtree in <ConfirmProvider> and call `const confirm = useConfirm()`
 * then `await confirm({ title, message, ... })` -> resolves true/false. Keeps
 * destructive actions (delete/disable) behind an explicit, accessible prompt
 * instead of window.confirm.
 */
import React, { createContext, useContext, useCallback, useRef, useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";

interface ConfirmOptions {
  title: string;
  message?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | undefined>(undefined);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const [busy, setBusy] = useState(false);
  const resolver = useRef<(v: boolean) => void>();

  const confirm = useCallback<ConfirmFn>((options) => {
    setOpts(options);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = (value: boolean) => {
    resolver.current?.(value);
    setOpts(null);
    setBusy(false);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={!!opts}
        onClose={() => settle(false)}
        title={opts?.title ?? ""}
        footer={
          <>
            <Button variant="outline" onClick={() => settle(false)}>
              {opts?.cancelLabel ?? "Cancel"}
            </Button>
            <Button
              variant={opts?.danger ? "destructive" : "primary"}
              loading={busy}
              onClick={() => {
                setBusy(true);
                settle(true);
              }}
            >
              {opts?.confirmLabel ?? "Confirm"}
            </Button>
          </>
        }
      >
        <div className="text-sm text-gray-600">{opts?.message}</div>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within a ConfirmProvider");
  return ctx;
}
