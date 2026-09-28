// Fase 6.1 - Google Drive. Estes identificadores são públicos por natureza
// (aparecem no navegador de qualquer visitante). A segurança vem das
// restrições configuradas no Google Cloud: origem JavaScript permitida,
// referrer da chave de API e escopo drive.file (somente os arquivos que o
// usuário escolher na Google Picker).
export const GOOGLE_CLIENT_ID: string = '560279256157-j121ndqjsj9ckqleqf42hvgf6ic3t86s.apps.googleusercontent.com'
export const GOOGLE_API_KEY: string = 'AIzaSyB1lnEmt3W5rBlaOZAGf9UUwNTqdaxIT0s'
export const GOOGLE_APP_ID = '560279256157'
export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file'
export const driveConfigured = () => GOOGLE_CLIENT_ID !== '' && GOOGLE_API_KEY !== ''
