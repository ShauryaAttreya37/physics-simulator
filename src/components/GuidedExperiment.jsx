import { useState, useCallback, useMemo } from 'react';
import {
  Lightbulb,
  ChevronRight,
  Eye,
  CheckCircle,
  XCircle,
  RotateCcw,
  FlaskConical,
} from 'lucide-react';

export default function GuidedExperiment({ experiment, onApplyParams, onClose }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [phase, setPhase] = useState('predict');
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const step = useMemo(() => experiment?.steps?.[stepIdx] || {}, [experiment, stepIdx]);
  const isLast = stepIdx === (experiment?.steps?.length || 1) - 1;
  const isCorrect = selectedChoice === step.correctIndex;

  const handlePredict = useCallback(
    (choiceIdx) => {
      setSelectedChoice(choiceIdx);
      if (step.params && onApplyParams) {
        onApplyParams(step.params);
      }
      setPhase('observe');
    },
    [step, onApplyParams],
  );

  const handleObserved = useCallback(() => {
    setScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
    setPhase('explain');
  }, [isCorrect]);

  const handleNext = useCallback(() => {
    if (isLast) {
      onClose?.();
      return;
    }
    setStepIdx((prev) => prev + 1);
    setPhase('predict');
    setSelectedChoice(null);
  }, [isLast, onClose]);

  const handleRestart = useCallback(() => {
    setStepIdx(0);
    setPhase('predict');
    setSelectedChoice(null);
    setScore({ correct: 0, total: 0 });
  }, []);

  if (!experiment || !experiment.steps?.length) return null;

  return (
    <div className="guided-exp">
      <div className="guided-exp-header">
        <FlaskConical size={14} style={{ color: 'var(--sci-green)' }} />
        <span className="guided-exp-title">{experiment.title}</span>
        <span className="guided-exp-progress">
          {stepIdx + 1}/{experiment.steps.length}
        </span>
        <button className="guided-exp-close" onClick={onClose} title="Close experiment">
          &times;
        </button>
      </div>

      <div className="guided-exp-bar">
        <div
          className="guided-exp-bar-fill"
          style={{
            width: `${((stepIdx + (phase === 'explain' ? 1 : 0.5)) / experiment.steps.length) * 100}%`,
          }}
        />
      </div>

      <div className="guided-exp-body">
        <div className="guided-exp-instruction">{step.instruction}</div>

        {phase === 'predict' && (
          <div className="guided-exp-predict">
            <div className="guided-exp-question">
              <Lightbulb size={13} style={{ color: '#fde725', flexShrink: 0, marginTop: 2 }} />
              <span>{step.question}</span>
            </div>
            <div className="guided-exp-choices">
              {step.choices.map((choice, i) => (
                <button key={i} className="guided-exp-choice" onClick={() => handlePredict(i)}>
                  <span className="guided-exp-choice-letter">{String.fromCharCode(65 + i)}</span>
                  {choice}
                </button>
              ))}
            </div>
          </div>
        )}

        {phase === 'observe' && (
          <div className="guided-exp-observe">
            <div className="guided-exp-observe-prompt">
              <Eye size={14} style={{ color: 'var(--accent)' }} />
              <span>Watch the simulation carefully, then continue when ready.</span>
            </div>
            <div className="guided-exp-your-pick">
              You predicted: <strong>{step.choices[selectedChoice]}</strong>
            </div>
            <button className="guided-exp-btn" onClick={handleObserved}>
              I've observed it <ChevronRight size={14} />
            </button>
          </div>
        )}

        {phase === 'explain' && (
          <div className="guided-exp-explain">
            <div className={`guided-exp-result ${isCorrect ? 'correct' : 'wrong'}`}>
              {isCorrect ? (
                <>
                  <CheckCircle size={16} /> <span>Correct! Nice intuition.</span>
                </>
              ) : (
                <>
                  <XCircle size={16} /> <span>Not quite — but that's a common misconception!</span>
                </>
              )}
            </div>

            {!isCorrect && step.commonMisconception && (
              <div className="guided-exp-misconception">
                <strong>Why students get this wrong:</strong> {step.commonMisconception}
              </div>
            )}

            <div className="guided-exp-explanation">{step.explanation}</div>

            {step.tryThis && (
              <div className="guided-exp-try">
                <strong>Try this:</strong> {step.tryThis}
              </div>
            )}

            <div className="guided-exp-nav">
              {isLast ? (
                <div className="guided-exp-summary">
                  <span>
                    Score: {score.correct}/{score.total} correct
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="guided-exp-btn secondary" onClick={handleRestart}>
                      <RotateCcw size={12} /> Redo
                    </button>
                    <button className="guided-exp-btn" onClick={handleNext}>
                      Finish
                    </button>
                  </div>
                </div>
              ) : (
                <button className="guided-exp-btn" onClick={handleNext}>
                  Next step <ChevronRight size={14} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
