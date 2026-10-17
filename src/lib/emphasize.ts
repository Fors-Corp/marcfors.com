export type Piece = { text: string; hit: boolean };

export const RECRUITER_SKILLS = new Set([
  "React",
  "TypeScript",
  "Angular",
  "JavaScript",
  "Accessibility",
  "React Testing Library",
  "Jest",
  "Playwright",
  "Integration testing",
  "Git",
  "CI/CD",
  "REST APIs",
]);

// No bare "Git" here: splitEmphasis matches substrings, so it would light up "GitHub".
export const RECRUITER_TOKENS = [
  "React",
  "TypeScript",
  "Angular",
  "JavaScript",
  "Jenkins",
  "Spring",
  "Java",
  "REST APIs",
  "CI/CD",
  "Playwright",
  "~20%",
  "~20 %",
] as const;

export function splitEmphasis(text: string, phrases: readonly string[]): Piece[] {
  const found = phrases
    .filter((phrase) => phrase.length > 0 && text.includes(phrase))
    .sort((a, b) => b.length - a.length);
  if (found.length === 0) return [{ text, hit: false }];

  const pieces: Piece[] = [];
  let rest = text;
  while (rest.length > 0) {
    let earliest = -1;
    let match = "";
    for (const phrase of found) {
      const at = rest.indexOf(phrase);
      if (at !== -1 && (earliest === -1 || at < earliest)) {
        earliest = at;
        match = phrase;
      }
    }
    if (earliest === -1) {
      pieces.push({ text: rest, hit: false });
      break;
    }
    if (earliest > 0) pieces.push({ text: rest.slice(0, earliest), hit: false });
    pieces.push({ text: match, hit: true });
    rest = rest.slice(earliest + match.length);
  }
  return pieces;
}
