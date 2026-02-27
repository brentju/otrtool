import { BrowserRouter, Routes, Route } from 'react-router-dom'
import SidebarLayout from './components/Layout/SidebarLayout'
import Home from './pages/Home'
import SessionDetail from './pages/SessionDetail'
import Upload from './pages/Upload'

function App() {
  return (
    <BrowserRouter>
      <SidebarLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/sessions/:id" element={<SessionDetail />} />
        </Routes>
      </SidebarLayout>
    </BrowserRouter>
  )
}

export default App
