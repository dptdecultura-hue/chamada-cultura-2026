// src/lib/formatadores.js

// Formatar data para exibição
export function formatarData(data) {
  if (!data) return 'N/A'
  return new Date(data).toLocaleDateString('pt-BR')
}

// Formatar data e hora
export function formatarDataHora(data) {
  if (!data) return 'N/A'
  return new Date(data).toLocaleDateString('pt-BR') + ' ' + new Date(data).toLocaleTimeString('pt-BR')
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

// Formatar CPF
export function formatarCPF(cpf) {
  if (!cpf) return ''
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

// Formatar telefone
export function formatarTelefone(telefone) {
  if (!telefone) return ''
  return telefone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
}
