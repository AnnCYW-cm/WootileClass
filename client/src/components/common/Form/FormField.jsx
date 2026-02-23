/**
 * FormField component
 * Reusable form field with label and input styling
 */
export const FormField = ({
  label,
  required = false,
  error = '',
  children,
  helpText = ''
}) => {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {helpText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helpText}</p>
      )}
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

/**
 * Input component
 * Styled input with consistent appearance
 */
export const Input = ({
  type = 'text',
  value,
  onChange,
  placeholder = '',
  disabled = false,
  required = false,
  className = '',
  ...props
}) => {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      className={`block w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow disabled:bg-gray-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    />
  );
};

/**
 * Textarea component
 */
export const Textarea = ({
  value,
  onChange,
  placeholder = '',
  rows = 3,
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      className={`block w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow resize-none disabled:bg-gray-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    />
  );
};
