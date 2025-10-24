
export interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  startIndex: number;
  endIndex: number;
  totalCount: number;
  filteredCount: number;
}

export function TablePagination({
  currentPage,
  totalPages,
  onPageChange,
  startIndex,
  endIndex,
  totalCount,
  filteredCount,
}: TablePaginationProps) {
  return (
    <div className="px-4 py-3 flex items-center justify-between bg-[#1a1a1a]">
      <div className="flex items-center space-x-2">
        {/* Previous button with arrow */}
        <button 
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="flex items-center gap-1 px-2 py-1 text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>
        
        {/* Page numbers */}
        <div className="flex items-center space-x-1">
          {/* First page */}
          <button
            onClick={() => onPageChange(1)}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              currentPage === 1
                ? 'text-white border-2'
                : 'text-gray-400 hover:text-white hover:bg-gray-600'
            }`}
            style={{
              backgroundColor: currentPage === 1 ? '#2E3333' : 'transparent',
              borderColor: currentPage === 1 ? '#66D9EF' : 'transparent',
            }}
          >
            1
          </button>
          
          {/* Second page */}
          {totalPages > 1 && (
            <button
              onClick={() => onPageChange(2)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                currentPage === 2
                  ? 'text-white border-2'
                  : 'text-gray-400 hover:text-white hover:bg-gray-600'
              }`}
              style={{
                backgroundColor: currentPage === 2 ? '#2E3333' : 'transparent',
                borderColor: currentPage === 2 ? '#66D9EF' : 'transparent',
              }}
            >
              2
            </button>
          )}
          
          {/* Third page */}
          {totalPages > 2 && (
            <button
              onClick={() => onPageChange(3)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                currentPage === 3
                  ? 'text-white border-2'
                  : 'text-gray-400 hover:text-white hover:bg-gray-600'
              }`}
              style={{
                backgroundColor: currentPage === 3 ? '#2E3333' : 'transparent',
                borderColor: currentPage === 3 ? '#66D9EF' : 'transparent',
              }}
            >
              3
            </button>
          )}
          
          {/* Ellipsis and last page for large datasets */}
          {totalPages > 3 && (
            <>
              <span className="px-1 text-gray-400">...</span>
              <button
                onClick={() => onPageChange(totalPages)}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  currentPage === totalPages
                    ? 'text-white border-2'
                    : 'text-gray-400 hover:text-white hover:bg-gray-600'
                }`}
                style={{
                  backgroundColor: currentPage === totalPages ? '#2E3333' : 'transparent',
                  borderColor: currentPage === totalPages ? '#66D9EF' : 'transparent',
                }}
              >
                {totalPages}
              </button>
            </>
          )}
        </div>
        
        {/* Next button with arrow */}
        <button 
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 px-2 py-1 text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      {/* Entries info */}
      <span className="text-sm text-gray-400">
        Showing {startIndex + 1} to {Math.min(endIndex, filteredCount)} of {filteredCount} entries
      </span>
    </div>
  );
}