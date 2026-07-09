import {
  Bell,
  CalendarRange,
  MapPin,
  PartyPopper,
  UsersRound,
  Vote,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { createPortal } from 'react-dom'

type TutorialStep = {
  icon: LucideIcon
  title: string
  description: string
}

const STEPS: TutorialStep[] = [
  {
    icon: MapPin,
    title: 'Bem-vindo ao Onde Hoje',
    description:
      'O mapa social pra descobrir (e decidir) pra onde a galera vai hoje. Cada marcador no mapa é um lugar que já recebeu votos.',
  },
  {
    icon: Vote,
    title: 'Vote em um lugar',
    description:
      'Toque em um lugar do mapa ou pesquise um novo e vote que você vai. Pode escolher o dia, um horário e até marcar "não vou". São até 6 votos por semana.',
  },
  {
    icon: CalendarRange,
    title: 'Próximos 7 dias',
    description:
      'Por padrão o mapa mostra onde tem movimento nos próximos 7 dias. Quer ver só um dia? E só trocar o filtro no painel.',
  },
  {
    icon: UsersRound,
    title: 'Grupos e amigos',
    description:
      'Crie ou entre em grupos pra combinar o role em conjunto, chame seus amigos e veja onde eles votaram.',
  },
  {
    icon: Bell,
    title: 'Fique por dentro',
    description:
      'Receba notificações ao vivo quando te convidam pra um grupo, mandam pedido de amizade ou votam num lugar que você curtiu.',
  },
  {
    icon: PartyPopper,
    title: 'Bora começar!',
    description:
      'Explore o mapa a vontade. Pra votar, criar grupos e adicionar amigos, é só criar sua conta, leva menos de um minuto.',
  },
]

export function TutorialModal({ onClose }: { onClose: () => void }) {
  const [index, setIndex] = useState(0)
  const step = STEPS[index]
  const isFirst = index === 0
  const isLast = index === STEPS.length - 1
  const Icon = step.icon

  return createPortal(
    <div
      className="fixed inset-0 z-[95] grid place-items-center bg-black/55 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <section
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-line bg-surface text-ink shadow-[0_24px_70px_rgba(0,0,0,.3)]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          aria-label="Fechar tutorial"
          className="absolute right-3 top-3 grid size-9 cursor-pointer place-items-center rounded-md text-muted transition hover:bg-surface-muted hover:text-ink"
          type="button"
          onClick={onClose}
        >
          <X size={20} />
        </button>

        <div className="grid gap-4 p-7 pt-9 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-teal-soft text-teal">
            <Icon size={30} />
          </div>
          <div className="grid gap-2">
            <h2 className="text-xl font-bold">{step.title}</h2>
            <p className="text-sm leading-relaxed text-muted">{step.description}</p>
          </div>

          <div className="mt-1 flex items-center justify-center gap-1.5">
            {STEPS.map((item, dotIndex) => (
              <button
                key={item.title}
                aria-label={`Ir para o passo ${dotIndex + 1}`}
                className={`h-1.5 cursor-pointer rounded-full transition-all ${
                  dotIndex === index ? 'w-6 bg-teal' : 'w-1.5 bg-line hover:bg-teal/40'
                }`}
                type="button"
                onClick={() => setIndex(dotIndex)}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line px-6 py-4">
          {isFirst ? (
            <button
              className="cursor-pointer text-sm font-semibold text-muted transition hover:text-ink"
              type="button"
              onClick={onClose}
            >
              Pular
            </button>
          ) : (
            <button
              className="cursor-pointer rounded-md px-3 py-2 text-sm font-semibold text-muted transition hover:bg-surface-muted hover:text-ink"
              type="button"
              onClick={() => setIndex((current) => current - 1)}
            >
              Voltar
            </button>
          )}

          <button
            className="cursor-pointer rounded-md bg-teal px-5 py-2 text-sm font-semibold text-on-teal transition hover:bg-teal-dark"
            type="button"
            onClick={() => (isLast ? onClose() : setIndex((current) => current + 1))}
          >
            {isLast ? 'Começar' : 'Próximo'}
          </button>
        </div>
      </section>
    </div>,
    document.body
  )
}
