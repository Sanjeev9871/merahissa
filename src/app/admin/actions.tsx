'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Approve or reject a pack.
 *
 * A held pack cannot be approved from here at all — the button is not
 * rendered. Overriding a hold means fixing what caused it (re-verifying a
 * stale rule set, regenerating after a bad model response) and letting the
 * pack regenerate clean. An "approve anyway" button would, within a month,
 * become the button everyone uses.
 */
export function ReviewActions({ packId, caseId, held }: {
  packId: string; caseId: string; held: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  async function act(action: 'approve' | 'reject') {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/packs/${packId}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action, notes, caseId }),
      });

      if (res.ok) {
        router.refresh();
        return;
      }

      // Surface the failure rather than leaving the click looking like a no-op:
      // a 401 (expired session), the 409 for approving a held pack, or a 500.
      const body = await res.json().catch(() => ({}));
      setError(
        body.error
          ?? `That did not go through (error ${res.status}). Nothing was changed.`,
      );
    } catch {
      setError('We could not reach the server. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ marginTop: '1rem' }}>
      <div className="field">
        <label htmlFor={`notes-${packId}`}>Review notes</label>
        <input id={`notes-${packId}`} type="text" value={notes}
          placeholder="What you checked, or what needs fixing"
          onChange={(e) => setNotes(e.target.value)} />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {held ? (
          <p className="hint" style={{ margin: 0 }}>
            This pack is held and cannot be approved. Fix the cause above, then
            regenerate it.
          </p>
        ) : (
          <button type="button" className="primary" disabled={busy}
            onClick={() => act('approve')}>
            {busy ? 'Working…' : 'Approve and deliver'}
          </button>
        )}
        <button type="button" className="quiet" disabled={busy}
          onClick={() => act('reject')}>
          Reject and hold
        </button>
      </div>

      {error && <p className="error" role="alert" style={{ marginTop: '0.75rem' }}>{error}</p>}
    </div>
  );
}
