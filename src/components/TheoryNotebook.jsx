import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

/**
 * TheoryNotebook — Interactive Jupyter-style notebook renderer.
 * Formats physics equations and descriptions into an executable-like lab notebook.
 * Makie.jl / JupyterLab dark theme aesthetic.
 */
export default function TheoryNotebook({ sections = [], title = 'Governing Equations' }) {
  const cells = useMemo(() => {
    if (!sections || sections.length === 0) return [];
    
    let genCells = [];
    let inCount = 1;

    // Header notebook cell
    genCells.push({ 
      type: 'markdown', 
      source: `# ${title}\n*Execution Kernel: Physics Simulator v1.0*` 
    });

    for (const s of sections) {
      if (s.title) {
        genCells.push({ type: 'markdown', source: `### ${s.title}` });
      }

      for (const eq of s.equations) {
        // Equation Cell (Simulating Jupyter Input)
        genCells.push({ 
          type: 'input', 
          num: inCount, 
          source: `$$\n${eq.latex || eq}\n$$` 
        });

        // Description Cell (Simulating Jupyter Output)
        if (eq.description) {
          genCells.push({ 
            type: 'output', 
            num: inCount, 
            source: eq.description 
          });
        }
        inCount++;
      }

      if (s.variables && s.variables.length > 0) {
        let varSource = `**Variables:**\n`;
        for (const v of s.variables) {
          varSource += `- \`${v.symbol}\`: ${v.description}\n`;
        }
        genCells.push({ type: 'markdown', source: varSource });
      }
    }
    return genCells;
  }, [sections, title]);

  if (cells.length === 0) return null;

  return (
    <div className="theory-notebook">
      {cells.map((cell, idx) => (
        <div key={idx} className={`jupyter-cell jupyter-${cell.type}`}>
          <div className="jupyter-prompt">
            {cell.type === 'input' && `In [${cell.num}]:`}
            {cell.type === 'output' && `Out[${cell.num}]:`}
          </div>
          <div className="jupyter-content">
            <ReactMarkdown 
              remarkPlugins={[remarkMath, remarkGfm]}
              rehypePlugins={[rehypeKatex]}
            >
              {cell.source}
            </ReactMarkdown>
          </div>
        </div>
      ))}
      <div className="jupyter-cell jupyter-empty">
        <div className="jupyter-prompt">In [ ]:</div>
        <div className="jupyter-content empty-input" />
      </div>
    </div>
  );
}

/**
 * Legacy wrapper logic to retain compatibility with old flat equation arrays
 */
export function legacyToSections(equations, simTitle) {
  if (!equations || equations.length === 0) return [];
  return [{
    title: simTitle || 'Equations of Motion',
    equations: equations.map(eq => typeof eq === 'string' ? { latex: eq } : eq),
  }];
}
