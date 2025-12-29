import { createContext, useContext, useEffect, useState } from 'react'
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth'
import { auth } from '../firebase'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Sign up with email and password
  async function signup(email, password, displayName) {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    // Update display name after signup
    if (displayName) {
      await updateProfile(result.user, { displayName })
    }
    return result
  }

  // Sign in with email and password
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  // Sign out
  function logout() {
    return signOut(auth)
  }

  // Sign in with Google
  function loginWithGoogle() {
    const provider = new GoogleAuthProvider()
    return signInWithPopup(auth, provider)
  }

  // Reset password
  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email)
  }

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    signup,
    login,
    logout,
    loginWithGoogle,
    resetPassword,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
