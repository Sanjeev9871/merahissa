export function statusLabel(status: string): string {
  switch (status) {
    case 'draft': return 'Not finished';
    case 'intake_complete': return 'Ready to pay';
    case 'awaiting_payment': return 'Waiting for payment';
    case 'paid': return 'Paid — preparing your documents';
    case 'generating': return 'Preparing your documents';
    case 'in_review': return 'We are checking a few things';
    case 'delivered': return 'Your documents are ready';
    case 'closed': return 'Closed';
    default: return 'In progress';
  }
}