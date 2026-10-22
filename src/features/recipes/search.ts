/** Minúsculas y sin tildes, para que "frijoles" encuentre "Fríjoles". */
export function normalizeForSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es")
    .trim();
}

/** Coincide si cada palabra buscada aparece en el texto, en cualquier orden. */
export function matchesQuery(normalizedText: string, query: string): boolean {
  const words = normalizeForSearch(query).split(/\s+/).filter(Boolean);
  return words.every((word) => normalizedText.includes(word));
}
