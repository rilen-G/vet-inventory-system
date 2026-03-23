import { forwardRef, useRef } from "react";
import type { InputHTMLAttributes, MouseEventHandler } from "react";

import { cn } from "../../lib/utils";
import { Input } from "./input";

type DateInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(({ className, onFocus, ...props }, ref) => {
  const internalRef = useRef<HTMLInputElement | null>(null);

  function assignRef(element: HTMLInputElement | null) {
    internalRef.current = element;

    if (typeof ref === "function") {
      ref(element);
      return;
    }

    if (ref) {
      ref.current = element;
    }
  }

  const openPicker: MouseEventHandler<HTMLButtonElement> = () => {
    const input = internalRef.current;

    if (!input) {
      return;
    }

    input.focus();
    input.showPicker?.();
  };

  return (
    <div className="relative">
      <Input
        type="date"
        className={cn("calendar-input pr-14", className)}
        onFocus={onFocus}
        {...props}
        ref={assignRef}
      />
      <button
        type="button"
        className="absolute inset-y-0 right-3 inline-flex items-center justify-center text-slate-500 transition hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-stone-300"
        onClick={openPicker}
        aria-label={props["aria-label"] ?? "Open calendar"}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="size-5"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z"
          />
        </svg>
      </button>
    </div>
  );
});

DateInput.displayName = "DateInput";
