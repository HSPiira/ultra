import { useState } from 'react'
import Header from './components/common/Header'
import Sidebar from './components/common/SideBar'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Header />
      <Sidebar />
    </>
  )
}

export default App
