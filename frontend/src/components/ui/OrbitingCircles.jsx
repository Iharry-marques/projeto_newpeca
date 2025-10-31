import * as React from "react";
import { cn } from "@/lib/utils";

export function OrbitingCircles({
  className,
  children,
  reverse = false,
  duration = 20,
  delay = 0,
  radius = 50,
  path = true,
  iconSize = 40, // Prop da sua captura de tela
  speed = 1, // Prop da sua captura de tela
  ...props
}) {
  const id = React.useId();
  const animationName = `orbit-${id}`;
  const animationDuration = `${duration * speed}s`; // Ajusta duração pela velocidade

  return (
    <>
      {/* Estilos CSS dinâmicos para a animação */}
      <style>{`
        @keyframes ${animationName} {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(${reverse ? -360 : 360}deg);
          }
        }
      `}</style>

      <div
        {...props}
        className={cn(
          "relative flex items-center justify-center",
          className
        )}
        style={{
          "--radius": `${radius}px`,
          "--duration": animationDuration,
          "--delay": `${delay}s`,
        }}
      >
        {/* Círculo do Caminho (opcional) */}
        {path && (
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-slate-400/30"
            style={{ width: `calc(var(--radius) * 2)`, height: `calc(var(--radius) * 2)` }}
          />
        )}

        {/* Container que gira */}
        <div
          className="absolute left-1/2 top-1/2 h-0 w-0"
          style={{
            animation: `${animationName} var(--duration) linear infinite`,
            animationDelay: "var(--delay)",
          }}
        >
          {React.Children.map(children, (child, index) => {
            const angle = (360 / React.Children.count(children)) * index;
            const sizeStyle = typeof iconSize === 'number' ? `${iconSize}px` : iconSize;
            
            return (
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{
                  transform: `rotate(${angle}deg) translate(var(--radius)) rotate(${-angle}deg)`,
                  width: sizeStyle,
                  height: sizeStyle,
                }}
              >
                {child}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
