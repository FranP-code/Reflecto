import { useId, useState } from "react";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "#3b82f6", // blue-500
  "#22c55e", // green-500
  "#a855f7", // purple-500
  "#f59e0b", // amber-500
  "#ec4899", // pink-500
  "#06b6d4", // cyan-500
  "#ef4444", // red-500
  "#10b981", // emerald-500
] as const;

export type ColorValue = (typeof PRESET_COLORS)[number];

export function ColorPicker({
  value,
  onChange,
  className,
  colors = PRESET_COLORS,
  size = 24,
  name,
}: {
  value?: string | null;
  onChange?: (v: ColorValue) => void;
  className?: string;
  colors?: readonly string[];
  size?: number;
  name?: string;
}) {
  const groupId = useId();
  const [internal, setInternal] = useState<string | null>(
    value ?? colors[0] ?? null
  );
  const active = value ?? internal;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {colors.map((c) => {
        const isActive = c.toLowerCase() === (active ?? "").toLowerCase();
        const id = `${groupId}-${c}`;
        return (
          <label
            className="group inline-flex cursor-pointer items-center justify-center"
            htmlFor={id}
            key={c}
          >
            <input
              checked={isActive}
              className="sr-only"
              id={id}
              name={name ?? groupId}
              onChange={() => {
                setInternal(c);
                onChange?.(c as ColorValue);
              }}
              type="radio"
              value={c}
            />
            <span
              aria-hidden
              className={cn(
                "inline-flex rounded-full border border-border/40 ring-offset-background transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isActive ? "ring-2 ring-ring ring-offset-2" : ""
              )}
              style={{
                width: size,
                height: size,
                backgroundColor: c,
              }}
            />
            <span className="sr-only">{c}</span>
          </label>
        );
      })}
    </div>
  );
}
