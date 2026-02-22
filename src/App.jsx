import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [bilar, setBilar] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('https://backend-api-7f2h.onrender.com/bilar')
      .then((response) => {
        if (!response.ok) throw new Error('HTTP-fel: ' + response.status)
        return response.json()
      })
      .then((json) => setBilar(json))
      .catch((e) => setError(e.message))
  }, [])

  return (
    <div className="App">
      <h1>Bil lista</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {bilar.map((bil) => (
        <div key={bil._id} className="bil-container">
          <h2>{bil.brand} {bil.model}</h2>
          <p>År: {bil.year}</p>
          <p>Pris: {bil.price} SEK</p>
        </div>
      ))}
    </div>
  )
}

export default App
