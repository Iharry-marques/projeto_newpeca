// Em: frontend/src/pages/LoginPageProduceria.jsx

import React from "react";
import aprobiLogo from "../assets/aprobi-logo-beta.svg";

const GOOGLE_AUTH_URL = `${import.meta.env.VITE_BACKEND_URL}/auth/google`;

export default function LoginPageProduceria() {
  const handleLogin = () => {
    window.location.href = GOOGLE_AUTH_URL;
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-xl sm:p-10">
        <img
          src={aprobiLogo}
          alt="Aprobi"
          className="mx-auto mb-5 h-auto w-24"
        />
        <h1 className="mb-2 text-2xl font-bold text-slate-800">
          Aprobi • Login Produceria
        </h1>
        <p className="mb-6 text-slate-500">
          Entre com sua conta Google Produceria.
        </p>
        <button
          onClick={handleLogin}
          className="w-full transform rounded-xl bg-slate-800 px-4 py-3 font-semibold text-[#ffb700] shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-slate-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
        >
          Entrar com Google
        </button>
      </div>
    </div>
  );
}
