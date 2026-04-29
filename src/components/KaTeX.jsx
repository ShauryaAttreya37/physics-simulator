import { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * BlockMath — Renders a KaTeX block-level math expression.
 * Drop-in replacement for react-katex's BlockMath that works with React 19+.
 *
 * @param {{ math: string, errorColor?: string }} props
 */
export function BlockMath({ math, errorColor = '#cc0000' }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math || '', {
        displayMode: true,
        errorColor,
        throwOnError: false,
      });
    } catch {
      return `<span style="color:${errorColor}">Invalid LaTeX</span>`;
    }
  }, [math, errorColor]);

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

/**
 * InlineMath — Renders a KaTeX inline math expression.
 * Drop-in replacement for react-katex's InlineMath that works with React 19+.
 *
 * @param {{ math: string, errorColor?: string }} props
 */
export function InlineMath({ math, errorColor = '#cc0000' }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math || '', {
        displayMode: false,
        errorColor,
        throwOnError: false,
      });
    } catch {
      return `<span style="color:${errorColor}">Invalid LaTeX</span>`;
    }
  }, [math, errorColor]);

  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
