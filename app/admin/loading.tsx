
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function Loading() {
    return (
        <div className="min-h-screen w-full flex items-center justify-center p-8 bg-background">
            <LoadingSpinner size={300} />
        </div>
    )
}
