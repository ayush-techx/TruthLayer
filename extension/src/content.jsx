import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import TruthSidebar from './components/TruthSidebar.jsx'

// Create a container div for the React root
const container = document.createElement('div')
container.id = 'truthlayer-root'
document.body.appendChild(container)

// Mount React into the injected container
createRoot(container).render(
  <StrictMode>
    <TruthSidebar />
  </StrictMode>,
)

