/**
 * Statistics returned after processing an uploaded log file.
 */
export interface UploadResult {
  /** Original name of the uploaded file. */
  filename: string;

  /** Total number of non-empty lines found in the file. */
  totalLines: number;

  /** Lines that were successfully parsed and stored. */
  ingested: number;

  /** Lines that could not be parsed (bad format, too long, etc.). */
  failed: number;

  /** Lines that were blank and therefore skipped. */
  skippedEmpty: number;

  /** Wall-clock duration of the ingestion in milliseconds. */
  durationMs: number;
}
