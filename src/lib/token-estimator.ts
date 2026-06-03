export function estimateTokens(text: string): number {
  let tokens = 0;
  const lines = text.split("\n");
  for (const line of lines) {
    if (line.startsWith("#") || line.startsWith("|")) {
      tokens += Math.ceil(line.length / 3);
    } else if (line.trim().startsWith("-") || line.trim().startsWith("*")) {
      tokens += Math.ceil(line.length / 4);
    } else if (line.trim() === "") {
      tokens += 1;
    } else {
      tokens += Math.ceil(line.length / 4);
    }
  }
  return Math.max(1, tokens);
}
