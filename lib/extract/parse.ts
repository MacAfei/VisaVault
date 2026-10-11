import { DocumentSchemas } from './schemas';

export function cleanJsonString(rawText: string): string {
  let cleaned = rawText.trim();

  // Strip markdown code fences like ```json ... ``` or ``` ... ```
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/, '');

  // Extract from first '{' to last '}' if extra preamble or trailing text exists
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  return cleaned.trim();
}

export function parseAndValidate(
  rawText: string,
  docType: string
): { success: boolean; data?: any; error?: string } {
  try {
    const cleaned = cleanJsonString(rawText);
    const parsed = JSON.parse(cleaned);

    const schema = DocumentSchemas[docType];
    if (schema) {
      const validation = schema.safeParse(parsed);
      if (validation.success) {
        return { success: true, data: validation.data };
      } else {
        // Return parsed data with warning if partial match, or error details
        const issueMsg = validation.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
        return {
          success: true,
          data: { ...parsed, confidenceNotes: `Schema warning: ${issueMsg}` },
        };
      }
    }

    return { success: true, data: parsed };
  } catch (err: any) {
    return { success: false, error: err.message || 'Invalid JSON output from model' };
  }
}
