/**
 * Financial constants used across the application
 */

/** Monthly interest rate for loans (1% per month) */
export const DEFAULT_INTEREST_RATE = 0.01;

/** Batch size for bulk passbook updates */
export const BATCH_UPDATE_SIZE = 5;

/** Max retries for bulk passbook update conflicts */
export const BATCH_RETRY_ATTEMPTS = 3;

/** Assumed days per month for prorated interest calculation */
export const DAYS_PER_MONTH_CALC = 30;

/** Maximum pagination limit for API queries */
export const MAX_PAGE_LIMIT = 100;

/** Default pagination limit */
export const DEFAULT_PAGE_LIMIT = 10;

/** Maximum file upload size in bytes (5MB) */
export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;

/** Avatar dimensions after processing */
export const AVATAR_SIZE = 200;

/** Session cookie max age in seconds (7 days) */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

/** Minimum password length */
export const MIN_PASSWORD_LENGTH = 8;
