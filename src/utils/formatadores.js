// Formatar data para exibição
export function formatarData(data) {
  if (!data) return 'N/A'
  return new Date(data).toLocaleDateString('pt-BR')
}

// Formatar nome da unidade
export function formatarUnidade(unidade) {
  const mapa = {
    'jardim_europa': 'Jardim Europa',
    'centro': 'Centro',
    'sede': 'Sede'
  }
  return mapa[unidade] || unidade
}

// Calcular idade
export function calcularIdade(dataNascimento) {
  if (!dataNascimento) return 'N/A'
  const hoje = new Date()
  const nasc = new Date(dataNascimento)
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const mes = hoje.getMonth() - nasc.getMonth()
  if (mes < 0 || (mes === 0 && hoje.getDate() < nasc.getDate())) {
    idade--
  }
  return idade
}
