import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function UserMenu({ onLoginClick }) {
  const { currentUser, logout } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleLogout() {
    try {
      await logout()
      setShowDropdown(false)
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  if (!currentUser) {
    return (
      <button
        onClick={onLoginClick}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium shadow-md hover:shadow-lg transition"
      >
        <span>🔐</span>
        <span>Đăng nhập</span>
      </button>
    )
  }

  // Get user initials for avatar
  const displayName = currentUser.displayName || currentUser.email
  const initials = displayName
    ? displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
      >
        {currentUser.photoURL ? (
          <img
            src={currentUser.photoURL}
            alt="Avatar"
            className="w-8 h-8 rounded-full border-2 border-sky-200"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
            {initials}
          </div>
        )}
        <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate hidden sm:block">
          {displayName}
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-[2000]">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-800 truncate">
              {currentUser.displayName || 'Người dùng'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {currentUser.email}
            </p>
          </div>
          
          <div className="py-1">
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
