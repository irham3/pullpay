"use client";

import * as React from "react";
import { Button } from "./Button";
import { AlertCircle } from "lucide-react";

type ConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
};

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  destructive = false,
}: ConfirmModalProps) {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#0B0F14]/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative z-[101] w-full max-w-md overflow-hidden rounded-[12px] border border-border bg-surface p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 sm:rounded-[16px]">
        <div className="flex gap-4">
          <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${destructive ? 'bg-bad/10 text-bad' : 'bg-accent/10 text-accent'}`}>
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-medium tracking-tight text-text">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {description}
            </p>
          </div>
        </div>
        
        <div className="mt-8 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            {cancelText}
          </Button>
          <Button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            variant={destructive ? "danger" : "default"}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
