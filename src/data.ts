import { BookOpen, Brain, Dumbbell, Lightbulb, Wallet } from 'lucide-react'
export const pillars = [
  { id: 'espiritual', title: 'Espiritual', number: '01', tagline: 'Cultivar o que permanece.', color: 'sage', icon: BookOpen, hint: 'Um momento para se conectar' },
  { id: 'mental-emocional', title: 'Mental e Emocional', number: '02', tagline: 'Cuidar do mundo interior.', color: 'clay', icon: Brain, hint: 'Uma pausa para respirar' },
  { id: 'fisico', title: 'Físico', number: '03', tagline: 'Habitar bem o corpo.', color: 'blue', icon: Dumbbell, hint: 'Um passo em movimento' },
  { id: 'intelectual', title: 'Intelectual', number: '04', tagline: 'Continuar a descobrir.', color: 'gold', icon: Lightbulb, hint: 'Uma ideia para explorar' },
  { id: 'financeiro', title: 'Financeiro', number: '05', tagline: 'Escolher com intenção.', color: 'lavender', icon: Wallet, hint: 'Um olhar para o futuro' },
] as const
export type Pillar = typeof pillars[number]
