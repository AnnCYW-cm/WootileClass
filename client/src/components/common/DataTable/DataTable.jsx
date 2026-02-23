import { useState } from 'react';

/**
 * Reusable DataTable component
 * Provides consistent table styling and pagination
 */
export const DataTable = ({
  columns,
  data,
  loading = false,
  emptyMessage = '暂无数据',
  emptyIcon = null,
  onRowClick = null,
  rowKey = 'id',
  pageSize = 10,
  showPagination = true,
  className = ''
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = showPagination
    ? data.slice(startIndex, startIndex + pageSize)
    : data;

  if (loading) {
    return (
      <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${className}`}>
        <div className="p-6 space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="animate-pulse">
              <div className="h-12 bg-gray-100 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-14 text-center ${className}`}>
        {emptyIcon && (
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mb-5">
            {emptyIcon}
          </div>
        )}
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={column.key || index}
                  className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.align === 'right' ? 'text-right' :
                    column.align === 'center' ? 'text-center' : 'text-left'
                  }`}
                  style={{ width: column.width }}
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((row, rowIndex) => (
              <tr
                key={row[rowKey] || rowIndex}
                className={`${onRowClick ? 'cursor-pointer hover:bg-purple-50' : 'hover:bg-gray-50'} transition-colors`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={column.key || colIndex}
                    className={`px-6 py-4 whitespace-nowrap text-sm ${
                      column.align === 'right' ? 'text-right' :
                      column.align === 'center' ? 'text-center' : 'text-left'
                    }`}
                  >
                    {column.render
                      ? column.render(row[column.key], row, rowIndex)
                      : row[column.key] || '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showPagination && totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            共 {data.length} 条，第 {currentPage} / {totalPages} 页
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
