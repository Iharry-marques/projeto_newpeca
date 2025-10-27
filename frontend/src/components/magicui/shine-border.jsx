import React, { useId } from "react";
import { cn } from "@/lib/utils";

export function ShineBorder({
  children,
  className,
  borderRadius = 24,
  borderWidth = 2,
  duration = 6,
  colors = ["#facc15", "#fb923c", "#f97316", "#facc15"],
}) {
  const id = useId();
  const radiusValue =
    typeof borderRadius === "number" ? `${borderRadius}px` : borderRadius;
  const gradientStops = colors
    .map((color, index) => `${color} ${(index / (colors.length - 1)) * 100}%`)
    .join(", ");
  const animationName = `shine-border-${id}`;

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        className,
      )}
      style={{
        borderRadius: radiusValue,
        padding: borderWidth,
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          borderRadius: radiusValue,
          background: `conic-gradient(${gradientStops})`,
          animation: `${animationName} ${duration}s linear infinite`,
        }}
        aria-hidden="true"
      />

      <div
        className="relative z-10 h-full w-full"
        style={{
          borderRadius: `calc(${radiusValue} - ${borderWidth}px)`,
          overflow: "hidden",
        }}
      >
        {children}
      </div>

      <style>{`
        @keyframes ${animationName} {
          0% { transform: rotate(0turn); }
          100% { transform: rotate(1turn); }
        }
      `}</style>
    </div>
  );
}
