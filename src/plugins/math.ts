import katex from 'katex';
import { defineMdastPlugin } from 'satteri';

function renderMath(value: string, displayMode: boolean) {
  return {
    // A literal HTML node preserves inline context; raw Markdown would add a paragraph.
    type: 'html' as const,
    value: katex.renderToString(value, {
      displayMode,
      output: 'htmlAndMathml',
      throwOnError: true,
      trust: false,
    }),
  };
}

// Render at the Markdown AST stage, before math can be mistaken for a code block.
// KaTeX runs only during compilation; browsers receive HTML, MathML, CSS and fonts.
export const math = defineMdastPlugin({
  name: 'static-katex',
  math: (node) => renderMath(node.value, true),
  inlineMath: (node) => renderMath(node.value, false),
});
