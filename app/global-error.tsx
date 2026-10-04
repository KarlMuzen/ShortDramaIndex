'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-[#F6F7F9] text-[#14161B]">
        <div className="text-center p-8 max-w-md">
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-sm text-gray-600 mb-4">
            An unexpected error occurred.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="px-4 py-2 bg-[#B3123C] text-white rounded-[8px] font-medium text-sm"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
