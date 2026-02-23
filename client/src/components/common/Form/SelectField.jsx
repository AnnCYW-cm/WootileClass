/**
 * SelectField component
 * Styled select dropdown with consistent appearance
 */
export const SelectField = ({
  value,
  onChange,
  options = [],
  placeholder = '请选择',
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`block w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow bg-white disabled:bg-gray-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
        >
          {option.label}
        </option>
      ))}
    </select>
  );
};

/**
 * Checkbox component
 */
export const Checkbox = ({
  checked,
  onChange,
  label,
  disabled = false,
  className = ''
}) => {
  return (
    <label className={`flex items-center gap-2 cursor-pointer ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="rounded text-purple-600 focus:ring-purple-500"
      />
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </label>
  );
};

/**
 * RadioGroup component
 */
export const RadioGroup = ({
  name,
  value,
  onChange,
  options = [],
  direction = 'horizontal'
}) => {
  return (
    <div className={`flex ${direction === 'vertical' ? 'flex-col space-y-2' : 'flex-row space-x-4'}`}>
      {options.map((option) => (
        <label
          key={option.value}
          className="flex items-center gap-2 cursor-pointer"
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={(e) => onChange(e.target.value)}
            className="text-purple-600 focus:ring-purple-500"
          />
          <span className="text-sm text-gray-700">{option.label}</span>
        </label>
      ))}
    </div>
  );
};
