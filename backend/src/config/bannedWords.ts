export const BANNED_WORDS: (string | RegExp)[] = [
  // Profanity - add your list here
  'fuck', 'shit', 'ass', 'bitch', 'cunt', 'dick', 'cock', 'pussy',
  'nigger', 'nigga', 'faggot', 'fag', 'retard', 'spic', 'kike',
  // Spam patterns
  'buy now', 'click here', 'free money', 'make money fast',
  'casino', 'lottery', 'prize winner',
  // Personal info patterns (regex)
  /\b\d{3}-\d{2}-\d{4}\b/, // SSN
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
  /\b(?:\d{4}[-\s]?){3}\d{4}\b/, // Credit card
  /\b\d{10,11}\b/, // Phone numbers
];

export function containsBannedContent(text: string): boolean {
  const lowerText = text.toLowerCase();
  return BANNED_WORDS.some((pattern) => {
    if (pattern instanceof RegExp) {
      return pattern.test(text);
    }
    return lowerText.includes(pattern.toLowerCase());
  });
}
