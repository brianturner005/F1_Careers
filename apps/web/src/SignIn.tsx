import { useState } from 'react';
import type { FormEvent } from 'react';
import { requestMagicLink } from './api.js';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export function SignIn() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setStatus('sending');
    try {
      await requestMagicLink(email);
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return <p>Check {email} for a sign-in link. It expires in 15 minutes.</p>;
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Sign in">
      <p>Sign in to save searches and get email alerts for new postings.</p>
      <input
        type="email"
        required
        placeholder="you@example.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <button type="submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Send sign-in link'}
      </button>
      {status === 'error' && <p role="alert">Something went wrong. Try again.</p>}
    </form>
  );
}
