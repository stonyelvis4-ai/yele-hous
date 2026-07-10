import { BadgePercent, LayoutDashboard } from 'lucide-react'
import { SmartMedia } from '../SmartMedia'
import { collectionFallbackImage } from '../../lib/imageFallbacks'
import { currency, datetime } from '../../utils/format'
import { Collection, DashboardStat, Order } from '../../types'

interface AdminDashboardSectionProps {
  dashboardStats: Array<DashboardStat & { accent: string }>
  recentOrders: Order[]
  recentCollections: Collection[]
  navigate: (path: string) => void
  startEditingCollection: (collection: Collection) => void
}

export function AdminDashboardSection({
  dashboardStats,
  recentOrders,
  recentCollections,
  navigate,
  startEditingCollection
}: AdminDashboardSectionProps) {
  return (
    <>
      <div className="admin-stats-grid">
        {dashboardStats.map((stat) => (
          <div key={stat.label} className={`admin-stat-card admin-stat-card-${stat.accent}`}>
            <p className="admin-stat-label">{stat.label}</p>
            <h3 className="admin-stat-value">{stat.value}</h3>
            <p className="admin-stat-helper">{stat.helper}</p>
          </div>
        ))}
      </div>

      <div className="panel-card admin-table-card p-7">
        <div className="admin-table-head">
          <div className="flex items-center gap-3">
            <LayoutDashboard size={18} className="text-[#f04cb3]" />
            <h2 className="editorial-title text-[22px] font-semibold text-[#241f2b]">Dernieres Commandes Recues</h2>
          </div>
          <button type="button" onClick={() => navigate('/admin/orders')} className="admin-link-button">
            Voir tout
          </button>
        </div>

        <div className="admin-order-table">
          <div className="admin-order-row admin-order-row-head">
            <span>Client</span>
            <span>Quartier & Ville</span>
            <span>Date</span>
            <span>Montant</span>
            <span>Statut</span>
          </div>

          {recentOrders.map((order) => (
            <div key={order.id} className="admin-order-row">
              <div>
                <strong className="admin-order-primary">{order.customerName}</strong>
                <span className="admin-order-secondary">{order.phone}</span>
              </div>
              <div>
                <strong className="admin-order-primary">Abidjan - {order.commune}</strong>
                <span className="admin-order-secondary">
                  {order.notes?.trim() ? order.notes : 'Commande conciergerie Yele House'}
                </span>
              </div>
              <span className="admin-order-muted">{datetime.format(new Date(order.createdAt))}</span>
              <strong className="admin-order-amount">{currency.format(order.total)}</strong>
              <span
                className={`admin-status-pill ${
                  order.status === 'Livree'
                    ? 'admin-status-pill-success'
                    : order.status === 'Annulee'
                      ? 'admin-status-pill-cancelled'
                      : 'admin-status-pill-pending'
                }`}
              >
                {order.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="panel-card p-7">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BadgePercent size={18} className="text-[#f04cb3]" />
            <h2 className="text-[22px] font-semibold text-[#241f2b]">Tendances & Collections</h2>
          </div>
          <button type="button" onClick={() => navigate('/admin/products')} className="admin-link-button">
            Gerer tout
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {recentCollections.map((collection) => (
            <div key={collection.id} className="rounded-[22px] border border-[#dfd3e4] bg-[#fffdfd] p-4">
              <SmartMedia
                image={collection.image}
                video={collection.video}
                alt={collection.name}
                fallbackImage={collectionFallbackImage}
                className="h-44 w-full rounded-[18px] object-cover"
              />
              <div className="mt-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-[#241f2b]">{collection.name}</h3>
                  <p className="mt-2 max-h-[72px] overflow-hidden text-sm leading-6 text-[#6f657a]">{collection.description}</p>
                </div>
                {collection.isFeatured ? (
                  <span className="rounded-full bg-[#ef4cae]/10 px-3 py-1 text-xs font-semibold text-[#f04cb3]">
                    Accueil
                  </span>
                ) : null}
              </div>
              <div className="mt-4 flex gap-2">
                <button type="button" onClick={() => startEditingCollection(collection)} className="secondary-button">
                  Editer
                </button>
                <button type="button" onClick={() => navigate('/admin/products')} className="secondary-button">
                  Ouvrir
                </button>
              </div>
            </div>
          ))}
        </div>

        {!recentCollections.length ? (
          <p className="mt-4 rounded-[20px] border border-dashed border-[#dfd3e4] bg-[#fffdfd] px-5 py-6 text-sm text-[#7a6f86]">
            Aucune tendance disponible pour le moment.
          </p>
        ) : null}
      </div>
    </>
  )
}
