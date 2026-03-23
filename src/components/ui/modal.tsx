import { useEffect, type PropsWithChildren, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { cn } from "../../lib/utils";

type ModalProps = PropsWithChildren<{
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  footer?: ReactNode;
  size?: "md" | "lg";
}>;

const sizeClasses = {
  md: "max-w-xl",
  lg: "max-w-3xl",
};

export function Modal({ open, onClose, title, description, footer, size = "md", children }: ModalProps) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-8">
      <div className="absolute inset-0" onClick={onClose} />
        <div className={cn("relative w-full rounded-3xl bg-white", sizeClasses[size])}>
        <div className="border-b border-stone-200 px-6 py-5">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          {description ? <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p> : null}
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer ? <div className="flex flex-wrap justify-end gap-3 border-t border-stone-200 px-6 py-4">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
