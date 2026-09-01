import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalRecords = 0,
  limit = 20,
  onPageChange,
  onLimitChange
}) {
  const pageNum = parseInt(currentPage, 10) || 1;
  const startRecord = totalRecords === 0 ? 0 : (pageNum - 1) * limit + 1;
  const endRecord = Math.min(pageNum * limit, totalRecords);

  // Generate page numbers with smart ellipsis
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, pageNum - 1);
      let end = Math.min(totalPages - 1, pageNum + 1);

      if (pageNum <= 3) {
        start = 2;
        end = 4;
      } else if (pageNum >= totalPages - 2) {
        start = totalPages - 3;
        end = totalPages - 1;
      }

      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="pagination-bar">
      <div className="pagination-info">
        Showing <strong>{startRecord}–{endRecord}</strong> of <strong>{totalRecords.toLocaleString()}</strong> records
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        {/* Records per page selector */}
        {onLimitChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
            <span>Per page:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(parseInt(e.target.value, 10))}
              style={{ padding: '4px 8px', fontSize: '13px', borderRadius: 'var(--radius-sm)' }}
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        )}

        {/* Page controls */}
        <div className="pagination-controls">
          <button
            className="page-btn"
            disabled={pageNum <= 1}
            onClick={() => onPageChange(pageNum - 1)}
            title="Previous Page"
          >
            <ChevronLeft size={16} />
          </button>

          {getPageNumbers().map((page, index) => {
            if (page === '...') {
              return (
                <span key={`dots-${index}`} style={{ padding: '0 4px', color: 'var(--text-subtle)' }}>
                  ...
                </span>
              );
            }
            return (
              <button
                key={page}
                className={`page-btn ${pageNum === page ? 'active' : ''}`}
                onClick={() => onPageChange(page)}
              >
                {page}
              </button>
            );
          })}

          <button
            className="page-btn"
            disabled={pageNum >= totalPages}
            onClick={() => onPageChange(pageNum + 1)}
            title="Next Page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
