import { Trash2 } from 'lucide-react'
import { SmartMedia } from '../SmartMedia'
import { collectionFallbackImage, productFallbackImage } from '../../lib/imageFallbacks'
import { currency, datetime } from '../../utils/format'
import { Collection, Order, Product, Review } from '../../types'

interface AdminTrashSectionProps {
  trashItemsCount: number
  deletedOrders: Order[]
  deletedProducts: Product[]
  deletedCollections: Collection[]
  deletedReviews: Review[]
  restoreDeletedOrder: (order: Order) => void
  permanentlyDeleteOrder: (order: Order) => void
  restoreDeletedProduct: (product: Product) => void
  restoreDeletedCollection: (collection: Collection) => void
  restoreDeletedReview: (review: Review) => void
}

export function AdminTrashSection({
  trashItemsCount,
  deletedOrders,
  deletedProducts,
  deletedCollections,
  deletedReviews,
  restoreDeletedOrder,
  permanentlyDeleteOrder,
  restoreDeletedProduct,
  restoreDeletedCollection,
  restoreDeletedReview
}: AdminTrashSectionProps) {
  return (
    <div className="grid gap-6">
      <div className="panel-card p-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <Trash2 size={18} className="text-[#f04cb3]" />
              <h2 className="text-[22px] font-semibold text-[#241f2b]">Elements supprimes</h2>
            </div>
            <p className="text-sm leading-7 text-[#6f657a]">
              Les suppressions sont maintenant envoyees ici. Vous pouvez restaurer un article, une tendance ou un avis a
              tout moment.
            </p>
          </div>
          <div className="rounded-[18px] border border-[#eadceb] bg-[#fffdfd] px-4 py-3 text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a7f95]">Total</p>
            <p className="mt-2 text-2xl font-semibold text-[#241f2b]">{trashItemsCount}</p>
          </div>
        </div>
      </div>

      <div className="panel-card p-7">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h3 className="text-[20px] font-semibold text-[#241f2b]">Commandes</h3>
          <span className="rounded-full bg-[#ef4cae]/10 px-3 py-1 text-xs font-semibold text-[#f04cb3]">
            {deletedOrders.length}
          </span>
        </div>
        <div className="space-y-3">
          {deletedOrders.length ? (
            deletedOrders.map((order) => (
              <div key={order.id} className="rounded-[22px] border border-[#dfd3e4] bg-[#fffdfd] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h4 className="font-semibold text-[#241f2b]">
                      {order.id} - {order.customerName}
                    </h4>
                    <p className="mt-1 text-sm text-[#8a7f95]">
                      {order.commune} • {currency.format(order.total)}
                    </p>
                    <p className="mt-1 text-sm text-[#8a7f95]">{order.phone}</p>
                    {order.deletedAt ? (
                      <p className="mt-3 text-xs text-[#9a8ea5]">Supprime le {datetime.format(new Date(order.deletedAt))}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => restoreDeletedOrder(order)} className="primary-button px-5">
                      Restaurer
                    </button>
                    <button type="button" onClick={() => permanentlyDeleteOrder(order)} className="secondary-button px-5">
                      Supprimer definitivement
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-[20px] border border-dashed border-[#dfd3e4] bg-[#fffdfd] px-5 py-6 text-sm text-[#7a6f86]">
              Aucune commande dans la corbeille.
            </p>
          )}
        </div>
      </div>

      <div className="panel-card p-7">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h3 className="text-[20px] font-semibold text-[#241f2b]">Produits</h3>
          <span className="rounded-full bg-[#ef4cae]/10 px-3 py-1 text-xs font-semibold text-[#f04cb3]">
            {deletedProducts.length}
          </span>
        </div>
        <div className="space-y-3">
          {deletedProducts.length ? (
            deletedProducts.map((product) => (
              <div
                key={product.id}
                className="flex flex-col gap-4 rounded-[22px] border border-[#dfd3e4] bg-[#fffdfd] p-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="flex items-center gap-4">
                  <SmartMedia
                    image={product.image}
                    alt={product.name}
                    fallbackImage={productFallbackImage(product.category)}
                    className="h-14 w-14 rounded-[16px] object-cover"
                  />
                  <div>
                    <h4 className="font-semibold text-[#241f2b]">{product.name}</h4>
                    <p className="mt-1 text-sm text-[#8a7f95]">
                      {product.category} • {currency.format(product.price)}
                    </p>
                    {product.deletedAt ? (
                      <p className="mt-1 text-xs text-[#9a8ea5]">Supprime le {datetime.format(new Date(product.deletedAt))}</p>
                    ) : null}
                  </div>
                </div>
                <button type="button" onClick={() => restoreDeletedProduct(product)} className="primary-button px-5">
                  Restaurer
                </button>
              </div>
            ))
          ) : (
            <p className="rounded-[20px] border border-dashed border-[#dfd3e4] bg-[#fffdfd] px-5 py-6 text-sm text-[#7a6f86]">
              Aucun produit dans la corbeille.
            </p>
          )}
        </div>
      </div>

      <div className="panel-card p-7">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h3 className="text-[20px] font-semibold text-[#241f2b]">Collections</h3>
          <span className="rounded-full bg-[#ef4cae]/10 px-3 py-1 text-xs font-semibold text-[#f04cb3]">
            {deletedCollections.length}
          </span>
        </div>
        <div className="space-y-3">
          {deletedCollections.length ? (
            deletedCollections.map((collection) => (
              <div
                key={collection.id}
                className="flex flex-col gap-4 rounded-[22px] border border-[#dfd3e4] bg-[#fffdfd] p-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="flex items-center gap-4">
                  <SmartMedia
                    image={collection.image}
                    alt={collection.name}
                    fallbackImage={collectionFallbackImage}
                    className="h-14 w-14 rounded-[16px] object-cover"
                  />
                  <div>
                    <h4 className="font-semibold text-[#241f2b]">{collection.name}</h4>
                    <p className="mt-1 text-sm text-[#8a7f95]">{collection.description}</p>
                    {collection.deletedAt ? (
                      <p className="mt-1 text-xs text-[#9a8ea5]">Supprime le {datetime.format(new Date(collection.deletedAt))}</p>
                    ) : null}
                  </div>
                </div>
                <button type="button" onClick={() => restoreDeletedCollection(collection)} className="primary-button px-5">
                  Restaurer
                </button>
              </div>
            ))
          ) : (
            <p className="rounded-[20px] border border-dashed border-[#dfd3e4] bg-[#fffdfd] px-5 py-6 text-sm text-[#7a6f86]">
              Aucune collection dans la corbeille.
            </p>
          )}
        </div>
      </div>

      <div className="panel-card p-7">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h3 className="text-[20px] font-semibold text-[#241f2b]">Avis</h3>
          <span className="rounded-full bg-[#ef4cae]/10 px-3 py-1 text-xs font-semibold text-[#f04cb3]">
            {deletedReviews.length}
          </span>
        </div>
        <div className="space-y-3">
          {deletedReviews.length ? (
            deletedReviews.map((review) => (
              <div key={review.id} className="rounded-[22px] border border-[#dfd3e4] bg-[#fffdfd] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h4 className="font-semibold text-[#241f2b]">{review.title}</h4>
                    <p className="mt-1 text-sm text-[#8a7f95]">
                      {review.author} • {review.rating}/5
                    </p>
                    <p className="mt-3 text-sm leading-7 text-[#6f657a]">{review.body}</p>
                    {review.deletedAt ? (
                      <p className="mt-3 text-xs text-[#9a8ea5]">Supprime le {datetime.format(new Date(review.deletedAt))}</p>
                    ) : null}
                  </div>
                  <button type="button" onClick={() => restoreDeletedReview(review)} className="primary-button px-5">
                    Restaurer
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-[20px] border border-dashed border-[#dfd3e4] bg-[#fffdfd] px-5 py-6 text-sm text-[#7a6f86]">
              Aucun avis dans la corbeille.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
