import { useEffect, useState } from 'react'

export default function App() {
  const [events, setEvents] = useState([])

  useEffect(() => {
    fetch('/api/events')
      .then((res) => res.json())
      .then((data) => setEvents(data.data))
  }, [])

  return (
  <div style={{ padding: 32 }}>
    <h1>What’s on in Tbilisi</h1>
    <p>Fonts and colors from Figma</p>
    <button className="btn btn-primary">Register</button>{' '}
    <button className="btn btn-secondary">Cancel</button>
  </div>
  )
}