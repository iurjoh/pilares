export const MAX_LOCAL_PDF_BYTES = 50 * 1024 * 1024
// File metadata is untrusted. Check size and PDF signature, then let PDF.js validate structure.
export async function validateLocalPdf(file: File): Promise<'size' | 'format' | null> {
  if (file.size === 0 || file.size > MAX_LOCAL_PDF_BYTES) return 'size'
  if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') return 'format'
  const header = new Uint8Array(await file.slice(0, 1024).arrayBuffer())
  const text = Array.from(header, byte => String.fromCharCode(byte)).join('')
  return text.includes('%PDF-') ? null : 'format'
}
