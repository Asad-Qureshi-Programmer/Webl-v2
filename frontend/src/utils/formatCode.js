// src/utils/formatCode.js
export const formatCode = (code, filePath = '') => {
  if (!code || typeof code !== 'string') return code;
  if (!filePath.endsWith('.jsx') && !filePath.endsWith('.js')) return code;

  try {
    let formatted = code.replace(/\\n/g, '\n');

    // Structural line breaks
    formatted = formatted
      .replace(/(\bimport\s+[^\n]+)/g, '$1\n')
      .replace(/(\bexport\s+default\s+)/g, '\n$1');

    // 🚀 FIX: Added (?<!return\s*) so JSX tags right after 'return' do NOT get split onto a new line!
    formatted = formatted.replace(/(?<!return\s*)(<[A-Za-z0-9.]+(?:\s+[^>]*?)?>)(?=(?:[^"']*["'][^"']*["'])*[^"']*$)/g, '\n$1\n');
    formatted = formatted.replace(/(<\/[A-Za-z0-9.]+>)(?=(?:[^"']*["'][^"']*["'])*[^"']*$)/g, '\n$1\n');

    formatted = formatted.replace(/\n\s*\n/g, '\n');

    const lines = formatted.split('\n');
    let indentLevel = 0;
    let inMultilineString = false;

    const indentedLines = lines.map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return '';

      const quoteMatches = (line.match(/["'`]/g) || []).length;
      if (inMultilineString) {
        if (quoteMatches % 2 !== 0) inMultilineString = false;
        return line;
      }
      if (quoteMatches % 2 !== 0) inMultilineString = true;

      if (
        trimmed.startsWith('</') ||
        trimmed.startsWith('}') ||
        trimmed.startsWith(')') ||
        trimmed.startsWith('];') ||
        trimmed.startsWith(']')
      ) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      const indentedLine = ' '.repeat(indentLevel * 2) + trimmed;

      if (
        (trimmed.startsWith('<') &&
          !trimmed.startsWith('</') &&
          !trimmed.endsWith('/>') &&
          !trimmed.includes('</')) ||
        trimmed.endsWith('{') ||
        trimmed.endsWith('(') ||
        trimmed.endsWith('[')
      ) {
        indentLevel++;
      }

      return indentedLine;
    });

    return indentedLines.join('\n').trim();
  } catch (err) {
    return code;
  }
};