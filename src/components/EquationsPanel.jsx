import { BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

/**
 * EquationsPanel — Textbook-style equation display with derivation steps,
 * variable lists, and numbered equations. Makie-inspired scientific layout.
 *
 * Props:
 *   sections — [{title, equations: [{latex, description?, number?}], variables?: [{symbol, description}]}]
 *   title    — panel title
 */
export default function EquationsPanel({ sections = [], title = 'Governing Equations' }) {
  if (!sections || sections.length === 0) return null;

  return (
    <div className="equations-panel">
      <div className="equations-panel-header">
        <h3>{title}</h3>
      </div>
      {sections.map((section, si) => (
        <div key={si} className="equations-section">
          {section.title && (
            <div className="equations-section-title">{section.title}</div>
          )}
          {section.equations.map((eq, ei) => (
            <div key={ei} className="eq-numbered">
              <span className="eq-number">({si + 1}.{ei + 1})</span>
              <div className="eq-content">
                <BlockMath math={eq.latex || eq} />
                {eq.description && (
                  <div className="eq-description">{eq.description}</div>
                )}
              </div>
            </div>
          ))}
          {section.variables && section.variables.length > 0 && (
            <div className="eq-variable-list">
              {section.variables.map((v, vi) => (
                <span key={vi} className="eq-var-symbol">{v.symbol}</span>
              ))}
              {section.variables.map((v, vi) => (
                <span key={`d${vi}`} className="eq-var-desc">— {v.description}</span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Helper to convert the existing flat equation arrays into the new section format.
 * For backwards compatibility with simulations that export `equations: [string, ...]`
 */
export function legacyToSections(equations, simTitle) {
  if (!equations || equations.length === 0) return [];
  return [{
    title: simTitle || 'Equations of Motion',
    equations: equations.map(eq => typeof eq === 'string' ? { latex: eq } : eq),
  }];
}
