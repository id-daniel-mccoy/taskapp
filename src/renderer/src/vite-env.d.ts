/// <reference types="vite/client" />

import type { TaskappApi } from '../../preload/index'

declare global {
  interface Window {
    taskapp: TaskappApi
  }
}

export {}
