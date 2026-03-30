/**
 * Reading circle limits — shared by API validation and UI (maxLength).
 * Keep in sync with DB expectations and communityUserOps.
 */
export const CIRCLE_NAME_MAX_LENGTH = 200
export const CIRCLE_DESCRIPTION_MAX_LENGTH = 4000
export const CIRCLE_HOST_DISPLAY_MAX_LENGTH = 120
export const CIRCLE_BADGE_MAX_LENGTH = 40

export const DEFAULT_CIRCLE_BADGE = 'reader'
/** Fallback host label when profile / column is empty. */
export const DEFAULT_COMMUNITY_CIRCLE_HOST_LABEL = 'ARKA'
