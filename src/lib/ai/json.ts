/**
 * Saca el primer objeto JSON de la respuesta de un modelo. Los modelos gratuitos suelen
 * envolverlo en ```json, anteponer una frase o agregar texto al final; aquí se tolera eso
 * pero no se "repara" un JSON mal formado.
 */
export function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  if (start === -1) throw new SyntaxError("La respuesta no contiene un objeto JSON");

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < text.length; index++) {
    const char = text[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === "{") depth++;
    else if (char === "}" && --depth === 0) return JSON.parse(text.slice(start, index + 1));
  }
  throw new SyntaxError("El objeto JSON de la respuesta está incompleto");
}
