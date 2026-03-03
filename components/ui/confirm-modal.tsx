"use client";

import { Loader2 } from "lucide-react";

interface ConfirmModalButtons {
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
}

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttons?: ConfirmModalButtons;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
}

const DEFAULT_BUTTONS: Required<ConfirmModalButtons> = {
  confirmLabel: "Confirm",
  cancelLabel: "Cancel",
  variant: "default",
};

export function ConfirmModal({
  open,
  onClose,
  title,
  message,
  buttons = {},
  loading = false,
  onConfirm,
}: ConfirmModalProps) {
  const { confirmLabel, cancelLabel, variant } = { ...DEFAULT_BUTTONS, ...buttons };
  if (!open) return null;

  async function handleConfirm(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    await onConfirm();
  }

  return (
    <>
      <div
        className="confirm-modal__overlay fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="confirm-modal fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl bg-card border border-border shadow-card p-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-desc"
      >
        <h3 id="confirm-modal-title" className="confirm-modal__title text-base font-semibold text-foreground mb-2">
          {title}
        </h3>
        <p id="confirm-modal-desc" className="confirm-modal__message text-sm text-muted-foreground mb-5">
          {message}
        </p>
        <div className="confirm-modal__actions flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50 pressable"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 pressable flex items-center gap-2 ${
              variant === "destructive"
                ? "bg-loss/10 text-loss border border-loss/20 hover:bg-loss/20"
                : "bg-accent text-accent-foreground hover:bg-accent-light"
            }`}
          >
            {loading && <Loader2 size={16} className="animate-spin shrink-0" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}
