import { useState } from 'react';
import type { FormEvent } from 'react';
import type { AlertFrequency } from '@f1-job-radar/schema';
import { ALERT_FREQUENCIES } from '@f1-job-radar/schema';
import { createSavedSearch, type JobFilters } from './api.js';

interface SaveSearchFormProps {
  filters: JobFilters;
}

type Status = 'idle' | 'saving' | 'saved' | 'error';

export function SaveSearchForm({ filters }: SaveSearchFormProps) {
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState<AlertFrequency>('daily');
  const [status, setStatus] = useState<Status>('idle');

  const hasFilters = Object.values(filters).some(Boolean);

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setStatus('saving');
    try {
      await createSavedSearch({ name, filters, frequency });
      setStatus('saved');
      setName('');
    } catch {
      setStatus('error');
    }
  }

  if (!hasFilters) {
    return <p className="state-message">Set at least one filter above to save it as an alert.</p>;
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Save this search" className="card">
      <input
        type="text"
        placeholder="Name this search (e.g. SRE roles)"
        value={name}
        onChange={(event) => setName(event.target.value)}
        required
      />
      <select
        aria-label="Alert frequency"
        value={frequency}
        onChange={(event) => setFrequency(event.target.value as AlertFrequency)}
      >
        {ALERT_FREQUENCIES.map((freq) => (
          <option key={freq} value={freq}>
            {freq}
          </option>
        ))}
      </select>
      <button type="submit" disabled={status === 'saving'}>
        Save &amp; get alerts
      </button>
      {status === 'saved' && <span>Saved!</span>}
      {status === 'error' && <span role="alert">Couldn&apos;t save. Try again.</span>}
    </form>
  );
}
