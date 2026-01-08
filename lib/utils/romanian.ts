/**
 * Normalizes Romanian text by removing diacritics
 * Converts: ă, â, î, ș, ț, Ă, Â, Î, Ș, Ț to a, a, i, s, t, A, A, I, S, T
 */
export function removeDiacritics(text: string): string {
  const diacritics: { [key: string]: string } = {
    'ă': 'a', 'â': 'a', 'î': 'i', 'ș': 's', 'ț': 't',
    'Ă': 'A', 'Â': 'A', 'Î': 'I', 'Ș': 'S', 'Ț': 'T',
  };

  return text
    .split('')
    .map(char => diacritics[char] || char)
    .join('');
}

/**
 * Checks if two strings match ignoring diacritics
 */
export function matchesIgnoringDiacritics(text1: string, text2: string): boolean {
  return removeDiacritics(text1.toLowerCase()) === removeDiacritics(text2.toLowerCase());
}

/**
 * Checks if text1 contains text2 ignoring diacritics
 */
export function containsIgnoringDiacritics(text1: string, text2: string): boolean {
  const normalized1 = removeDiacritics(text1.toLowerCase());
  const normalized2 = removeDiacritics(text2.toLowerCase());
  return normalized1.includes(normalized2);
}
