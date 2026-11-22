import { useEffect, useState } from 'react'

export default function App() {
  const [events, setEvents] = useState([])

  useEffect(() => {
    fetch('/api/events')
      .then((res) => res.json())
      .then((data) => setEvents(data.data))
  }, [])

  return (
    <div>
      <h1>EventHub</h1>
      <ul>
        {events.map((e) => (
          <li key={e.id}>{e.title}</li>
        ))}
      </ul>
    </div>
  )
}