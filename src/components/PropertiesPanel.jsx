import { useSandboxStore } from '../store/sandboxStore';
import { applyBodyProps, applyConstraintProps, removeFromWorld } from '../physics/engine';
import Matter from 'matter-js';
import { ChevronRight, MousePointer2 } from 'lucide-react';

function SliderRow({ label, value, min, max, step = 0.01, onChange, unit }) {
  const display =
    typeof value === 'number' ? value.toFixed(step < 0.01 ? 4 : step < 0.1 ? 3 : 2) : value;
  return (
    <div className="form-group">
      <label>
        {label}
        <span className="value-pill">
          {display}
          {unit ? ` ${unit}` : ''}
        </span>
      </label>
      <div className="input-row">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="slider-input"
        />
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="form-input number-input"
        />
      </div>
    </div>
  );
}

function ReadonlyRow({ label, value, unit }) {
  return (
    <div className="form-group">
      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {label}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-sub)' }}>
          {value}
          {unit ? ` ${unit}` : ''}
        </span>
      </label>
    </div>
  );
}

export default function PropertiesPanel() {
  const {
    selectedId,
    bodies,
    constraints,
    updateBodyProp,
    updateConstraintProp,
    removeBody,
    removeConstraint,
    gravity,
    setGravity,
    showPropertiesPanel,
    togglePropertiesPanel,
  } = useSandboxStore();

  const selectedBody = selectedId ? bodies[selectedId] : null;
  const selectedConstraint = !selectedBody && selectedId ? constraints[selectedId] : null;

  function updateProp(key, val) {
    updateBodyProp(selectedId, key, val);
    if (selectedBody?.matterBody) applyBodyProps(selectedBody.matterBody, { [key]: val });
  }

  function updateConProp(key, val) {
    updateConstraintProp(selectedId, key, val);
    const mc = useSandboxStore.getState().constraints[selectedId]?.matterConstraint;
    if (mc) applyConstraintProps(mc, { [key]: val });
  }

  function handleDelete() {
    if (selectedBody) {
      const mb = selectedBody.matterBody;
      for (const [cid, c] of Object.entries(constraints)) {
        const mc = c.matterConstraint;
        if (mc.bodyA === mb || mc.bodyB === mb) {
          removeFromWorld(mc);
          removeConstraint(cid);
        }
      }
      removeFromWorld(mb);
      removeBody(selectedId);
    } else if (selectedConstraint) {
      removeFromWorld(selectedConstraint.matterConstraint);
      removeConstraint(selectedId);
    }
  }

  const mb = selectedBody?.matterBody;

  return (
    <aside className={`inspector-panel${showPropertiesPanel ? ' show' : ''}`}>
      <header className="panel-header">
        <span>Properties</span>
        <button className="icon-btn" onClick={togglePropertiesPanel} title="Close">
          <ChevronRight size={18} />
        </button>
      </header>

      <div className="panel-content custom-scroll">
        {!selectedId ? (
          <div className="empty-state" style={{ marginTop: 'var(--sp-12)' }}>
            <MousePointer2
              size={40}
              style={{ color: 'var(--border-strong)', marginBottom: 'var(--sp-4)' }}
            />
            <p>Select an object to inspect its properties.</p>
          </div>
        ) : (
          <div className="property-sections">
            {/* World gravity */}
            <div className="property-section">
              <div className="section-title">World</div>
              <SliderRow
                label="Gravity Y"
                value={gravity.y}
                min={-5}
                max={10}
                step={0.1}
                onChange={(v) => setGravity(gravity.x, v)}
              />
              <SliderRow
                label="Gravity X"
                value={gravity.x}
                min={-5}
                max={5}
                step={0.1}
                onChange={(v) => setGravity(v, gravity.y)}
              />
            </div>

            {selectedBody && (
              <div className="property-section">
                <div
                  className="section-title"
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <span>{selectedBody.type.toUpperCase()}</span>
                  <span style={{ opacity: 0.5 }}>{selectedId}</span>
                </div>

                <div className="form-group">
                  <label>Mode</label>
                  <select
                    className="form-input"
                    value={selectedBody.props.isStatic ? 'static' : 'dynamic'}
                    onChange={(e) => updateProp('isStatic', e.target.value === 'static')}
                  >
                    <option value="dynamic">Dynamic</option>
                    <option value="static">Static</option>
                  </select>
                </div>

                <SliderRow
                  label="Restitution"
                  value={selectedBody.props.restitution ?? 0.6}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(v) => updateProp('restitution', v)}
                />
                <SliderRow
                  label="Friction"
                  value={selectedBody.props.friction ?? 0.1}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(v) => updateProp('friction', v)}
                />

                <div className="section-title" style={{ marginTop: 'var(--sp-4)' }}>
                  Live Data
                </div>
                <ReadonlyRow label="Mass" value={mb?.mass.toFixed(3) ?? '0'} unit="kg" />
                <ReadonlyRow
                  label="Speed"
                  value={mb ? Math.sqrt(mb.velocity.x ** 2 + mb.velocity.y ** 2).toFixed(2) : '0'}
                  unit="px/s"
                />

                <button className="btn btn-danger delete-btn" onClick={handleDelete}>
                  Delete
                </button>
              </div>
            )}

            {selectedConstraint && (
              <div className="property-section">
                <div className="section-title">Constraint</div>
                <SliderRow
                  label="Stiffness"
                  value={selectedConstraint.props.stiffness ?? 0.05}
                  min={0.001}
                  max={1}
                  step={0.001}
                  onChange={(v) => updateConProp('stiffness', v)}
                />
                <SliderRow
                  label="Rest Length"
                  value={selectedConstraint.props.length ?? 100}
                  min={1}
                  max={600}
                  step={1}
                  onChange={(v) => updateConProp('length', v)}
                  unit="px"
                />
                <button className="btn btn-danger delete-btn" onClick={handleDelete}>
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
