import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

// A függvény neve "middleware" helyett "proxy" lett!
export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

// A matcher konfiguráció marad a régi
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}