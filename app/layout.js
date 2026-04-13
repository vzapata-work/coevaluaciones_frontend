// app/layout.js — layout raíz
// Envuelve toda la app con el proveedor de Google OAuth y el contexto de auth

import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from '@/lib/AuthContext'
import './globals.css'

export const metadata = {
  title: 'Coevaluación - Química General',
  description: 'App de coevaluación y autoevaluación grupal',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  )
}
