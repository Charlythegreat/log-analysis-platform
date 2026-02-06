import { ParsedLog } from '../../common';

/**
 * A log pattern defines a named regex and an extraction function
 * that maps capture groups into a ParsedLog.
 */
export interface LogPattern {
  /** Human-readable name (e.g. 'syslog', 'clf', 'nginx') */
  name: string;
  /** Regex applied against a raw log line */
  regex: RegExp;
  /** Map regex match groups → ParsedLog fields */
  extract(match: RegExpExecArray): Partial<ParsedLog>;
}
