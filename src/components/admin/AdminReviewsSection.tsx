import { Filter, Trash2 } from 'lucide-react'
import { Review } from '../../types'

interface AdminReviewsSectionProps {
  reviews: Review[]
  deleteReview: (review: Review) => void
}

export function AdminReviewsSection({ reviews, deleteReview }: AdminReviewsSectionProps) {
  return (
    <div className="panel-card p-7">
      <div className="mb-6 flex items-center gap-3">
        <Filter size={18} className="text-[#f04cb3]" />
        <h2 className="text-[22px] font-semibold text-[#241f2b]">Moderation des Avis</h2>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-[22px] border border-[#dfd3e4] bg-[#fffdfd] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-[#241f2b]">{review.title}</h3>
                <p className="mt-1 text-sm text-[#8a7f95]">
                  {review.author} • {review.rating}/5
                </p>
              </div>
              <button type="button" onClick={() => deleteReview(review)} className="icon-soft">
                <Trash2 size={15} />
              </button>
            </div>
            <p className="mt-4 text-sm leading-7 text-[#6f657a]">{review.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
