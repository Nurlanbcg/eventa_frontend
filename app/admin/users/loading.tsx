import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function Loading() {
  return (
    <div className="flex h-[80vh] w-full items-center justify-center">
      <LoadingSpinner size={300} />
    </div>
  )
}
