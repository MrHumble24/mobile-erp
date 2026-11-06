export function BarcodeVisual({ value }: { value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 my-2 select-none" aria-hidden="true">
      <div className="h-8 flex items-center justify-center gap-[2px] overflow-hidden px-2">
        {Array.from({ length: 42 }).map((_, i) => {
          const charCode = value.charCodeAt(i % value.length) || 48
          const isThick = ((charCode + i * 7) % 3) === 0
          const isMedium = ((charCode + i * 5) % 2) === 0
          const widthClass = isThick ? "w-[3px]" : isMedium ? "w-[2px]" : "w-[1px]"
          const isHidden = (i * 13) % 9 === 0 && i > 3 && i < 38
          return (
            <div
              key={i}
              className={`h-full bg-black ${isHidden ? "opacity-0" : "opacity-100"} ${widthClass}`}
            />
          )
        })}
      </div>
      <span className="font-mono text-[9px] tracking-[0.2em] font-semibold text-black/80">{value}</span>
    </div>
  )
}
