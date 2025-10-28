import React from "react";
import { useNavigate } from "react-router-dom";
import aprobiLogo from "@/assets/aprobi-logo-beta.svg";
import { cn } from "@/lib/utils";

function LogoButton({ buttonClassName = "", imageClassName = "", onClick, ...rest }) {
  const navigate = useNavigate();

  const handleClick = (event) => {
    if (onClick) {
      onClick(event);
      if (event.defaultPrevented) {
        return;
      }
    }
    navigate("/");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "inline-flex items-center justify-center p-0 bg-transparent border-0",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-400",
        buttonClassName
      )}
      aria-label="Voltar para a página inicial"
      {...rest}
    >
      <img
        src={aprobiLogo}
        alt="Aprobi"
        className={cn("h-auto", imageClassName)}
      />
    </button>
  );
}

export default LogoButton;
