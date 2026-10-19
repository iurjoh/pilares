import { describe, expect, it } from 'vitest'
import { MAX_LOCAL_PDF_BYTES, validateLocalPdf } from '../library/localFile'
// Browser-compatible file-like fixtures avoid relying on jsdom Blob.arrayBuffer.
function file(name: string, type: string, contents: string, size = contents.length): File {
  return { name, type, size, slice: () => ({ arrayBuffer: async () => new TextEncoder().encode(contents).buffer }) } as unknown as File
}
describe('local PDF validation', () => {
  it('accepts PDF signature with normal extension', async () => expect(await validateLocalPdf(file('private.pdf', '', '%PDF-1.7\n'))).toBeNull())
  it('accepts MIME type with an unhelpful file extension', async () => expect(await validateLocalPdf(file('document', 'application/pdf', '%PDF-2.0\n'))).toBeNull())
  it('rejects a renamed HTML file', async () => expect(await validateLocalPdf(file('fake.pdf', 'application/pdf', '<script>alert(1)</script>'))).toBe('format'))
  it('rejects non-PDF extension and MIME', async () => expect(await validateLocalPdf(file('bad.html', 'text/html', '%PDF-1.7'))).toBe('format'))
  it('rejects empty files', async () => expect(await validateLocalPdf(file('empty.pdf', 'application/pdf', '', 0))).toBe('size'))
  it('rejects over 50 MB before reading', async () => expect(await validateLocalPdf(file('big.pdf', 'application/pdf', '%PDF-', MAX_LOCAL_PDF_BYTES + 1))).toBe('size'))
})
