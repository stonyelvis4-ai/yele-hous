import { Eye, EyeOff, Settings, ShieldCheck } from 'lucide-react'
import { FormEvent } from 'react'

interface PasswordState {
  currentPassword: string
  nextPassword: string
  confirmPassword: string
}

interface VisibilityState {
  current: boolean
  next: boolean
  confirm: boolean
}

interface AdminSettingsSectionProps {
  currentAdminEmail?: string
  settingsPasswordForm: PasswordState
  settingsPasswordError: string
  settingsPasswordSuccess: string
  showSettingsPasswords: VisibilityState
  setSettingsPasswordForm: (updater: (current: PasswordState) => PasswordState) => void
  setSettingsPasswordError: (value: string) => void
  setSettingsPasswordSuccess: (value: string) => void
  setShowSettingsPasswords: (updater: (current: VisibilityState) => VisibilityState) => void
  handleAdminPasswordChange: (event: FormEvent<HTMLFormElement>) => void
}

export function AdminSettingsSection({
  currentAdminEmail,
  settingsPasswordForm,
  settingsPasswordError,
  settingsPasswordSuccess,
  showSettingsPasswords,
  setSettingsPasswordForm,
  setSettingsPasswordError,
  setSettingsPasswordSuccess,
  setShowSettingsPasswords,
  handleAdminPasswordChange
}: AdminSettingsSectionProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="panel-card p-7">
        <div className="mb-6 flex items-center gap-3">
          <Settings size={18} className="text-[#f04cb3]" />
          <h2 className="text-[22px] font-semibold text-[#241f2b]">Compte administrateur</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="admin-info-card">
            <span className="admin-info-label">Email de connexion</span>
            <strong className="admin-info-value">{currentAdminEmail ?? 'Compte admin'}</strong>
          </div>
          <div className="admin-info-card">
            <span className="admin-info-label">Methode</span>
            <strong className="admin-info-value">Session securisee + base admin_users</strong>
          </div>
          <div className="admin-info-card md:col-span-2">
            <span className="admin-info-label">Acces</span>
            <p className="mt-2 text-[15px] leading-7 text-[#6f657a]">
              Modifiez ici le mot de passe du compte administrateur sans exposer l espace prive a la vitrine.
            </p>
          </div>
        </div>
      </div>

      <div className="panel-card p-7">
        <div className="mb-6 flex items-center gap-3">
          <ShieldCheck size={18} className="text-[#f04cb3]" />
          <h2 className="text-[22px] font-semibold text-[#241f2b]">Changer le mot de passe</h2>
        </div>

        <form onSubmit={handleAdminPasswordChange} className="grid gap-5">
          <div>
            <label className="form-label">MOT DE PASSE ACTUEL</label>
            <div className="relative">
              <input
                type={showSettingsPasswords.current ? 'text' : 'password'}
                value={settingsPasswordForm.currentPassword}
                onChange={(event) => {
                  setSettingsPasswordError('')
                  setSettingsPasswordSuccess('')
                  setSettingsPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))
                }}
                placeholder="Entrez le mot de passe actuel"
                className="field-input pr-14"
              />
              <button
                type="button"
                className="password-toggle"
                aria-label={showSettingsPasswords.current ? 'Masquer le mot de passe actuel' : 'Afficher le mot de passe actuel'}
                aria-pressed={showSettingsPasswords.current}
                onClick={() => setShowSettingsPasswords((current) => ({ ...current, current: !current.current }))}
              >
                {showSettingsPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="form-label">NOUVEAU MOT DE PASSE</label>
            <div className="relative">
              <input
                type={showSettingsPasswords.next ? 'text' : 'password'}
                value={settingsPasswordForm.nextPassword}
                onChange={(event) => {
                  setSettingsPasswordError('')
                  setSettingsPasswordSuccess('')
                  setSettingsPasswordForm((current) => ({ ...current, nextPassword: event.target.value }))
                }}
                placeholder="Au moins 8 caracteres"
                className="field-input pr-14"
              />
              <button
                type="button"
                className="password-toggle"
                aria-label={showSettingsPasswords.next ? 'Masquer le nouveau mot de passe' : 'Afficher le nouveau mot de passe'}
                aria-pressed={showSettingsPasswords.next}
                onClick={() => setShowSettingsPasswords((current) => ({ ...current, next: !current.next }))}
              >
                {showSettingsPasswords.next ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="form-label">CONFIRMER LE NOUVEAU MOT DE PASSE</label>
            <div className="relative">
              <input
                type={showSettingsPasswords.confirm ? 'text' : 'password'}
                value={settingsPasswordForm.confirmPassword}
                onChange={(event) => {
                  setSettingsPasswordError('')
                  setSettingsPasswordSuccess('')
                  setSettingsPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))
                }}
                placeholder="Retapez le nouveau mot de passe"
                className="field-input pr-14"
              />
              <button
                type="button"
                className="password-toggle"
                aria-label={
                  showSettingsPasswords.confirm
                    ? 'Masquer la confirmation du mot de passe'
                    : 'Afficher la confirmation du mot de passe'
                }
                aria-pressed={showSettingsPasswords.confirm}
                onClick={() => setShowSettingsPasswords((current) => ({ ...current, confirm: !current.confirm }))}
              >
                {showSettingsPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {settingsPasswordError ? (
            <p className="rounded-[18px] border border-[#f1bfd8] bg-[#fff1f7] px-4 py-3 text-sm text-[#b43182]">
              {settingsPasswordError}
            </p>
          ) : null}

          {settingsPasswordSuccess ? (
            <p className="rounded-[18px] border border-[#cde6d6] bg-[#f4fff7] px-4 py-3 text-sm text-[#16825d]">
              {settingsPasswordSuccess}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm leading-6 text-[#7a6f86]">
              Le mot de passe est mis a jour dans la table <span className="font-semibold text-[#241f2b]">admin_users</span>.
            </p>
            <button type="submit" className="primary-button px-6">
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
