export function preprocessLines(text: string): string[] {
  const normalized = text.replace(/\r\n?/g, "\n");
  const lines = normalized
    .split("\n")
    .map((line) => line.replace(/^[\s\u3000]+/, "")) // strip leading whitespace (including full-width spaces)
    .map((line) => line.replace(/\s+$/, "")); // trim trailing whitespace so it doesn't interfere with matching

  return lines;
}

export function hasMeaningfulContent(lines: string[]): boolean {
  return lines.some((line) => line.trim().length > 0);
}
