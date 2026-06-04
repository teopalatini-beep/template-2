export function SkeletonRow({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b border-[#1a1a1a]">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-3.5 skeleton rounded" style={{ width: `${60 + Math.random() * 30}%` }} />
        </td>
      ))}
    </tr>
  )
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} cols={cols} />
      ))}
    </>
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-[#141414] border border-[#1f1f1f] rounded-xl p-5 space-y-3">
      <div className="h-3 skeleton rounded w-1/3" />
      <div className="h-8 skeleton rounded w-1/2" />
      <div className="h-3 skeleton rounded w-2/3" />
    </div>
  )
}

export function SkeletonText({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded ${className}`} />
}
