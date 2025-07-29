import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/settings',
  '/api/protected',
];

// Auth routes that should redirect if already logged in
const authRoutes = ['/auth/login', '/auth/signup'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Get tokens from httpOnly cookies
  const accessToken = request.cookies.get('sb_access_token')?.value;
  const refreshToken = request.cookies.get('sb_refresh_token')?.value;

  // Check if current path is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    path.startsWith(route)
  );
  
  // Check if current path is auth route
  const isAuthRoute = authRoutes.some(route => 
    path.startsWith(route)
  );

  // If no tokens and trying to access protected route
  if (isProtectedRoute && !accessToken) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(loginUrl);
  }

  // If has tokens, validate them
  if (accessToken) {
    try {
      // Create Supabase client for server-side validation
      const supabase = createClient(
        process.env['NEXT_PUBLIC_SUPABASE_URL']!,
        process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
        {
          auth: {
            storage: {
              getItem: (key: string) => {
                if (key === 'sb-access-token') return accessToken ?? null;
                if (key === 'sb-refresh-token') return refreshToken ?? null;
                return null;
              },
              setItem: () => {},
              removeItem: () => {},
            },
          },
        }
      );

      // Validate the token by getting user
      const { data: { user }, error } = await supabase.auth.getUser(accessToken);

      if (error || !user) {
        // Token is invalid, clear cookies and redirect to login
        const response = NextResponse.redirect(new URL('/auth/login', request.url));
        response.cookies.set('sb_access_token', '', { maxAge: 0 });
        response.cookies.set('sb_refresh_token', '', { maxAge: 0 });
        return response;
      }

      // If valid token and trying to access auth routes, redirect to dashboard
      if (isAuthRoute) {
        return NextResponse.redirect(new URL('/', request.url));
      }

    } catch (error) {
      console.error('Token validation error:', error);
      
      // On error, clear cookies and redirect to login if accessing protected route
      if (isProtectedRoute) {
        const response = NextResponse.redirect(new URL('/auth/login', request.url));
        response.cookies.set('sb_access_token', '', { maxAge: 0 });
        response.cookies.set('sb_refresh_token', '', { maxAge: 0 });
        return response;
      }
    }
  }

  // Continue with the request
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)  
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};