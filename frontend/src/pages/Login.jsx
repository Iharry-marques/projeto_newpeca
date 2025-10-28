import React from "react";
import { useNavigate } from "react-router-dom";
import { DotPattern } from "@/components/ui/dot-pattern";
import { ShineBorder } from "@/components/magicui/shine-border";
import { cn } from "@/lib/utils";
import LogoButton from "@/components/LogoButton";

const GOOGLE_AUTH_URL = `${import.meta.env.VITE_BACKEND_URL}/auth/google`;

export default function LoginPage() {
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    window.location.href = GOOGLE_AUTH_URL;
  };

  const handleClientPortalRedirect = () => {
    navigate("/client/login");
  };

  const aprobiShineColors = [
    "#FFDA0A",
    "#FFB700",
    "#FFC72C",
    "#FFA500",
    "#FF9500",
  ];

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 p-4 sm:p-6 lg:p-8">
      <ShineBorder
        className="relative z-10 w-full max-w-md shadow-2xl"
        colors={aprobiShineColors}
        borderWidth={1}
        duration={8}
        borderRadius={32}
      >
        <div className="rounded-[28px] bg-white/95 p-10 text-center backdrop-blur-sm">
          <LogoButton buttonClassName="mx-auto mb-6" imageClassName="w-24" />
          <h1 className="mb-3 text-3xl font-bold text-slate-800">
            Bem-vindo ao Aprobi
          </h1>
          <p className="mb-8 text-slate-500">
            Selecione seu tipo de acesso abaixo.
          </p>

          <div className="mb-6 space-y-3">
            <p className="text-sm font-medium text-slate-600">
              Acesso para colaboradores Suno:
            </p>
            <button
              onClick={handleGoogleLogin}
              className="w-full transform rounded-xl bg-gradient-to-r from-[#ffc801] to-[#ffb700] py-3 px-4 font-semibold text-slate-900 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
            >
              Entrar com Google
            </button>
          </div>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-2 text-sm text-slate-400">OU</span>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-600">
              Acesso exclusivo para clientes:
            </p>
            <button
              onClick={handleClientPortalRedirect}
              className="w-full transform rounded-xl bg-slate-800 py-3 px-4 font-semibold text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-slate-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
            >
              Acessar Portal do Cliente
            </button>
          </div>
        </div>
      </ShineBorder>

      <DotPattern
        width={25}
        height={25}
        cx={1.5}
        cy={1.5}
        cr={1}
        className={cn("absolute inset-0 h-full w-full fill-slate-400/60")}
      />
    </div>
  );
}
