export function Navbar({ right }: { right?: React.ReactNode }) {
  return (
    <header className="h-16 bg-white/20 backdrop-blur-sm border-b border-white/15 flex items-center px-6 flex-shrink-0">
      <div className="flex-1" />

      <span
        className="font-light text-gray-900 select-none"
        style={{ fontSize: 40, letterSpacing: '3em' }}
      >
        STICK
      </span>

      <div className="flex-1 flex items-center justify-end">
        {right}
      </div>
    </header>
  )
}
