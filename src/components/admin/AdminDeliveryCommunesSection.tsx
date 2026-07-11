import { Dispatch, FormEvent, SetStateAction } from 'react'
import { MapPin, Search, Trash2 } from 'lucide-react'
import { DeliveryCommune } from '../../types'

interface DeliveryCommuneFormState {
  id: string
  nom: string
  prixLivraison: number
  estActive: boolean
}

interface AdminDeliveryCommunesSectionProps {
  deliveryCommunes: DeliveryCommune[]
  deliveryCommuneForm: DeliveryCommuneFormState
  editingDeliveryCommuneId: string | null
  deliveryCommuneSearch: string
  deliveryCommuneMessage: string
  setDeliveryCommuneForm: Dispatch<SetStateAction<DeliveryCommuneFormState>>
  setDeliveryCommuneSearch: Dispatch<SetStateAction<string>>
  saveDeliveryCommune: (event: FormEvent<HTMLFormElement>) => void
  resetDeliveryCommuneForm: () => void
  startEditingDeliveryCommune: (commune: DeliveryCommune) => void
  toggleDeliveryCommuneStatus: (commune: DeliveryCommune) => void
  removeDeliveryCommune: (commune: DeliveryCommune) => void
}

export function AdminDeliveryCommunesSection({
  deliveryCommunes,
  deliveryCommuneForm,
  editingDeliveryCommuneId,
  deliveryCommuneSearch,
  deliveryCommuneMessage,
  setDeliveryCommuneForm,
  setDeliveryCommuneSearch,
  saveDeliveryCommune,
  resetDeliveryCommuneForm,
  startEditingDeliveryCommune,
  toggleDeliveryCommuneStatus,
  removeDeliveryCommune
}: AdminDeliveryCommunesSectionProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="panel-card p-7">
        <div className="mb-6 flex items-center gap-3">
          <MapPin size={18} className="text-[#f04cb3]" />
          <h2 className="text-[22px] font-semibold text-[#241f2b]">Livraison &gt; Communes</h2>
        </div>

        <form onSubmit={saveDeliveryCommune} className="grid gap-5">
          <div>
            <label className="form-label">NOM DE LA COMMUNE</label>
            <input
              value={deliveryCommuneForm.nom}
              onChange={(event) => setDeliveryCommuneForm((current) => ({ ...current, nom: event.target.value }))}
              placeholder="Ex: Cocody"
              className="field-input"
            />
          </div>

          <div>
            <label className="form-label">PRIX DE LIVRAISON</label>
            <div className="relative">
              <input
                type="number"
                min={0}
                step={500}
                value={deliveryCommuneForm.prixLivraison}
                onChange={(event) =>
                  setDeliveryCommuneForm((current) => ({
                    ...current,
                    prixLivraison: Math.max(0, Number(event.target.value) || 0)
                  }))
                }
                className="field-input pr-20"
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#8a7f95]">
                FCFA
              </span>
            </div>
          </div>

          <label className="flex items-center gap-3 text-sm text-[#6f657a]">
            <input
              type="checkbox"
              checked={deliveryCommuneForm.estActive}
              onChange={(event) => setDeliveryCommuneForm((current) => ({ ...current, estActive: event.target.checked }))}
            />
            Livraison active dans cette commune
          </label>

          {deliveryCommuneMessage ? (
            <p className="rounded-[18px] border border-[#f1bfd8] bg-[#fff1f7] px-4 py-3 text-sm text-[#b43182]">
              {deliveryCommuneMessage}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button type="submit" className="primary-button px-6">
              {editingDeliveryCommuneId ? 'Mettre a jour la commune' : 'Ajouter la commune'}
            </button>
            {editingDeliveryCommuneId ? (
              <button type="button" onClick={resetDeliveryCommuneForm} className="secondary-button">
                Annuler
              </button>
            ) : null}
          </div>
        </form>
      </div>

      <div className="panel-card p-7">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[22px] font-semibold text-[#241f2b]">Communes configurees</h2>
            <p className="mt-2 text-sm leading-6 text-[#7a6f86]">Seules les communes actives sont visibles dans le panier client.</p>
          </div>
          <label className="search-shell md:w-[300px]">
            <Search size={16} className="text-[#8a7f95]" />
            <input
              value={deliveryCommuneSearch}
              onChange={(event) => setDeliveryCommuneSearch(event.target.value)}
              placeholder="Rechercher une commune"
              className="w-full bg-transparent text-sm text-[#241f2b] outline-none placeholder:text-[#9a90a7]"
            />
          </label>
        </div>

        <div className="space-y-3">
          {deliveryCommunes.map((commune) => (
            <div
              key={commune.id}
              className="flex flex-col gap-4 rounded-[22px] border border-[#dfd3e4] bg-[#fffdfd] p-4 lg:flex-row lg:items-center lg:justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-semibold text-[#241f2b]">{commune.nom}</h3>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      commune.estActive ? 'bg-[#daf4e7] text-[#0f9f77]' : 'bg-[#f7e4ef] text-[#b43182]'
                    }`}
                  >
                    {commune.estActive ? 'Active' : 'Desactivee'}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[#6f657a]">{commune.prixLivraison.toLocaleString('fr-FR')} FCFA</p>
                <p className="mt-1 text-xs text-[#9a90a7]">Mise a jour: {new Date(commune.updatedAt).toLocaleString('fr-FR')}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => startEditingDeliveryCommune(commune)} className="secondary-button">
                  Editer
                </button>
                <button type="button" onClick={() => toggleDeliveryCommuneStatus(commune)} className="secondary-button">
                  {commune.estActive ? 'Desactiver' : 'Activer'}
                </button>
                <button type="button" onClick={() => removeDeliveryCommune(commune)} className="secondary-button">
                  <Trash2 size={15} />
                  Supprimer
                </button>
              </div>
            </div>
          ))}

          {!deliveryCommunes.length ? (
            <div className="rounded-[22px] border border-dashed border-[#d8cade] bg-white/80 p-6 text-sm text-[#8a7f95]">
              Aucune commune ne correspond a votre recherche.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
