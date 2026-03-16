import { evaluate } from 'mathjs';

/**
 * Safely evaluates a logical condition against a payload.
 * Example condition: "amount > 1000 && department == 'Finance'"
 * Payload: { amount: 1500, department: 'Finance' }
 */
export const evaluateRule = (conditionExpression, payloadData) => {
  try {
    // If it's a raw DEFAULT clause, immediately return true
    if (!conditionExpression || conditionExpression.trim() === 'DEFAULT') {
      return true;
    }

    // mathjs evaluate handles objects directly as scope mapping
    // e.g., evaluate('amount > 1000', { amount: 1500 }) returns true
    return evaluate(conditionExpression, payloadData || {});
  } catch (error) {
    console.error('Rule Evaluation Error:', error.message);
    // If a rule is malformed, log it and return false to fall through to the fallback
    return false;
  }
};
