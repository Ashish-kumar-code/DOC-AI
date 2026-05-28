import { AlertCircle, CheckCircle, AlertTriangle, Info, X, Loader2 } from 'lucide-react';

/* ===== LOADING COMPONENT ===== */
export function Loading({ message = 'Loading...', fullScreen = false }) {
  const content = (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 size={48} className="text-green-600 animate-spin mb-4" />
      <p className="text-lg text-gray-700 font-medium">{message}</p>
    </div>
  );

  if (fullScreen) {
    return <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">{content}</div>;
  }
  return content;
}

/* ===== ALERT COMPONENTS ===== */
export function ErrorAlert({ message, onDismiss, title = 'Error' }) {
  return (
    <div className="alert alert-error">
      <div className="flex items-start gap-3">
        <AlertCircle size={20} className="alert-error-text flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="alert-error-text font-bold">{title}</h3>
          <p className="alert-error-text text-sm mt-1">{message}</p>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="text-red-600 hover:text-red-800">
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

export function SuccessAlert({ message, onDismiss, title = 'Success' }) {
  return (
    <div className="alert alert-success">
      <div className="flex items-start gap-3">
        <CheckCircle size={20} className="alert-success-text flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="alert-success-text font-bold">{title}</h3>
          <p className="alert-success-text text-sm mt-1">{message}</p>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="text-green-600 hover:text-green-800">
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

export function WarningAlert({ message, title = 'Warning' }) {
  return (
    <div className="alert alert-warning">
      <div className="flex items-start gap-3">
        <AlertTriangle size={20} className="alert-warning-text flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="alert-warning-text font-bold">{title}</h3>
          <p className="alert-warning-text text-sm mt-1">{message}</p>
        </div>
      </div>
    </div>
  );
}

export function InfoAlert({ message, title = 'Info' }) {
  return (
    <div className="alert alert-info">
      <div className="flex items-start gap-3">
        <Info size={20} className="alert-info-text flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="alert-info-text font-bold">{title}</h3>
          <p className="alert-info-text text-sm mt-1">{message}</p>
        </div>
      </div>
    </div>
  );
}

/* ===== DISCLAIMER BANNER ===== */
export function DisclaimerBanner() {
  return (
    <div className="alert alert-warning mb-6">
      <div className="flex items-start gap-3">
        <AlertTriangle size={20} className="alert-warning-text flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="alert-warning-text font-bold">Important Medical Disclaimer</h3>
          <p className="alert-warning-text text-sm mt-1">
            DOC AI is for educational and preliminary assessment purposes only. It is NOT a substitute for professional medical advice, diagnosis, or treatment. Always consult with a licensed healthcare provider. In emergencies, contact emergency services immediately.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ===== BUTTON COMPONENT ===== */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  ...props
}) {
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    danger: 'btn-danger',
  };

  const sizeClasses = {
    sm: 'btn-sm',
    md: 'btn',
    lg: 'btn-lg',
  };

  return (
    <button
      disabled={disabled || loading}
      className={`btn ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <Loader2 size={18} className="animate-spin" />
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

/* ===== CARD COMPONENT ===== */
export function Card({ children, className = '', highlight = false, variant = 'default' }) {
  const variantClasses = {
    default: 'card',
    sm: 'card-sm',
    bordered: 'card-bordered',
    highlight: 'card-highlight',
  };

  return <div className={`${variantClasses[variant]} ${className}`}>{children}</div>;
}

/* ===== CONFIDENCE METER ===== */
export function ConfidenceMeter({ score = 0, label = 'Confidence' }) {
  const percentage = Math.min(100, Math.max(0, score * 100));
  let color = 'bg-red-500';
  let textColor = 'text-red-700';
  let label_text = 'Low';

  if (percentage >= 80) {
    color = 'bg-green-600';
    textColor = 'text-green-700';
    label_text = 'High';
  } else if (percentage >= 60) {
    color = 'bg-amber-500';
    textColor = 'text-amber-700';
    label_text = 'Moderate';
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <span className={`text-sm font-bold ${textColor}`}>{percentage.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`${color} h-full rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className={`text-xs mt-1.5 font-medium ${textColor}`}>{label_text} confidence</p>
    </div>
  );
}

/* ===== TAB BUTTON ===== */
export function TabButton({ children, active = false, onClick, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-6 py-3.5 font-semibold rounded-2xl transition-all
        ${
          active
            ? 'bg-green-600 text-white shadow-lg'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }
      `}
    >
      {Icon && <Icon size={20} />}
      {children}
    </button>
  );
}

/* ===== FILE UPLOAD PREVIEW ===== */
export function FilePreview({ file, preview, onRemove, fileType = 'image' }) {
  return (
    <div className="bg-gray-50 rounded-2xl border-2 border-gray-200 p-6">
      {preview && fileType === 'image' && (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="preview"
            className="max-h-64 rounded-2xl shadow-lg"
          />
          <button
            onClick={onRemove}
            className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-all shadow-lg"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {file && (
        <div className="mt-4 p-4 bg-white border border-gray-200 rounded-xl flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900">{file.name}</p>
            <p className="text-sm text-gray-600">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <button
            onClick={onRemove}
            className="text-red-600 hover:text-red-700"
          >
            <X size={22} />
          </button>
        </div>
      )}
    </div>
  );
}

/* ===== LABEL COMPONENT ===== */
export function Label({ children, required = false, htmlFor }) {
  return (
    <label htmlFor={htmlFor} className="label">
      {children}
      {required && <span className="text-red-600 ml-1">*</span>}
    </label>
  );
}

/* ===== BADGE COMPONENT ===== */
export function Badge({ children, variant = 'success' }) {
  const variantClasses = {
    success: 'badge-success',
    danger: 'badge-danger',
    warning: 'badge-warning',
  };

  return <span className={`badge ${variantClasses[variant]}`}>{children}</span>;
}
