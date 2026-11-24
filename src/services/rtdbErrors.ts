import type { User as FirebaseUser } from 'firebase/auth';
import { ApiError } from '../api/client';
import { auth } from '../firebase/firebase';

const IS_DEV = Boolean((import.meta as { env?: { DEV?: boolean } }).env?.DEV);

export function requireAuthenticatedUser(endpoint: string, method: string): FirebaseUser {
  const user = auth.currentUser;
  if (!user) {
    throw new ApiError({
      message: 'Please sign in to access your private health records.',
      code: 'UNAUTHORIZED',
      status: 401,
      endpoint,
      method,
    });
  }
  return user;
}

export function isPermissionDeniedError(err: unknown): boolean {
  const code =
    err && typeof err === 'object' && 'code' in err
      ? String((err as { code: unknown }).code).toLowerCase()
      : '';
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err || '').toLowerCase();
  return (
    code.includes('permission_denied') ||
    code.includes('permission-denied') ||
    msg.includes('permission_denied') ||
    msg.includes('permission denied')
  );
}

export function isNetworkOrUnavailableError(err: unknown): boolean {
  const code =
    err && typeof err === 'object' && 'code' in err
      ? String((err as { code: unknown }).code).toLowerCase()
      : '';
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err || '').toLowerCase();
  return (
    code.includes('network') ||
    code.includes('unavailable') ||
    msg.includes('network') ||
    msg.includes('offline') ||
    msg.includes('disconnected')
  );
}

export function wrapRtdbError(
  err: unknown,
  endpoint: string,
  method: string,
  fallback: string,
  uid?: string,
): ApiError {
  if (err instanceof ApiError) return err;

  const rawCode =
    err && typeof err === 'object' && 'code' in err ? String((err as { code: unknown }).code) : '';
  const rawMessage = err instanceof Error && err.message ? err.message : fallback;

  if (IS_DEV) {
    console.error('[Firebase RTDB Error]', {
      endpoint,
      method,
      uid: uid || auth.currentUser?.uid || null,
      code: rawCode || undefined,
      message: rawMessage,
    });
  }

  if (isPermissionDeniedError(err)) {
    return new ApiError({
      message:
        'Database access was denied for your account. Ensure your email is verified and Firebase Realtime Database rules permit authenticated access to your own records.',
      code: 'FORBIDDEN',
      status: 403,
      endpoint,
      method,
    });
  }

  if (isNetworkOrUnavailableError(err)) {
    return new ApiError({
      message: 'Unable to reach Firebase Realtime Database right now. Check your connection and try again.',
      code: 'BACKEND_UNAVAILABLE',
      status: 503,
      endpoint,
      method,
    });
  }

  return new ApiError({
    message: rawMessage,
    code: 'SERVER_ERROR',
    status: 500,
    endpoint,
    method,
  });
}
