import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import { registerThemes } from './lib/monaco'
import './styles/global.css'

registerThemes()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
