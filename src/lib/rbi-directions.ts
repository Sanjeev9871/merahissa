/**
 * The RBI directions that govern what a bank may demand from a bereaved family.
 *
 * This lives in one place because the same four numbers belong on the guides,
 * in the FAQ, and on every state page — and because they WILL change. A figure
 * copied into fifteen paragraphs is a figure that goes stale in fourteen of
 * them.
 *
 * Every value here was read from the RBI notification itself, not from a
 * summary. The citation is carried alongside the numbers so that anyone
 * reviewing this page can check it in one click, and so that `verifiedOn`
 * makes the age of the claim visible rather than implied.
 *
 * Source: Reserve Bank of India (Settlement of Claims in respect of Deceased
 * Customers of Banks) Directions, 2025 — issued 26 September 2025.
 * https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12901&Mode=0
 */

export const RBI_DECEASED_CLAIMS = {
  /** Short name, as it should appear in prose. */
  name: 'RBI (Settlement of Claims in respect of Deceased Customers of Banks) Directions, 2025',
  issued: '2025-09-26',
  url: 'https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12901&Mode=0',

  /**
   * Paragraph 7(h). Every bank must fix a threshold below which it settles a
   * claim on a declaration and indemnity rather than sending the family to
   * court. These are FLOORS, not ceilings — a bank may fix a higher limit, and
   * several do. So "ask your branch" remains the right advice; what changed is
   * that the family now knows the answer cannot lawfully be lower than this.
   */
  thresholdFloor: {
    scheduledBank: '₹15 lakh',
    cooperativeBank: '₹5 lakh',
    paragraph: '7(h)',
  },

  /** Paragraph 31. Runs from receipt of *all* documents, not from first contact. */
  settlementDays: 15,

  /** Paragraph 5. Banks had until this date to comply. */
  complyBy: '2026-03-31',

  verifiedOn: '2026-09-15',
} as const;

/**
 * The sentence we use whenever the threshold is mentioned. Written once so the
 * caveat travels with the number everywhere it appears — the number on its own
 * would read as a guarantee, and it is not one.
 */
export const THRESHOLD_CAVEAT =
  'That is the regulatory floor, not a promise: a bank may set its limit higher, '
  + 'and the figure it applies to your case is the one its own policy names. '
  + 'Ask the branch in writing what their limit is before you assume you need a court.';
