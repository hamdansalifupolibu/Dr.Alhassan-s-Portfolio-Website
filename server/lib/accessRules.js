/**
 * Single source of truth for "which pass opens which past question".
 *
 * Paper access levels (past_questions.access):
 *   'free' — anyone who filled the free-access info form
 *   'paid' — only students who paid via Paystack
 *
 * Pass types (access_tokens.type):
 *   'free' — issued by POST /api/access/free-signup
 *   'paid' — issued after a verified Paystack payment
 *   'umat' — LEGACY passes from the retired UMaT verification (still valid until they expire)
 *
 * Both the listing (GET /api/past-questions, which marks each paper `unlocked`) and the download
 * endpoint call this, so the public page and the actual file check can never disagree.
 */
const PAPER_ACCESS = ['free', 'paid'];

function normalizeAccess(value) {
  return PAPER_ACCESS.includes(value) ? value : 'paid'; // anything unknown is treated as paid
}

/**
 * @param {string|null} tokenType  type of the visitor's pass, or null if they have none
 * @param {'free'|'paid'} paperAccess
 * @returns {boolean} true if this pass may open/download the paper
 */
// Which paper levels each pass type opens. Anything not listed (no pass, unknown types) opens nothing.
const PASS_COVERS = {
  free: ['free'], // free sign-up form
  paid: ['free', 'paid'], // Paystack payment includes the free papers too
  umat: ['free'], // legacy UMaT verification: free papers only, until it expires
};

function tokenCoversAccess(tokenType, paperAccess) {
  const access = normalizeAccess(paperAccess);
  const covered = PASS_COVERS[tokenType];
  return Array.isArray(covered) && covered.includes(access);
}

module.exports = { PAPER_ACCESS, normalizeAccess, tokenCoversAccess };
