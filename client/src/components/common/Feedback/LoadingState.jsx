/**
 * LoadingState component
 * Shows loading state for content areas
 */
export const LoadingState = ({
  type = 'spinner',
  message = '加载中...',
  fullScreen = false
}) => {
  const containerClass = fullScreen
    ? 'fixed inset-0 bg-white/80 flex items-center justify-center z-50'
    : 'flex items-center justify-center py-12';

  if (type === 'skeleton') {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((n) => (
          <div key={n} className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'dots') {
    return (
      <div className={containerClass}>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <div className="text-center">
        <svg
          className="animate-spin h-8 w-8 text-purple-500 mx-auto mb-3"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <p className="text-gray-500 text-sm">{message}</p>
      </div>
    </div>
  );
};

/**
 * EmptyState component
 * Shows empty state for content areas
 */
export const EmptyState = ({
  icon = null,
  title = '暂无数据',
  description = '',
  action = null
}) => {
  return (
    <div className="text-center py-12">
      {icon && (
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mb-5">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-medium text-gray-900 mb-2">{title}</h3>
      {description && <p className="text-gray-500 mb-6">{description}</p>}
      {action}
    </div>
  );
};
