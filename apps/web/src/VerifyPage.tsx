import { useEffect, useState } from 'react';
import { setSessionToken, verifyMagicLink } from './api.js';

type Status = 'verifying' | 'success' | 'error';

export function VerifyPage() {
  const [status, setStatus] = useState<Status>('verifying');

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) {
      setStatus('error');
      return;
    }

    verifyMagicLink(token)
      .then((data) => {
        setSessionToken(data.sessionToken);
        setStatus('success');
        window.location.href = '/';
      })
      .catch(() => setStatus('error'));
  }, []);

  return (
    <main>
      <h1>F1 Job Radar</h1>
      {status === 'verifying' && <p>Signing you in…</p>}
      {status === 'success' && <p>Signed in! Redirecting…</p>}
      {status === 'error' && (
        <p>This sign-in link is invalid or has expired. Go back and request a new one.</p>
      )}
    </main>
  );
}
