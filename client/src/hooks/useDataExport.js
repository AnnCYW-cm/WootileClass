import { useState, useCallback } from 'react';

/**
 * Hook for data export functionality
 * Supports CSV and Excel-compatible export
 */
export const useDataExport = () => {
  const [exporting, setExporting] = useState(false);

  const exportToCSV = useCallback((data, filename, columns) => {
    setExporting(true);
    try {
      // Build CSV content
      const headers = columns.map(col => col.label).join(',');
      const rows = data.map(item =>
        columns.map(col => {
          const value = col.getValue ? col.getValue(item) : item[col.key];
          // Escape quotes and wrap in quotes if contains comma or quote
          const str = String(value ?? '');
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }).join(',')
      );

      const csvContent = [headers, ...rows].join('\n');

      // Add BOM for Excel to recognize UTF-8
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

      downloadBlob(blob, `${filename}.csv`);
    } finally {
      setExporting(false);
    }
  }, []);

  const exportToJSON = useCallback((data, filename) => {
    setExporting(true);
    try {
      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      downloadBlob(blob, `${filename}.json`);
    } finally {
      setExporting(false);
    }
  }, []);

  return {
    exporting,
    exportToCSV,
    exportToJSON
  };
};

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
