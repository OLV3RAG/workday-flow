export const SUGGESTED_TAGS = ["Bug", "Feature", "Personal", "Trabajo"] as const;

const HUES = [199, 262, 152, 32, 340, 173];

export function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of tags) {
    const tag = raw.trim().replace(/\s+/g, " ");
    const key = tag.toLowerCase();
    if (!tag || seen.has(key)) continue;
    seen.add(key);
    result.push(tag);
  }
  return result;
}

export function tagHue(tag: string): number {
  let hash = 0;
  for (let index = 0; index < tag.length; index += 1) {
    hash = (hash + tag.charCodeAt(index) * (index + 1)) % HUES.length;
  }
  return HUES[hash] ?? HUES[0];
}
