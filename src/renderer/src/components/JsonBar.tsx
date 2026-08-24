import type { JsonCheck } from '../lib/json'

interface Props {
  state: JsonCheck
  onFormat: () => void
  onMinify: () => void
  onValidate: () => void
}

export function JsonBar({ state, onFormat, onMinify, onValidate }: Props) {
  return (
    <div className="json-bar">
      <p className={state.ok ? 'ok' : 'bad'}>{state.message}</p>
      <div className="json-actions">
        <button className="chip-btn" onClick={onValidate}>Validate</button>
        <button className="chip-btn" onClick={onFormat}>Format</button>
        <button className="chip-btn" onClick={onMinify}>Minify</button>
      </div>
    </div>
  )
}
