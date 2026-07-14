// src/lib/constants.js

// ════════════════════════════════════════════════════════════
// UNIDADES DA CASA DA CULTURA
// ════════════════════════════════════════════════════════════
export const UNIDADES = [
  { 
    id: 'jardim_europa', 
    nome: 'Casa da Cultura - Jardim Europa', 
    label: 'Jardim Europa', 
    accent: 'border-blue-600', 
    txt: 'text-blue-600' 
  },
  { 
    id: 'centro', 
    nome: 'Casa da Cultura - Centro', 
    label: 'Centro', 
    accent: 'border-emerald-600', 
    txt: 'text-emerald-600' 
  },
  { 
    id: 'sede', 
    nome: 'Casa da Cultura - Sede (Bela Vista)', 
    label: 'Sede', 
    accent: 'border-orange-600', 
    txt: 'text-orange-600' 
  },
]

// ════════════════════════════════════════════════════════════
// DIAS DA SEMANA
// ════════════════════════════════════════════════════════════
export const DIAS_SEMANA = [
  { id: 0, label: "Domingo" },
  { id: 1, label: "Segunda" },
  { id: 2, label: "Terça" },
  { id: 3, label: "Quarta" },
  { id: 4, label: "Quinta" },
  { id: 5, label: "Sexta" },
  { id: 6, label: "Sábado" }
]

// ════════════════════════════════════════════════════════════
// NOMES DOS DIAS DA SEMANA (para formatação)
// ════════════════════════════════════════════════════════════
export const NOMES_DIAS_SEMANA = ["DOMINGO", "SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO"]

// ════════════════════════════════════════════════════════════
// MESES DO ANO
// ════════════════════════════════════════════════════════════
export const MESES_NOMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]

// ════════════════════════════════════════════════════════════
// BLOCOS TRIMESTRAIS
// ════════════════════════════════════════════════════════════
export const BLOCOS_TRIMESTRAIS = [
  { inicio: 0, nome: "Jan, Fev e Mar" },
  { inicio: 3, nome: "Abr, Mai e Jun" },
  { inicio: 6, nome: "Jul, Ago e Set" },
  { inicio: 9, nome: "Out, Nov e Dez" }
]

// ════════════════════════════════════════════════════════════
// LIMITES PADRÃO POR OFICINA
// ════════════════════════════════════════════════════════════
export const LIMITES_OFICINAS = {
  'VIOLÃO': 15,
  'VIOLINO': 10,
  'VIOLA': 3,
  'VIOLONCELO': 3,
  'CONTRABAIXO': 5,
  'PIANO': 3,
  'TECLADO': 4,
  'FLAUTA DOCE': 10,
  'FLAUTA TRANSVERSAL': 1,
  'SAXOFONE': 3,
  'CLARINETE': 3,
  'BATERIA': 8,
  'PERCUSSÃO': 10,
  'CANTO': 15,
  'CORAL': 20,
  'TÉCNICA VOCAL': 12,
  'TEORIA MUSICAL': 15,
  'MUSICALIZAÇÃO': 12,
  'UKULELE': 10,
  'CAVAQUINHO': 10,
  'BANDOLIM': 8,
}

// ════════════════════════════════════════════════════════════
// CURSOS DISPONÍVEIS
// ════════════════════════════════════════════════════════════
export const CURSOS = [
  'VIOLÃO',
  'VIOLINO',
  'VIOLA',
  'VIOLONCELO',
  'PERCUSSÃO/BATERIA',
  'TEORIA MUSICAL',
  'TÉCNICA VOCAL/CORO',
  'PIANO',
  'MUSICALIZAÇÃO',
  'FLAUTA DOCE',
  'FLAUTA TRANSVERSAL',
  'SAXOFONE',
  'CLARINETE',
  'CANTO',
  'CORAL',
  'UKULELE',
  'CAVAQUINHO',
  'BANDOLIM',
  'CONTRABAIXO',
  'TECLADO',
]

// ════════════════════════════════════════════════════════════
// NÍVEIS DE ENSINO
// ════════════════════════════════════════════════════════════
export const NIVEIS = [
  'INICIANTE',
  'INTERMEDIÁRIO',
  'AVANÇADO',
  'LIVRE',
]

// ════════════════════════════════════════════════════════════
// HORÁRIOS DISPONÍVEIS
// ════════════════════════════════════════════════════════════
export const HORARIOS = [
  '08:00 - 09:00',
  '08:00 - 09:30',
  '09:00 - 10:00',
  '09:00 - 10:30',
  '10:00 - 11:00',
  '10:00 - 11:30',
  '11:00 - 12:00',
  '13:00 - 14:00',
  '13:30 - 14:30',
  '14:00 - 15:00',
  '14:00 - 15:30',
  '15:00 - 16:00',
  '15:30 - 17:00',
  '16:00 - 17:00',
  '17:00 - 18:00',
  '18:00 - 19:00',
  '19:00 - 20:00',
  '19:30 - 21:00',
]
