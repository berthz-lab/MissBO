import { useEffect, useRef } from 'react';

/**
 * Persiste o estado de um formulário no sessionStorage.
 * Se a página recarregar (ex: browser mobile matando a aba), os campos são restaurados.
 *
 * @param key   - Chave única para o formulário (ex: 'form-cliente-novo')
 * @param form  - Estado atual do formulário
 * @param setForm - Setter do estado
 * @param enabled - Só persiste quando true (ex: modal aberto)
 *
 * Retorna `clearPersist()` para limpar após salvar com sucesso.
 */
export function useFormPersist<T extends Record<string, unknown>>(
  key: string,
  form: T,
  setForm: (f: T) => void,
  enabled = true,
) {
  const storageKey = `missbo_form_${key}`;
  const restoredRef = useRef(false);

  // Restaura na montagem (ou quando habilitado)
  useEffect(() => {
    if (!enabled || restoredRef.current) return;
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as T;
        setForm(parsed);
        restoredRef.current = true;
      }
    } catch {
      // sessionStorage indisponível ou JSON inválido — ignora
    }
  }, [enabled, storageKey]);

  // Salva a cada mudança no formulário
  useEffect(() => {
    if (!enabled) return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(form));
    } catch {
      // Quota excedida — ignora silenciosamente
    }
  }, [form, enabled, storageKey]);

  // Limpa ao desabilitar (ex: modal fechado sem salvar)
  useEffect(() => {
    if (!enabled) {
      sessionStorage.removeItem(storageKey);
      restoredRef.current = false;
    }
  }, [enabled, storageKey]);

  const clearPersist = () => {
    sessionStorage.removeItem(storageKey);
    restoredRef.current = false;
  };

  return { clearPersist };
}
