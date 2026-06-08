import * as React from "react"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, className, type = "text", id, name, ...props }, ref) => (
    <div className={`space-y-1 ${className || ""}`}>
      {label ? (
        <label htmlFor={id || name} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      ) : null}
      <input
        id={id || name}
        name={name}
        type={type}
        ref={ref}
        className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        {...props}
      />
    </div>
  )
)
Input.displayName = "Input"

export { Input }
