import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

const ADMIN_ROLES = ['superadmin', 'admin', 'admin_reader']

export async function proxy(request: NextRequest) {
  const sessionResponse = await updateSession(request)

  const pathname = request.nextUrl.pathname
  const isAdminLoginPage = pathname.startsWith('/admin/login')
  const isAdminPage      = pathname.startsWith('/admin') && !isAdminLoginPage
  const isUserLoginPage  = pathname === '/login'

  if (!isAdminLoginPage && !isAdminPage && !isUserLoginPage) {
    return sessionResponse
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            sessionResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return sessionResponse

  const { data: roleRow } = await supabase
    .from('user_roles').select('role').eq('id', user.id).single()
  const role = roleRow?.role ?? 'user'
  const isAdmin = ADMIN_ROLES.includes(role)

  const redirect = (path: string) => {
    const url = request.nextUrl.clone()
    url.pathname = path
    return NextResponse.redirect(url)
  }

  if (isAdmin && isUserLoginPage)   return redirect('/admin/login')
  if (isAdmin && isAdminLoginPage)  return redirect('/admin')
  if (!isAdmin && isAdminLoginPage) return redirect('/login')
  if (!isAdmin && isAdminPage)      return redirect('/')

  return sessionResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}