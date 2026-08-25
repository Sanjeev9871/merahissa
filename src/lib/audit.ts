import { supabaseAdmin } from './supabase/server';

/**
 * Append-only audit trail.
 *
 * Written with the service role because the audit_log table grants no UPDATE
 * or DELETE to any application role — not even to us. The point of an audit
 * log is that the system which produced an entry cannot later remove it.
 *
 * What goes in `detail` is metadata only: counts, ids, statuses. Never a
 * name, never a document, never a value. An audit log that contains case data
 * is a second copy of the case data with a longer retention period.
 */

export type AuditAction =
  | 'case.create' | 'case.view' | 'case.update' | 'case.delete'
  | 'doc.upload' | 'doc.download' | 'doc.purge'
  | 'pack.generate' | 'pack.approve' | 'pack.reject' | 'pack.download'
  | 'payment.verified'
  | 'admin.queue_view';

export async function audit(
  action: AuditAction,
  opts: {
    actorId?: string | null;
    caseId?: string | null;
    detail?: Record<string, string | number | boolean | null>;
  } = {},
): Promise<void> {
  try {
    const auditEntry = {
      actor_id: opts.actorId ?? null,
      action,
      case_id: opts.caseId ?? null,
      detail: opts.detail ?? null,
    };

    await supabaseAdmin()
      .from('audit_log')
      .insert(auditEntry as never);
  } catch (e) {
    // An audit write must never take down the operation it is recording, but
    // a silent failure would hollow out the trail. Log loudly; alert on it.
    console.error(`[audit] FAILED to record "${action}"`, e);
  }
}
