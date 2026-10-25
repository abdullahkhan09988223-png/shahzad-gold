export function Logo({
  size = 40,
  className = '',
}: {
  size?: number
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logoGold" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#F9E27E" />
          <stop offset="35%" stopColor="#E0B84C" />
          <stop offset="70%" stopColor="#C79A2E" />
          <stop offset="100%" stopColor="#8B6914" />
        </linearGradient>
      </defs>
      {/* Letter A - golden */}
      <path
        d="M 50 6 
           L 4 94 
           L 20 94 
           L 50 40 
           L 80 94 
           L 96 94 
           L 96 42 
           L 50 6 Z"
        fill="url(#logoGold)"
      />
    </svg>
  )
}