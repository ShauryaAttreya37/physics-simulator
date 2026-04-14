import { useState, useCallback } from 'react';
import { Lightbulb, ChevronRight, ChevronLeft, Eye, CheckCircle, XCircle, RotateCcw, FlaskConical } from 'lucide-react';

/**
 * GuidedExperiment — Predict → Observe → Explain learning loop
 *
 * Each experiment has steps. Each step:
 *  1. Sets params & asks a prediction question
 *  2. Student picks an answer (multiple choice)
 *  3. Simulation runs, student observes
 *  4. Reveal: explanation + whether prediction was right
 *  5. Optional "try it yourself" nudge
 *
 * Data format (provided per simulation):
 * {
 *   title: "Exploring Chaos",
 *   steps: [
 *     {
 *       instruction: "Set θ₁ to exactly 90°...",
 *       params: { theta1: Math.PI/2 },       // auto-applied
 *       question: "What will the second pendulum do?",
 *       choices: ["Swing symmetrically", "Go chaotic", "Stay still"],
 *       correctIndex: 1,
 *       commonMisconception: "Most students expect symmetric motion...",
 *       explanation: "The double pendulum is a chaotic system...",
 *       tryThis: "Now change θ₁ by just 0.01 rad and watch how different the motion becomes."
 *     }
 *   ]
 * }
 */

export default function GuidedExperiment({ experiment, onApplyParams, onClose }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [phase, setPhase] = useState('predict'); // predict | observe | explain
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  if (!experiment || !experiment.steps?.length) return null;

  const step = experiment.steps[stepIdx];
  const isLast = stepIdx === experiment.steps.length - 1;
  const isCorrect = selectedChoice === step.correctIndex;

  const handlePredict = useCallback((choiceIdx) => {
    setSelectedChoice(choiceIdx);
    // Apply the params so simulation shows the scenario
    if (step.params && onApplyParams) {
      onApplyParams(step.params);
    }
    setPhase('observe');
  }, [step, onApplyParams]);

  const handleObserved = useCallback(() => {
    setScore(prev => ({
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
    setStepIdx(prev => prev + 1);
    setPhase('predict');
    setSelectedChoice(null);
  }, [isLast, onClose]);

  const handleRestart = useCallback(() => {
    setStepIdx(0);
    setPhase('predict');
    setSelectedChoice(null);
    setScore({ correct: 0, total: 0 });
  }, []);

  return (
    <div className="guided-exp">
      {/* Header */}
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

      {/* Progress bar */}
      <div className="guided-exp-bar">
        <div className="guided-exp-bar-fill" style={{ width: `${((stepIdx + (phase === 'explain' ? 1 : 0.5)) / experiment.steps.length) * 100}%` }} />
      </div>

      {/* Step content */}
      <div className="guided-exp-body">
        {/* Instruction */}
        <div className="guided-exp-instruction">
          {step.instruction}
        </div>

        {/* PREDICT phase */}
        {phase === 'predict' && (
          <div className="guided-exp-predict">
            <div className="guided-exp-question">
              <Lightbulb size={13} style={{ color: '#fde725', flexShrink: 0, marginTop: 2 }} />
              <span>{step.question}</span>
            </div>
            <div className="guided-exp-choices">
              {step.choices.map((choice, i) => (
                <button
                  key={i}
                  className="guided-exp-choice"
                  onClick={() => handlePredict(i)}
                >
                  <span className="guided-exp-choice-letter">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {choice}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* OBSERVE phase */}
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

        {/* EXPLAIN phase */}
        {phase === 'explain' && (
          <div className="guided-exp-explain">
            {/* Result banner */}
            <div className={`guided-exp-result ${isCorrect ? 'correct' : 'wrong'}`}>
              {isCorrect ? (
                <><CheckCircle size={16} /> <span>Correct! Nice intuition.</span></>
              ) : (
                <><XCircle size={16} /> <span>Not quite — but that's a common misconception!</span></>
              )}
            </div>

            {/* Misconception callout (only if wrong) */}
            {!isCorrect && step.commonMisconception && (
              <div className="guided-exp-misconception">
                <strong>Why students get this wrong:</strong> {step.commonMisconception}
              </div>
            )}

            {/* Explanation */}
            <div className="guided-exp-explanation">
              {step.explanation}
            </div>

            {/* Try this */}
            {step.tryThis && (
              <div className="guided-exp-try">
                <strong>Try this:</strong> {step.tryThis}
              </div>
            )}

            {/* Navigation */}
            <div className="guided-exp-nav">
              {isLast ? (
                <div className="guided-exp-summary">
                  <span>Score: {score.correct}/{score.total} correct</span>
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
