import { useEffect, useRef, useState } from 'react';

/**
 * Persiste o estado de um formulário no sessionStorage.
 *
 * Comportamento:
 * - Salva o formulário a cada mudança enquanto `active = true`
 * - Se a página recarregar, detecta dados salvos → retorna `hasPersisted = true`
 * - O componente pode usar `hasPersisted` para reabrir o modal automaticamente
 * - Ao reabrir, restaura os dados automaticamente
 * - Chame `clearPersist()` após salvar com sucesso
 * - Se fechar o modal sem salvar (active: true → false), limpa os dados
 *
 * @param key     Chave única (ex: 'cliente', 'contrato')
 * @param form    Estado atual do formulário
 * @param setForm Setter do estado
 * @param active  true quando o modal de NOVO registro está aberto
 */
export function useFormPersist<T extends object>(
  key: string,
  form: T,
  setForm: (f: T) => void,
  active: boolean,
) {
  const storageKey = `missbo_form_${key}`;
  const prevActiveRef = useRef<boolean | null>(null);
  const restoredRef   = useRef(false);

  // Detecta dados salvos na montagem (antes do primeiro render)
  const [hasPersisted] = useState<boolean>(() => {
    try { return !!sessionStorage.getItem(storageKey); }
    catch { return false; }
  });

  // Restaura quando o modal abre (active vira true)
  useEffect(() => {
    const wasActive = prevActiveRef.current;
    prevActiveRef.current = active;

    if (active && !restoredRef.current) {
      // Modal acabou de abrir — restaura se houver dados salvos
      try {
        const saved = sessionStorage.getItem(storageKey);
        if (saved) {
          setForm(JSON.parse(saved) as T);
          restoredRef.current = true;
        }
      } catch { /* sessionStorage indisponível */ }
      return;
    }

    if (!active && wasActive === true) {
      // Modal fechou sem salvar → limpa
      sessionStorage.removeItem(storageKey);
      restoredRef.current = false;
    }
  }, [active, storageKey, setForm]);

  // Salva a cada mudança enquanto o modal está aberto
  useEffect(() => {
    if (!active) return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(form));
    } catch { /* quota excedida — ignora */ }
  }, [form, active, storageKey]);

  const clearPersist = () => {
    sessionStorage.removeItem(storageKey);
    restoredRef.current = false;
  };

  return { clearPersist, hasPersisted };
}
