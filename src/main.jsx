import React from 'react'
import ReactDOM from 'react-dom/client'
import EventCalendarApp from './Page/EventCalendarApp'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

import './index.css'

registerSW({ immediate: true })

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <EventCalendarApp />
  </React.StrictMode>,
)