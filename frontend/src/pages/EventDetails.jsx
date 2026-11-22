import { useParams } from 'react-router-dom'

export default function EventDetails() {
  const { id } = useParams()
  return <h1>Event #{id}</h1>
}