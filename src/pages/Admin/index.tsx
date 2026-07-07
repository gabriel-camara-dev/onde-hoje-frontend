import { useState } from 'react'
import { Panel } from '../../components/ui/Panel'
import { useUserStore } from '../../stores/userStore'
import { AbuseTab, AuthTab, OverviewTab, TabButton, UsersTab } from './components'

type AdminTab = 'overview' | 'abuse' | 'auth' | 'users'

const tabs: Array<{ id: AdminTab; label: string }> = [
  { id: 'overview', label: 'Visão geral' },
  { id: 'abuse', label: 'Fiscalização' },
  { id: 'auth', label: 'Autenticação' },
  { id: 'users', label: 'Usuários' },
]

export default function AdminPage() {
  const user = useUserStore((state) => state.user)
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')

  if (!user) {
    return (
      <Panel className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="mt-2 text-sm text-muted">
          Entre com uma conta ADMIN para visualizar o dashboard.
        </p>
      </Panel>
    )
  }

  return (
    <section className="grid gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Painel administrativo</h1>
        <p className="mt-1 text-sm text-muted">
          Métricas do sistema, fiscalização de votos e gestão de usuários.
        </p>
      </div>

      <div className="flex flex-wrap gap-1 rounded-lg border border-line bg-surface-muted p-1">
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </TabButton>
        ))}
      </div>

      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'abuse' && <AbuseTab />}
      {activeTab === 'auth' && <AuthTab />}
      {activeTab === 'users' && <UsersTab />}
    </section>
  )
}
