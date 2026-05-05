import { useSandboxStore } from '../store/sandboxStore';
import { applyBodyProps, applyConstraintProps, removeFromWorld } from '../physics/engine';
import Matter from 'matter-js';
import { X } from 'lucide-react';

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

  // Get live data from Matter body
  const mb = selectedBody?.matterBody;
  const mc = selectedConstraint?.matterConstraint;

  return (
    <aside className={`inspector-panel ui-panel${showPropertiesPanel ? ' show' : ''}`}>
      <div className="panel-header">
        <span>Properties</span>
      </div>
      <div className="panel-content">
        {/* ── World gravity ────────────────────────────────── */}
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

        {/* ── Body properties ──────────────────────────────── */}
        {selectedBody &&
          (() => {
            const { type, props } = selectedBody;
            const isCircle = type === 'circle' || type === 'pulley';

            // Live readouts from Matter body
            const mass = mb ? mb.mass : 0;
            const speed = mb ? Math.sqrt(mb.velocity.x ** 2 + mb.velocity.y ** 2) : 0;
            const posX = mb ? mb.position.x : 0;
            const posY = mb ? mb.position.y : 0;

            return (
              <div className="property-section">
                <div
                  className="section-title"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span>{type}</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      color: 'var(--text-muted)',
                      fontWeight: 400,
                    }}
                  >
                    {selectedId}
                  </span>
                </div>

                {/* Mode */}
                <div className="form-group">
                  <label>Mode</label>
                  <select
                    className="form-input"
                    value={props.isStatic ? 'static' : 'dynamic'}
                    onChange={(e) => updateProp('isStatic', e.target.value === 'static')}
                  >
                    <option value="dynamic">Dynamic</option>
                    <option value="static">Static</option>
                  </select>
                </div>

                {/* Material properties */}
                <div
                  style={{
                    marginTop: 6,
                    marginBottom: 2,
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--text-muted)',
                  }}
                >
                  Material
                </div>
                <SliderRow
                  label="Restitution"
                  value={props.restitution ?? 0.6}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(v) => updateProp('restitution', v)}
                />
                <SliderRow
                  label="Friction"
                  value={props.friction ?? 0.1}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(v) => updateProp('friction', v)}
                />
                <SliderRow
                  label="Static Friction"
                  value={props.frictionStatic ?? 0.5}
                  min={0}
                  max={5}
                  step={0.01}
                  onChange={(v) => updateProp('frictionStatic', v)}
                />
                <SliderRow
                  label="Air Drag"
                  value={props.frictionAir ?? 0.01}
                  min={0}
                  max={0.5}
                  step={0.001}
                  onChange={(v) => updateProp('frictionAir', v)}
                />
                <SliderRow
                  label="Density"
                  value={props.density ?? 0.001}
                  min={0.0001}
                  max={0.05}
                  step={0.0001}
                  onChange={(v) => updateProp('density', v)}
                />

                {/* Motion */}
                <div
                  style={{
                    marginTop: 10,
                    marginBottom: 2,
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--text-muted)',
                  }}
                >
                  Motion
                </div>
                <SliderRow
                  label="Vel X"
                  value={props.velocityX ?? 0}
                  min={-40}
                  max={40}
                  step={0.5}
                  onChange={(v) => updateProp('velocityX', v)}
                  unit="px/s"
                />
                <SliderRow
                  label="Vel Y"
                  value={props.velocityY ?? 0}
                  min={-40}
                  max={40}
                  step={0.5}
                  onChange={(v) => updateProp('velocityY', v)}
                  unit="px/s"
                />
                <SliderRow
                  label="Angle"
                  value={props.angle ?? 0}
                  min={-180}
                  max={180}
                  step={1}
                  onChange={(v) => updateProp('angle', v)}
                  unit="°"
                />
                <SliderRow
                  label="Angular Vel"
                  value={props.angularVelocity ?? 0}
                  min={-0.5}
                  max={0.5}
                  step={0.01}
                  onChange={(v) => updateProp('angularVelocity', v)}
                  unit="rad/s"
                />

                {/* Live readouts */}
                <div
                  style={{
                    marginTop: 10,
                    marginBottom: 2,
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--text-muted)',
                  }}
                >
                  Live Data
                </div>
                <ReadonlyRow label="Mass" value={mass.toFixed(3)} unit="kg" />
                <ReadonlyRow label="Speed" value={speed.toFixed(2)} unit="px/s" />
                <ReadonlyRow label="Position" value={`(${posX.toFixed(0)}, ${posY.toFixed(0)})`} />
                {isCircle && mb && (
                  <ReadonlyRow label="Radius" value={(mb.circleRadius ?? 0).toFixed(1)} unit="px" />
                )}

                <button className="btn btn-danger delete-btn" onClick={handleDelete}>
                  Delete
                </button>
              </div>
            );
          })()}

        {/* ── Constraint properties ─────────────────────────── */}
        {selectedConstraint &&
          (() => {
            const { type, props } = selectedConstraint;
            const isSpring = type === 'spring';

            // Live data
            const currentLength = mc
              ? (() => {
                  const pA = mc.bodyA ? Matter.Vector.add(mc.bodyA.position, mc.pointA) : mc.pointA;
                  const pB = mc.bodyB ? Matter.Vector.add(mc.bodyB.position, mc.pointB) : mc.pointB;
                  return Math.sqrt((pB.x - pA.x) ** 2 + (pB.y - pA.y) ** 2);
                })()
              : 0;
            const stretch = mc ? currentLength - (mc.length || 0) : 0;

            return (
              <div className="property-section">
                <div
                  className="section-title"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span>
                    {type === 'spring'
                      ? '🔧 Spring'
                      : type === 'string'
                        ? '🧵 String'
                        : type === 'oscillator'
                          ? '📻 Oscillator'
                          : '🔗 Pivot'}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      color: 'var(--text-muted)',
                      fontWeight: 400,
                    }}
                  >
                    {selectedId}
                  </span>
                </div>

                <SliderRow
                  label="Stiffness"
                  value={props.stiffness ?? (isSpring ? 0.05 : 1)}
                  min={0.001}
                  max={1}
                  step={0.001}
                  onChange={(v) => updateConProp('stiffness', v)}
                />
                <SliderRow
                  label="Damping"
                  value={props.damping ?? 0.05}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(v) => updateConProp('damping', v)}
                />
                <SliderRow
                  label="Rest Length"
                  value={props.length ?? 100}
                  min={1}
                  max={600}
                  step={1}
                  onChange={(v) => updateConProp('length', v)}
                  unit="px"
                />

                {/* Live readouts */}
                <div
                  style={{
                    marginTop: 10,
                    marginBottom: 2,
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--text-muted)',
                  }}
                >
                  Live Data
                </div>
                <ReadonlyRow label="Current Length" value={currentLength.toFixed(1)} unit="px" />
                <ReadonlyRow label="Stretch" value={stretch.toFixed(1)} unit="px" />
                {isSpring && (
                  <ReadonlyRow
                    label="Force ≈"
                    value={(Math.abs(stretch) * (props.stiffness ?? 0.05)).toFixed(3)}
                    unit="N"
                  />
                )}
                <ReadonlyRow label="Body A" value={mc?.bodyA ? '✓ attached' : '⊕ world'} />
                <ReadonlyRow label="Body B" value={mc?.bodyB ? '✓ attached' : '⊕ world'} />

                <button className="btn btn-danger delete-btn" onClick={handleDelete}>
                  Delete
                </button>
              </div>
            );
          })()}

        {!selectedBody && !selectedConstraint && (
          <div className="empty-state empty-state-spaced">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="4 4" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <p>Select a body or constraint to edit</p>
            <div
              style={{ marginTop: 8, fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.7 }}
            >
              <strong>Click</strong> bodies or springs to select
              <br />
              <strong>Drag</strong> to move bodies
              <br />
              <strong>Delete</strong> key to remove selected
              <br />
              <strong>Alt+Drag</strong> or <strong>Middle-click</strong> to pan
              <br />
              <strong>Scroll</strong> to zoom
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
