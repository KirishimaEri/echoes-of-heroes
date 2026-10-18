/**
 * Single source of truth for every externally visible URL in the app.
 *
 * The repository does not exist on GitHub yet, so `REPO_OWNER` is still a
 * placeholder. Components must consult `isPublished` before rendering an
 * outbound link: pointing a "GitHub" button at github.com (or at a 404) on a
 * project that is trying to earn stars is worse than not showing the button at
 * all — it is the first thing a reviewer clicks.
 *
 * ── Release checklist ──────────────────────────────────────────────────────
 *   1. Set REPO_OWNER to your GitHub handle.
 *   2. Set SITE_URL to the GitHub Pages origin (used for canonical / Open Graph).
 *   3. Re-run `npm run build` and confirm the header link and share cards work.
 * ───────────────────────────────────────────────────────────────────────────
 */

export const REPO_OWNER = 'KirishimaEri';

export const REPO_NAME = 'echoes-of-heroes';

export const REPO_URL = `https://github.com/${REPO_OWNER}/${REPO_NAME}`;

/** Set once GitHub Pages is live; left empty so we never emit a bogus canonical. */
export const SITE_URL = '';

export const CLONE_URL = `${REPO_URL}.git`;

/**
 * Contribution entry. Points at the plain "new issue" form, which always exists;
 * switch to `/issues/new?template=add-place.md` once `.github/ISSUE_TEMPLATE/`
 * actually ships that template.
 */
export const CONTRIBUTE_ISSUE_URL = `${REPO_URL}/issues/new`;

export const isPublished = true;
