import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';

const ISSUER = 'Miss Bô Ateliê';
const ACCOUNT = 'missbo';

/** Gera um novo secret TOTP aleatório (base32) */
export function generateTotpSecret(): string {
  const totp = new OTPAuth.TOTP({ issuer: ISSUER, label: ACCOUNT, algorithm: 'SHA1', digits: 6, period: 30 });
  return totp.secret.base32;
}

/** Gera a URI otpauth:// para o QR code */
export function generateTotpUri(secret: string): string {
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    label: ACCOUNT,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
  return totp.toString();
}

/** Gera o QR code como data URL (PNG base64) */
export async function generateQRCode(secret: string): Promise<string> {
  const uri = generateTotpUri(secret);
  return QRCode.toDataURL(uri, { width: 240, margin: 2, color: { dark: '#0A0A0A', light: '#FFFFFF' } });
}

/** Verifica se o código de 6 dígitos é válido para o secret.
 *  Aceita ±1 período (30s) para compensar diferença de relógio. */
export function verifyTotp(secret: string, code: string): boolean {
  try {
    const totp = new OTPAuth.TOTP({
      issuer: ISSUER,
      label: ACCOUNT,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    });
    const delta = totp.validate({ token: code.replace(/\s/g, ''), window: 1 });
    return delta !== null;
  } catch {
    return false;
  }
}
