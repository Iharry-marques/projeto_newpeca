// frontend/src/components/magicui/animated-list.jsx
// *** VERSÃO AJUSTADA ***
import React, { Children, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils"; // Certifique-se que o caminho está correto

// Ajuste o nome da função se necessário (vi que você usou export default antes)
export const AnimatedList = React.memo(
  ({
    className,
    children,
    delay = 50, // Um delay menor fica mais fluido para listas
    maxItems = Number.POSITIVE_INFINITY,
  }) => {
    const [index, setIndex] = useState(-1); // Começa com -1 para animar o primeiro item
    const childrenArray = useMemo(() => Children.toArray(children).slice(0, maxItems), [children, maxItems]);

    useEffect(() => {
       // Resetar a animação se os filhos mudarem (opcional, mas útil)
       setIndex(-1);
       const initialTimeout = setTimeout(() => setIndex(0), 10); // Pequeno delay para iniciar

      return () => clearTimeout(initialTimeout);
    }, [childrenArray.length]); // Depende do tamanho do array

     useEffect(() => {
        if (index === -1 || index >= childrenArray.length -1) return; // Não inicia intervalo se resetado ou se já mostrou todos

        const interval = setInterval(() => {
            setIndex((prevIndex) => {
                if (prevIndex + 1 < childrenArray.length) {
                    return prevIndex + 1;
                }
                clearInterval(interval); // Parar o intervalo
                return prevIndex;
            });
        }, delay);

        return () => clearInterval(interval); // Limpar intervalo
    }, [index, childrenArray.length, delay]); // Reativa o intervalo quando o index muda

    return (
      // Removido h-full e overflow daqui
      <div className={cn("flex flex-col gap-3", className)}> {/* Gap ajustado */}
        {childrenArray.map((child, i) => (
          <div
            key={i} // Melhor usar uma key estável se disponível (ex: campaign.id)
            className={cn(
              "animate-list-item", // Usaremos fade-in-down (definido no CSS)
              "transition-opacity duration-300 ease-out",
              // Mostra item se o índice dele for menor ou igual ao índice atual
              i <= index ? "opacity-100" : "opacity-0"
            )}
            // O style com animationDelay é importante para o efeito escalonado
            // Mas a animação em si vem da classe CSS
          >
            {child}
          </div>
        ))}
      </div>
    );
  }
);

AnimatedList.displayName = "AnimatedList";


export default AnimatedList;