
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
    size?: number | string
}

export function LoadingSpinner({ className, size = 32, ...props }: LoadingSpinnerProps) {
    return (
        <div className={cn("flex items-center justify-center", className)} {...props}>
            <img
                src="/loading.gif"
                alt="Loading..."
                style={{ width: size, height: size }}
                className="object-contain" // ensure aspect ratio
            />
        </div>
    )
}
