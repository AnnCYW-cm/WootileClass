import { BaseModal } from './BaseModal';

/**
 * Confirm Modal component
 * For confirmation dialogs with Yes/No actions
 */
export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = '确认',
  message,
  confirmText = '确认',
  cancelText = '取消',
  confirmStyle = 'danger',
  loading = false
}) => {
  const confirmButtonStyles = {
    danger: 'bg-red-500 hover:bg-red-600',
    primary: 'bg-purple-500 hover:bg-purple-600',
    success: 'bg-green-500 hover:bg-green-600'
  };

  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={title} size="sm" showCloseButton={false}>
      <p className="text-gray-600">{message}</p>

      <div className="flex justify-end space-x-4 mt-6">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading}
          className={`px-5 py-2.5 ${confirmButtonStyles[confirmStyle]} text-white rounded-xl font-medium transition-colors disabled:opacity-50`}
        >
          {loading ? '处理中...' : confirmText}
        </button>
      </div>
    </BaseModal>
  );
};
