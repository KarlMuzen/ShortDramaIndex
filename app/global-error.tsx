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
      <body className="bg-[#F6F7F9] text-[#14161B] min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 bg-white border border-[#E2E5EB] rounded-[12px] text-center space-y-4">
          <h1 className="text-[20px] font-semibold text-[#14161B]">
            Application Error
          </h1>
          <p className="text-[14px] text-[#5A6072]">
            An unexpected global error occurred while rendering the page.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="px-4 py-2 bg-[#B3123C] text-white rounded-[8px] text-[13px] font-medium"
          >
            Reload application
          </button>
        </div>
      </body>
    </html>
  );
}
