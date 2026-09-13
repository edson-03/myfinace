"use client";

/**
 * Formulário que só permite o envio implícito via Enter quando o campo em
 * foco é o ÚLTIMO input de texto do form. Sem isso, o HTML padrão envia o
 * form inteiro (mesmo incompleto) assim que o usuário aperta Enter em
 * QUALQUER campo, o que parecia "os dados somem/o formulário é enviado
 * sozinho antes de terminar de preencher".
 */
export function Form({ onKeyDown, ...props }: React.ComponentProps<"form">) {
  return (
    <form
      {...props}
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") {
          const inputs = Array.from(
            e.currentTarget.querySelectorAll<HTMLInputElement>(
              "input:not([type=hidden]):not([type=checkbox])",
            ),
          );
          const isLastInput = inputs.length > 0 && inputs[inputs.length - 1] === e.target;
          if (!isLastInput) {
            e.preventDefault();
          }
        }
        onKeyDown?.(e);
      }}
    />
  );
}
