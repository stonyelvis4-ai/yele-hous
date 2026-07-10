import { MessageCircleMore } from 'lucide-react'
import { ContactMessage } from '../../types'
import { datetime } from '../../utils/format'

interface AdminMessagesSectionProps {
  messages: ContactMessage[]
  toggleMessageRead: (message: ContactMessage) => void
}

export function AdminMessagesSection({ messages, toggleMessageRead }: AdminMessagesSectionProps) {
  return (
    <div className="panel-card p-7">
      <div className="mb-6 flex items-center gap-3">
        <MessageCircleMore size={18} className="text-[#f04cb3]" />
        <h2 className="text-[22px] font-semibold text-[#241f2b]">Messagerie de Conciergerie</h2>
      </div>

      <div className="space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="rounded-[22px] border border-[#dfd3e4] bg-[#fffdfd] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-[#241f2b]">{message.topic}</h3>
                <p className="mt-1 text-sm text-[#8a7f95]">
                  {message.name} • {datetime.format(new Date(message.createdAt))}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleMessageRead(message)}
                className={`filter-chip ${message.isRead ? '' : 'filter-chip-active'}`}
              >
                {message.isRead ? 'Lu' : 'Non lu'}
              </button>
            </div>
            <p className="mt-4 text-sm leading-7 text-[#6f657a]">{message.message}</p>
            <a href={`https://wa.me/${message.phone}`} target="_blank" rel="noreferrer" className="mt-4 inline-flex primary-button px-5">
              Reponse directe
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
