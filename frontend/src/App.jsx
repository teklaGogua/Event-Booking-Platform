import { useEffect, useState } from 'react'
import { events } from './api/index.js'

export default function App() {
  const [list, setList] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    events.list()
      .then((data) => setList(data.data))
      .catch((err) => setError(err.message))
  }, [])

  return (
    <div>
      <h1>EventHub</h1>
      {error && <p>Error: {error}</p>}
      <ul>
        {list.map((e) => (
          <li key={e.id}>{e.title}</li>
        ))}
      </ul>
    </div>
  )
}