import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

/**
 * Logs an action to the immutable audit log for FDA 21 CFR Part 11 compliance.
 */
export const logAuditAction = async (action: string, details: any) => {
  if (!auth.currentUser) return;

  try {
    await addDoc(collection(db, 'audit_logs'), {
      userId: auth.currentUser.uid,
      action,
      details: JSON.stringify(details),
      timestamp: new Date(),
      // ipAddress could be added if we had a backend service to resolve it, 
      // but for client-side we'll omit or rely on Firebase's internal logs.
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
    // In a strict FDA compliant system, failure to audit log might halt the operation.
  }
};

/**
 * Basic PHI (Protected Health Information) Sanitizer for HIPAA compliance.
 * This is a simplified regex-based approach. In a real clinical setting, 
 * you would use a dedicated NLP service (like AWS Comprehend Medical or GCP Healthcare API).
 */
export const sanitizePHI = (text: string): string => {
  if (!text) return text;

  let sanitized = text;

  // 1. Remove SSNs (XXX-XX-XXXX)
  sanitized = sanitized.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED_SSN]');

  // 2. Remove Phone Numbers (e.g., (123) 456-7890, 123-456-7890)
  sanitized = sanitized.replace(/\b\+?1?\s*\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[REDACTED_PHONE]');

  // 3. Remove Email Addresses
  sanitized = sanitized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[REDACTED_EMAIL]');

  // 4. Remove Dates (e.g., MM/DD/YYYY, YYYY-MM-DD) - HIPAA requires removing dates directly related to an individual
  sanitized = sanitized.replace(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g, '[REDACTED_DATE]');
  sanitized = sanitized.replace(/\b\d{4}[/-]\d{1,2}[/-]\d{1,2}\b/g, '[REDACTED_DATE]');

  return sanitized;
};
