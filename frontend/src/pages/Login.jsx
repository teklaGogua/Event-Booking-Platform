import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { login } = useAuth()
  const as = (email) => login({ email, password: 'Password123!' })

  return (
    <div>
      <h1>Log in</h1>
      <p>(temporary test buttons)</p>
      <button onClick={() => as('attendee@example.com')}>Attendee</button>{' '}
      <button onClick={() => as('organizer@example.com')}>Organizer</button>{' '}
      <button onClick={() => as('admin@example.com')}>Admin</button>
    </div>
  )
}