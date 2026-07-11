import { ClipboardList, Trash2 } from 'lucide-react'
import { currency, datetime } from '../../utils/format'
import { Order, OrderStatus } from '../../types'

interface AdminOrdersSectionProps {
  orders: Order[]
  remainingStockCount: number
  visibleOrders: Order[]
  orderStatusFilter: OrderStatus | 'Tous'
  setOrderStatusFilter: (value: OrderStatus | 'Tous') => void
  updateOrderStatus: (order: Order, status: OrderStatus) => void
}

export function AdminOrdersSection({
  orders,
  remainingStockCount,
  visibleOrders,
  orderStatusFilter,
  setOrderStatusFilter,
  updateOrderStatus
}: AdminOrdersSectionProps) {
  const pendingOrdersCount = orders.filter((order) => order.status === 'En attente').length
  const deliveredOrdersCount = orders.filter((order) => order.status === 'Livree').length
  const cancelledOrdersCount = orders.filter((order) => order.status === 'Annulee').length

  const orderFilters: Array<{
    value: OrderStatus | 'Tous'
    label: string
    icon?: 'trash'
  }> = [
    { value: 'Tous', label: `${orders.length} colis` },
    { value: 'En attente', label: `${pendingOrdersCount} colis en attente` },
    { value: 'Livree', label: `${deliveredOrdersCount} colis livres` },
    { value: 'Annulee', label: `${cancelledOrdersCount}`, icon: 'trash' }
  ]

  return (
    <div className="panel-card p-7">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <ClipboardList size={18} className="text-[#f04cb3]" />
          <h2 className="text-[22px] font-semibold text-[#241f2b]">Gestion des Commandes</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          {orderFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setOrderStatusFilter(filter.value)}
              className={`filter-chip inline-flex items-center gap-2 ${orderStatusFilter === filter.value ? 'filter-chip-active' : ''}`}
            >
              {filter.icon === 'trash' ? <Trash2 size={14} /> : null}
              {filter.label}
            </button>
          ))}
          <div className="filter-chip pointer-events-none">
            {remainingStockCount} colis restant en stock
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {visibleOrders.map((order) => (
          <div key={order.id} className="rounded-[22px] border border-[#dfd3e4] bg-[#fffdfd] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h3 className="text-[18px] font-semibold text-[#241f2b]">
                  {order.id} - {order.customerName}
                </h3>
                <p className="mt-1 text-sm text-[#8a7f95]">
                  {order.commune} • {datetime.format(new Date(order.createdAt))}
                </p>
                <p className="mt-3 text-[#f04cb3]">{currency.format(order.total)}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {(['En attente', 'Livree', 'Annulee'] as OrderStatus[]).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => updateOrderStatus(order, status)}
                    className={`filter-chip inline-flex items-center gap-2 ${order.status === status ? 'filter-chip-active' : ''}`}
                  >
                    {status === 'Annulee' ? <Trash2 size={14} /> : null}
                    {status === 'Annulee' ? 'Corbeille' : status}
                  </button>
                ))}
                <a
                  href={`https://wa.me/${order.phone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="primary-button px-4 py-3 text-[13px]"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
