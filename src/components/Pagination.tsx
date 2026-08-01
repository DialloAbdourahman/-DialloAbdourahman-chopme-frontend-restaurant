import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

const getPageNumbers = (page: number, totalPages: number): (number | "…")[] => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "…")[] = [1];

  if (page > 3) pages.push("…");

  for (
    let i = Math.max(2, page - 1);
    i <= Math.min(totalPages - 1, page + 1);
    i++
  ) {
    pages.push(i);
  }

  if (page < totalPages - 2) pages.push("…");

  pages.push(totalPages);

  return pages;
};

const Pagination = ({ page, totalPages, onPageChange }: Props) => {
  if (totalPages <= 1) return null;

  const handleChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    onPageChange(newPage);
  };

  return (
    <div className="flex items-center justify-center gap-1.5 mt-8">
      <button
        type="button"
        onClick={() => handleChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className="flex items-center justify-center w-9 h-9 rounded-xl bg-card text-text shadow-sm hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        <ChevronLeft size={16} />
      </button>

      {getPageNumbers(page, totalPages).map((p, i) =>
        p === "…" ? (
          <span
            key={`ellipsis-${i}`}
            className="w-9 h-9 flex items-center justify-center text-sm text-gray-400"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => handleChange(p)}
            className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${
              p === page
                ? "bg-primary text-white shadow-sm"
                : "bg-card text-text shadow-sm hover:shadow-md"
            }`}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => handleChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        className="flex items-center justify-center w-9 h-9 rounded-xl bg-card text-text shadow-sm hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

export default Pagination;
