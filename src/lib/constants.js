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
  // Cordas
  'VIOLÃO': 15,
  'VIOLINO': 10,
  'VIOLA': 3,
  'VIOLONCELO': 3,
  'CONTRABAIXO': 5,
  
  // Teclas
  'PIANO': 3,
  'TECLADO': 4,
  
  // Sopros
  'FLAUTA DOCE': 10,
  'FLAUTA TRANSVERSAL': 1,
  'SAXOFONE': 3,
  'CLARINETE': 3,
  
  // Percussão
  'BATERIA': 8,
  'PERCUSSÃO': 10,
  
  // Voz
  'CANTO': 15,
  'CORAL': 20,
  'TÉCNICA VOCAL': 12,
  
  // Teoria
  'TEORIA MUSICAL': 15,
  'MUSICALIZAÇÃO': 12,
  
  // Outros
  'UKULELE': 10,
  'CAVAQUINHO': 10,
  'BANDOLIM': 8,
}
