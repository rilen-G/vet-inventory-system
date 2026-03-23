import { forwardRef, useRef } from "react";
import type { InputHTMLAttributes } from "react";

import { cn } from "../../lib/utils";
import { Input } from "./input";

type NumberInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;
type InternalNumberInputProps = NumberInputProps & {
  showStepper?: boolean;
};

export const NumberInput = forwardRef<HTMLInputElement, InternalNumberInputProps>(
  ({ className, showStepper = true, ...props }, ref) => {
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

    function emitUpdates(input: HTMLInputElement) {
      const inputEvent = new Event("input", { bubbles: true });
      input.dispatchEvent(inputEvent);

      const changeEvent = new Event("change", { bubbles: true });
      input.dispatchEvent(changeEvent);
    }

    function step(direction: "up" | "down") {
      const input = internalRef.current;

      if (!input || input.disabled || input.readOnly) {
        return;
      }

      if (direction === "up") {
        input.stepUp();
      } else {
        input.stepDown();
      }

      input.focus();
      emitUpdates(input);
    }

    return (
      <div className="relative">
        <Input
          type="number"
          className={cn("number-input", showStepper ? "pr-14" : undefined, className)}
          {...props}
          ref={assignRef}
        />
        {showStepper ? (
          <div className="absolute inset-y-0 right-3 flex w-6 flex-col items-center justify-center gap-0.5">
          <button
            type="button"
            className="inline-flex h-4 items-center justify-center text-slate-500 transition hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-stone-300"
            onClick={() => step("up")}
            aria-label="Increase value"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="size-4"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M9.47 6.47a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 1 1-1.06 1.06L10 8.06l-3.72 3.72a.75.75 0 0 1-1.06-1.06l4.25-4.25Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <button
            type="button"
            className="inline-flex h-4 items-center justify-center text-slate-500 transition hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-stone-300"
            onClick={() => step("down")}
            aria-label="Decrease value"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="size-4"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          </div>
        ) : null}
      </div>
    );
  },
);

NumberInput.displayName = "NumberInput";
