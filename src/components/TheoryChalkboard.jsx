import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

/**
 * TheoryChalkboard — A technical documentation component for physics equations.
 * Displays mathematical formulas and their descriptions in a clear layout.
 */
export default function TheoryChalkboard({ sections = [], title = 'Governing Equations' }) {
  const renderedSections = useMemo(() => {
    if (!sections || sections.length === 0) return null;

    return sections.map((s, sIdx) => {
      return (
        <div key={sIdx} className="chalkboard-section">
          {s.title && <h3 className="chalkboard-section-title">{s.title}</h3>}

          {s.content && (
            <div className="chalkboard-note" style={{ marginBottom: 'var(--sp-4)', marginTop: 0 }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{s.content}</ReactMarkdown>
            </div>
          )}

          {s.equations &&
            s.equations.map((eq, eqIdx) => (
              <div key={eqIdx} className="chalkboard-equation-block">
                <div className="chalkboard-math">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {`$$\n${eq.latex || eq}\n$$`}
                  </ReactMarkdown>
                </div>
                {eq.description && (
                  <div className="chalkboard-note">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{eq.description}</ReactMarkdown>
                  </div>
                )}
              </div>
            ))}

          {s.variables && s.variables.length > 0 && (
            <div className="chalkboard-variables">
              <div className="chalkboard-variables-title">Variables:</div>
              <ul className="chalkboard-var-list">
                {s.variables.map((v, vIdx) => (
                  <li key={vIdx}>
                    <code className="chalkboard-var-symbol">{v.symbol}</code>
                    <span className="chalkboard-var-desc"> — {v.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    });
  }, [sections]);

  if (!renderedSections) return null;

  return (
    <div className="theory-chalkboard-wrapper custom-scroll">
      <div className="theory-chalkboard">
        <h1 className="chalkboard-main-title">{title}</h1>
        {renderedSections}
      </div>
    </div>
  );
}

/**
 * Legacy wrapper logic to retain compatibility with old flat equation arrays
 */
// eslint-disable-next-line react-refresh/only-export-components
export function legacyToSections(equations, simTitle) {
  if (!equations || equations.length === 0) return [];
  return [
    {
      title: simTitle || 'Equations of Motion',
      equations: equations.map((eq) => (typeof eq === 'string' ? { latex: eq } : eq)),
    },
  ];
}
