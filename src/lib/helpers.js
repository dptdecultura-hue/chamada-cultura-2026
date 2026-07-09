import { LIMITES_OFICINAS } from './constants'

// Obter limite da oficina
export function obterLimiteOficina(oficina) {
  if (!oficina) return 15;
  const of = oficina.toUpperCase().trim();
  if (LIMITES_OFICINAS[of]) return LIMITES_OFICINAS[of];
  for (const [key, value] of Object.entries(LIMITES_OFICINAS)) {
    if (of.includes(key) || key.includes(of)) {
      return value;
    }
  }
  return 15;
}

// Obter limite da turma (personalizado ou padrão)
export function obterLimiteTurma(turma) {
  if (turma.limite_personalizado && turma.limite_personalizado > 0) {
    return turma.limite_personalizado;
  }
  return obterLimiteOficina(turma.oficina);
}

// Status de lotação
export function getStatusLotacao(alunos, limite) {
  if (limite === 0) return { status: 'sem_limite', cor: 'text-gray-500', bg: 'bg-gray-50 border-gray-300', icone: '⚪', label: 'SEM LIMITE' };
  
  const percentual = (alunos / limite) * 100;
  
  if (percentual >= 100) {
    return { status: 'lotado', cor: 'text-red-600', bg: 'bg-red-100 border-red-600', icone: '🔴', label: 'LOTADO' };
  }
  if (percentual >= 90) {
    return { status: 'quase_lotado', cor: 'text-red-500', bg: 'bg-red-50 border-red-500', icone: '🔶', label: 'QUASE CHEIO' };
  }
  if (percentual >= 70) {
    return { status: 'alerta', cor: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-600', icone: '🟡', label: 'ALERTA' };
  }
  return { status: 'tranquilo', cor: 'text-green-600', bg: 'bg-white border-black', icone: '🟢', label: 'TRANQUILO' };
}

// Formatar dias da semana
export function formatarDiasTexto(diasArr) {
  if (!diasArr || diasArr.length === 0) return "DIA NÃO DEFINIDO";
  const NOMES_DIAS_SEMANA = ["DOMINGO", "SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO"];
  const ordenado = [...diasArr].map(Number).filter(n => !isNaN(n)).sort((a, b) => a - b);
  return ordenado.map(d => NOMES_DIAS_SEMANA[d]).join(' E ');
}

// Detectar gênero pelo nome
export function detectarGenero(nomeCompleto) {
  if (!nomeCompleto) return null;
  const nome = nomeCompleto.trim().split(' ')[0].toUpperCase();
  const mascFixo = ["LUCA", "JOSHUA", "ALEXANDRE", "ANDRE", "FELIPE", "GUILHERME", "HENRIQUE", "MURILO", "OTAVIO", "SAMUEL", "GABRIEL", "RAFAEL", "DANIEL", "JEAN"];
  const femFixo = ["ALICE", "BEATRIZ", "ESTER", "IRIS", "NICOLE", "RAQUEL", "RUTE", "YASMIN", "EMANUELLE", "JOYCE"];
  if (mascFixo.includes(nome)) return 'M';
  if (femFixo.includes(nome)) return 'F';
  return nome.endsWith('A') ? 'F' : 'M';
}
