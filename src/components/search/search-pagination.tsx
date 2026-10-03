'use client';

import React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Pagination } from '@/src/components/ui/pagination';

interface SearchPaginationProps {
  currentPage: number;
  totalPages: number;
}

export function SearchPagination({
  currentPage,
  totalPages,
}: SearchPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page > 1) {
      params.set('page', page.toString());
    } else {
      params.delete('page');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="pt-6 border-t border-[var(--line)] flex justify-center">
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
