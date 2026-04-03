export function Loading({ message = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-lg text-gray-600">{message}</p>
      </div>
    </div>
  )
}

export function ErrorAlert({ message, onDismiss }) {
  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-red-800 font-bold">Error</h3>
          <p className="text-red-700">{message}</p>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="text-red-700 hover:text-red-900">
            ✕
          </button>
        )}
      </div>
    </div>
  )
}

export function SuccessAlert({ message, onDismiss }) {
  return (
    <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4 rounded">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-green-800 font-bold">Success</h3>
          <p className="text-green-700">{message}</p>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="text-green-700 hover:text-green-900">
            ✕
          </button>
        )}
      </div>
    </div>
  )
}

export function WarningAlert({ message }) {
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4 rounded">
      <div>
        <h3 className="text-yellow-800 font-bold">Warning</h3>
        <p className="text-yellow-700">{message}</p>
      </div>
    </div>
  )
}

export function DisclaimerBanner() {
  return (
    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
      <h3 className="font-bold text-blue-900">⚠️ Important Disclaimer</h3>
      <p className="text-blue-800 text-sm mt-1">
        This system is for educational and preliminary assistance purposes only. It does not replace professional medical advice, diagnosis, or treatment. In emergencies, contact a licensed doctor or emergency services immediately.
      </p>
    </div>
  )
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
  }

  return (
    <button
      className={`px-4 py-2 rounded font-semibold transition ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      {children}
    </div>
  )
}

export function ConfidenceMeter({ score = 0 }) {
  const percentage = Math.min(100, Math.max(0, score * 100))
  const color = percentage < 50 ? 'bg-red-500' : percentage < 75 ? 'bg-yellow-500' : 'bg-green-500'

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold">Confidence</span>
        <span className="text-sm font-bold">{(percentage).toFixed(1)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div className={`${color} h-2.5 rounded-full transition-all`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  )
}
