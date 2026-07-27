import prettier from "prettier/standalone";
import babelParser from "prettier/plugins/babel";
import estreePlugin from "prettier/plugins/estree"; 

export async function formatCode(code) {
  try {
    const formatted = await prettier.format(code, {
      parser: "babel",
      plugins: [babelParser, estreePlugin], 
      semi: true,
      singleQuote: true,
      tabWidth: 2,
      printWidth: 80,
    });

    return formatted;
  } catch (err) {
    console.error("Formatting failed:", err);
    return code; // Fallback to raw text if formatting breaks
  }
}