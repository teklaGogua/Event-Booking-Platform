import { useAuth } from './context/AuthContext.jsx'

export default function App() {
  const { user, loading, login, logout } = useAuth()

  if (loading) return <p>Loading…</p>

  return (
    <div>
      <h1>EventHub</h1>
      {user ? (
        <>
          <p>Logged in as {user.name} ({user.role})</p>
          <button onClick={logout}>Log out</button>
        </>
      ) : (
        <>
          <p>Not logged in</p>
          <button onClick={() => login({ email: 'attendee@example.com', password: 'Password123!' })}>
            Test login
          </button>
        </>
      )}
    </div>
  )
}