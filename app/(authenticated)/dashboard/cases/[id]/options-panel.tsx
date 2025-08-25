"use client"

export const OptionsPanel = () => {
  return (
    <div className="mb-6 flex justify-end">
      <div className="flex gap-2">
        <button
          type="button"
          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          onClick={() => {
            // Placeholder for export logic
            alert("Export functionality coming soon.")
          }}
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
          </svg>
          Export
        </button>
        <button
          type="button"
          className="inline-flex items-center rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-gray-50"
          onClick={() => {
            // Placeholder for archive logic
            alert("Archive functionality coming soon.")
          }}
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="4" rx="2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
          </svg>
          Archive
        </button>
        <button
          type="button"
          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          onClick={() => {
            // Placeholder for redaction mode logic
            alert("Redaction Mode toggled (functionality coming soon).")
          }}
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8" />
          </svg>
          Redaction Mode
        </button>
      </div>
    </div>
  )
}
