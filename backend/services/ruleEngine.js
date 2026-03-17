import { create, all } from 'mathjs';

const math = create(all);

// Extend mathjs with custom string functions as per requirements
math.import({
  contains: (str, substr) => String(str).includes(substr),
  startsWith: (str, prefix) => String(str).startsWith(prefix),
  endsWith: (str, suffix) => String(str).endsWith(suffix)
});

/**
 * Safely evaluates a logical condition against a payload.
 * Example condition: "contains(department, 'Finance') && amount > 1000"
 */
export const evaluateRule = (conditionExpression, payloadData) => {
  try {
    if (!conditionExpression || conditionExpression.trim() === 'DEFAULT') {
      return true;
    }

    return math.evaluate(conditionExpression, payloadData || {});
  } catch (error) {
    console.error('Rule Evaluation Error:', error.message);
    return false;
  }
};
