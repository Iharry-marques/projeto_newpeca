import React from "react";
import { OrbitingCircles } from "@/components/ui/OrbitingCircles";
import { cn } from "@/lib/utils";

// --- Ícones como componentes SVG ---
// (Vou manter os SVGs que criei antes)

// Baseado no seu favicon.png e aprobi-logo.jpg
const IconAprobi = (props) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M12 2L3 22H7L8.6 18H15.4L17 22H21L12 2ZM12 7.6L14.4 14H9.6L12 7.6Z"
      fill="#FFC801"
    />
    <path
      d="M10.5 12.5L12 14.5L16 9.5"
      stroke="#272727"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Círculo amarelo simples, baseado no seu suno_logo.jpeg
const IconSuno = (props) => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="12" cy="12" r="10" fill="#FFC801" />
  </svg>
);

// Baseado no SVG do exemplo do Google Drive
const IconGoogleDrive = (props) => (
  <svg viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066DA"/>
    <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00AC47"/>
    <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#EA4335"/>
    <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832D"/>
    <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684FC"/>
    <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#FFBA00"/>
  </svg>
);

// --- Componente de Loading (AGORA COMO OVERLAY) ---

/**
 * @param {Object} props
 * @param {boolean} props.isOpen - Controla a visibilidade do overlay
 * @param {string} [props.text] - Texto opcional para exibir (ex: "Processando Pasta X...")
 */
const LoadingSpinner = ({ isOpen, text = "Processando arquivos..." }) => {
  if (!isOpen) {
    return null;
  }

  return (
    // O Overlay de tela inteira
    <div
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center",
        "bg-slate-900/60 backdrop-blur-sm"
      )}
    >
      {/* O Container da Animação */}
      <div
        className={cn(
          "relative flex h-[400px] w-[400px] max-w-[90vw] max-h-[90vw]",
          "flex-col items-center justify-center overflow-hidden"
        )}
      >
        {/* Círculo 1 (Interno) - 2x Aprobi */}
        <OrbitingCircles
          className="size-[30px] border-none bg-transparent"
          iconSize={30}
          radius={80}
          speed={1.2}
          delay={0}
        >
          <IconAprobi className="size-full text-slate-900" />
          <IconAprobi className="size-full text-slate-900" />
        </OrbitingCircles>

        {/* Círculo 2 (Meio) - 3x Suno */}
        <OrbitingCircles
          className="size-[40px] border-none bg-transparent"
          iconSize={30}
          radius={150}
          speed={1}
          delay={1}
        >
          <IconSuno className="size-full" />
          <IconSuno className="size-full" />
          <IconSuno className="size-full" />
        </OrbitingCircles>

        {/* Círculo 3 (Externo) - 3x Drive */}
        <OrbitingCircles
          className="size-[40px] border-none bg-transparent"
          iconSize={30}
          radius={220}
          reverse
          speed={0.8}
          delay={0.5}
        >
          <IconGoogleDrive className="size-full" />
          <IconGoogleDrive className="size-full" />
          <IconGoogleDrive className="size-full" />
        </OrbitingCircles>
      </div>
      
      {/* Texto de Loading */}
      {text && (
        <div className="mt-4 rounded-lg bg-white/90 px-4 py-2 shadow-lg">
          <p className="text-base font-medium text-slate-700">{text}</p>
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner;
