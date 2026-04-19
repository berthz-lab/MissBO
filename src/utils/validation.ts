/** Validates Brazilian CPF (11 digits, with or without formatting) */
export function isValidCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false; // all same digits

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  if (parseInt(digits[9]) !== check) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  if (parseInt(digits[10]) !== check) return false;

  return true;
}

/** Validates email format */
export function isValidEmail(email: string): boolean {
  if (!email) return true; // optional field
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Validates phone — Brazilian (10-11 digits) or international (starts with +, 7-15 digits) */
export function isValidPhone(phone: string): boolean {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (trimmed.startsWith('+')) return digits.length >= 7 && digits.length <= 15;
  return digits.length === 10 || digits.length === 11;
}

/** Formats CPF: 123.456.789-00 */
export function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

/** Formats phone — applies Brazilian mask or passes international numbers through as-is */
export function formatPhone(value: string): string {
  if (value.trimStart().startsWith('+')) {
    // Internacional: permite dígitos, espaços, hífens e parênteses — sem máscara rígida
    return value.replace(/[^\d\s\+\-\(\)]/g, '');
  }
  // Máscara brasileira
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/** Max file size check (returns error message or null) */
export function checkFileSize(file: File, maxMB: number): string | null {
  if (file.size > maxMB * 1024 * 1024) {
    return `Arquivo muito grande. Máximo ${maxMB}MB.`;
  }
  return null;
}
