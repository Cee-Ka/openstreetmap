import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function AuthModal({ isOpen, onClose }) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showResetPassword, setShowResetPassword] = useState(false)

  const { signup, login, loginWithGoogle, resetPassword } = useAuth()

  if (!isOpen) return null

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!isLogin && password !== confirmPassword) {
      return setError('Mật khẩu xác nhận không khớp')
    }

    if (password.length < 6) {
      return setError('Mật khẩu phải có ít nhất 6 ký tự')
    }

    setLoading(true)

    try {
      if (isLogin) {
        await login(email, password)
        onClose()
      } else {
        await signup(email, password, displayName)
        onClose()
      }
    } catch (err) {
      console.error(err)
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('Email này đã được sử dụng')
          break
        case 'auth/invalid-email':
          setError('Email không hợp lệ')
          break
        case 'auth/user-not-found':
          setError('Không tìm thấy tài khoản với email này')
          break
        case 'auth/wrong-password':
          setError('Mật khẩu không đúng')
          break
        case 'auth/invalid-credential':
          setError('Email hoặc mật khẩu không đúng')
          break
        default:
          setError('Đã xảy ra lỗi. Vui lòng thử lại.')
      }
    }

    setLoading(false)
  }

  async function handleGoogleLogin() {
    setError('')
    setLoading(true)

    try {
      await loginWithGoogle()
      onClose()
    } catch (err) {
      console.error(err)
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Bạn đã đóng cửa sổ đăng nhập')
      } else {
        setError('Lỗi đăng nhập với Google. Vui lòng thử lại.')
      }
    }

    setLoading(false)
  }

  async function handleResetPassword(e) {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!email) {
      return setError('Vui lòng nhập email')
    }

    setLoading(true)

    try {
      await resetPassword(email)
      setMessage('Đã gửi email đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.')
    } catch (err) {
      console.error(err)
      if (err.code === 'auth/user-not-found') {
        setError('Không tìm thấy tài khoản với email này')
      } else {
        setError('Lỗi gửi email. Vui lòng thử lại.')
      }
    }

    setLoading(false)
  }

  function resetForm() {
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setDisplayName('')
    setError('')
    setMessage('')
    setShowResetPassword(false)
  }

  function switchMode() {
    setIsLogin(!isLogin)
    resetForm()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[3000] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span className="text-2xl">🔐</span>
            {showResetPassword ? 'Quên mật khẩu' : (isLogin ? 'Đăng nhập' : 'Đăng ký tài khoản')}
          </h3>
          <button
            onClick={() => { onClose(); resetForm() }}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {showResetPassword ? (
            // Reset Password Form
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-sky-300"
                  required
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  {error}
                </div>
              )}

              {message && (
                <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium shadow-md hover:shadow-lg transition disabled:opacity-50"
              >
                {loading ? 'Đang gửi...' : 'Gửi email đặt lại mật khẩu'}
              </button>

              <button
                type="button"
                onClick={() => setShowResetPassword(false)}
                className="w-full text-sm text-sky-600 hover:text-sky-700"
              >
                ← Quay lại đăng nhập
              </button>
            </form>
          ) : (
            // Login/Signup Form
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên hiển thị
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Tên của bạn"
                    className="w-full border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-sky-300"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-sky-300"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-sky-300"
                  required
                />
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Xác nhận mật khẩu
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-sky-300"
                    required
                  />
                </div>
              )}

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium shadow-md hover:shadow-lg transition disabled:opacity-50"
              >
                {loading ? 'Đang xử lý...' : (isLogin ? 'Đăng nhập' : 'Đăng ký')}
              </button>

              {isLogin && (
                <button
                  type="button"
                  onClick={() => setShowResetPassword(true)}
                  className="w-full text-sm text-gray-500 hover:text-gray-700"
                >
                  Quên mật khẩu?
                </button>
              )}

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">hoặc</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-3 rounded-lg border border-gray-300 hover:bg-gray-50 font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Đăng nhập với Google
              </button>

              <p className="text-center text-sm text-gray-600">
                {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
                <button
                  type="button"
                  onClick={switchMode}
                  className="text-sky-600 hover:text-sky-700 font-medium"
                >
                  {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
