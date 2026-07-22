// src/app/(dashboard)/alunos/page.js
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Loading from '@/components/ui/Loading'
import { formatarData, formatarCPF, formatarTelefone } from '@/lib/formatadores'

export default function PerfilAluno() {
  const [busca, setBusca] = useState('')
  const [aluno, setAluno] = useState(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [matriculas, setMatriculas] = useState([])
  const [observacoes, setObservacoes] = useState([])
  const [editando, setEditando] = useState(false)
  const [formData, setFormData] = useState({})
  const [frequenciasMensais, setFrequenciasMensais] = useState([])

  // Calcular resumo acadêmico
  const calcularResumo = () => {
    const total = matriculas.length
    const cursando = matriculas.filter(m => m.status === 'cursando').length
    const concluido = matriculas.filter(m => m.status === 'concluido').length
    const totalPresencas = matriculas.reduce((acc, m) => acc + (m.frequencia_presenca || 0), 0)
    const totalAulas = matriculas.reduce((acc, m) => acc + (m.frequencia_total || 0), 0)
    const frequenciaMedia = totalAulas > 0 ? Math.round((totalPresencas / totalAulas) * 100) : 0

    return { total, cursando, concluido, frequenciaMedia }
  }

  // Buscar frequência mensal para o gráfico
  const buscarFrequenciaMensal = async (alunoId) => {
    const { data } = await supabase
      .from('frequencia')
      .select('mes, status')
      .eq('aluno_id', alunoId)
      .order('mes', { ascending: true })

    if (!data) return []

    const meses = {}
    const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    
    data.forEach(f => {
      if (!meses[f.mes]) meses[f.mes] = { total: 0, presentes: 0 }
      meses[f.mes].total++
      if (f.status === 'P') meses[f.mes].presentes++
    })

    return Object.entries(meses).map(([mes, dados]) => ({
      mes: nomesMeses[parseInt(mes)],
      percentual: dados.total > 0 ? Math.round((dados.presentes / dados.total) * 100) : 0
    }))
  }

  // Buscar aluno por CPF ou nome
  const buscarAluno = async () => {
    if (!busca.trim()) {
      setErro('Digite um CPF ou nome para buscar')
      return
    }

    setLoading(true)
    setErro('')
    setAluno(null)
    setMatriculas([])
    setObservacoes([])

    try {
      // Buscar aluno
      const { data: alunoData, error: alunoError } = await supabase
        .from('alunos')
        .select('*')
        .or(`cpf.eq.${busca},nome.ilike.%${busca}%`)
        .maybeSingle()

      if (alunoError) throw alunoError

      if (!alunoData) {
        setErro('Aluno não encontrado')
        setLoading(false)
        return
      }

      setAluno(alunoData)
      setFormData(alunoData)

      // Buscar matrículas do aluno
      const { data: matriculasData, error: matriculasError } = await supabase
        .from('matriculas')
        .select(`
          *,
          turmas (
            oficina,
            horario,
            professor,
            unidade
          )
        `)
        .eq('aluno_id', alunoData.id)
        .order('data_matricula', { ascending: false })

      if (matriculasError) throw matriculasError
      setMatriculas(matriculasData || [])

      // Buscar observações do aluno
      const { data: obsData } = await supabase
        .from('observacoes_pedagogicas')
        .select('*')
        .eq('aluno_id', alunoData.id)
        .order('data', { ascending: false })

      setObservacoes(obsData || [])

      // Buscar frequência mensal
      const freqData = await buscarFrequenciaMensal(alunoData.id)
      setFrequenciasMensais(freqData)

    } catch (error) {
      console.error('Erro ao buscar aluno:', error)
      setErro('Erro ao buscar aluno')
    } finally {
      setLoading(false)
    }
  }

  // Salvar alterações
  const salvarAlteracoes = async () => {
    try {
      const { error } = await supabase
        .from('alunos')
        .update(formData)
        .eq('id', aluno.id)

      if (error) throw error

      setAluno(formData)
      setEditando(false)
      alert('✅ Dados atualizados com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar:', error)
      alert('❌ Erro ao salvar alterações')
    }
  }

  // Adicionar observação pedagógica
  const adicionarObservacao = async () => {
    const texto = prompt('Digite a observação pedagógica:')
    if (!texto) return

    try {
      await supabase
        .from('observacoes_pedagogicas')
        .insert([{
          aluno_id: aluno.id,
          professor: 'Coordenação',
          texto: texto
        }])

      const { data: obsData } = await supabase
        .from('observacoes_pedagogicas')
        .select('*')
        .eq('aluno_id', aluno.id)
        .order('data', { ascending: false })

      setObservacoes(obsData || [])
      alert('✅ Observação adicionada!')
    } catch (error) {
      console.error('Erro ao adicionar observação:', error)
      alert('❌ Erro ao adicionar observação')
    }
  }

  // Calcular idade
  const calcularIdade = (dataNascimento) => {
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

  // Verificar se está ativo
  const isAtivo = matriculas.some(m => m.status === 'cursando')

  // Formatar unidade
  const formatarUnidade = (unidade) => {
    const mapa = {
      'jardim_europa': 'Jardim Europa',
      'centro': 'Centro',
      'sede': 'Sede'
    }
    return mapa[unidade] || unidade
  }

  // Renderizar status
  const renderStatus = (status) => {
    const cores = {
      'cursando': '🟢 Cursando',
      'concluido': '✅ Concluído',
      'desistente': '🔴 Desistente',
      'transferido': '🟡 Transferido',
      'mudanca_cidade': '📦 Mudança de cidade',
    }
    return cores[status] || status
  }

  // Configuração de status para o histórico
  const getStatusConfig = (status) => {
    const config = {
      'cursando': { cor: 'text-green-600', bg: 'bg-green-50', icone: '🟢', label: 'Cursando' },
      'concluido': { cor: 'text-blue-600', bg: 'bg-blue-50', icone: '✅', label: 'Concluído' },
      'desistente': { cor: 'text-red-600', bg: 'bg-red-50', icone: '🔴', label: 'Desistente' },
      'transferido': { cor: 'text-yellow-600', bg: 'bg-yellow-50', icone: '🟡', label: 'Transferido' },
      'mudanca_cidade': { cor: 'text-orange-600', bg: 'bg-orange-50', icone: '📦', label: 'Mudança de cidade' },
    }
    return config[status] || config['cursando']
  }

  // Gerar alertas
  const gerarAlertas = () => {
    const alertas = []
    
    matriculas.forEach(m => {
      if (m.status === 'cursando') {
        const presenca = m.frequencia_presenca || 0
        const total = m.frequencia_total || 0
        const percentual = total > 0 ? (presenca / total) * 100 : 100
        
        if (percentual < 75) {
          alertas.push({
            tipo: 'danger',
            cor: 'bg-red-50 border-red-600',
            icone: '🔴',
            texto: `${aluno.nome} está com ${Math.round(percentual)}% de presença no ${m.turmas?.oficina} (abaixo de 75%)`
          })
        }
        
        // Verificar faltas consecutivas (se tiver dados)
        // Nota: Isso seria mais preciso com dados de frequência
        if (percentual < 50) {
          alertas.push({
            tipo: 'warning',
            cor: 'bg-yellow-50 border-yellow-600',
            icone: '🟡',
            texto: `${aluno.nome} tem baixa frequência no ${m.turmas?.oficina}`
          })
        }
      }
    })
    
    return alertas
  }

  if (loading) {
    return <Loading mensagem="Carregando dados..." />
  }

  const resumo = calcularResumo()
  const alertas = aluno ? gerarAlertas() : []

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8">
      <div className="max-w-6xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/menu" className="text-xs border-2 border-black px-4 py-2 font-black italic uppercase bg-white hover:bg-black hover:text-white transition-all">
              ← VOLTAR
            </Link>
            <h1 className="text-3xl font-black border-l-8 border-black pl-4">
              PERFIL DO <span className="text-blue-600">ALUNO</span>
            </h1>
          </div>
          <Link
            href="/alunos/novo"
            className="bg-emerald-600 text-white px-6 py-2 font-black uppercase text-sm border-2 border-black shadow-[4px_4px_0px_#000] hover:bg-emerald-500 transition-all"
          >
            + NOVO ALUNO
          </Link>
        </div>

        {/* Busca */}
        <div className="bg-white border-4 border-black p-4 mb-6 shadow-[4px_4px_0px_#000]">
          <div className="flex gap-2">
            <input
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && buscarAluno()}
              placeholder="Digite o CPF ou nome do aluno"
              className="flex-1 border-2 border-black px-4 py-2 text-sm font-bold uppercase outline-none"
            />
            <button
              onClick={buscarAluno}
              disabled={loading}
              className="bg-black text-white px-6 py-2 font-black uppercase text-sm border-2 border-black hover:bg-white hover:text-black transition-all disabled:opacity-50"
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
          {erro && (
            <div className="mt-2 text-red-600 font-bold text-sm">{erro}</div>
          )}
        </div>

        {/* Perfil do Aluno */}
        {aluno && (
          <>
            {/* Cabeçalho do perfil */}
            <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0px_#000] mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-3xl font-black">{aluno.nome}</h2>
                  {aluno.nome_social && (
                    <p className="text-sm text-gray-600">Nome social: {aluno.nome_social}</p>
                  )}
                  <p className="text-sm text-gray-600">
                    CPF: {formatarCPF(aluno.cpf)} | Idade: {calcularIdade(aluno.data_nascimento)} anos
                  </p>
                  <div className="flex gap-4 mt-2 text-sm flex-wrap">
                    <span>📞 {aluno.telefone || 'N/A'}</span>
                    <span>📱 {aluno.whatsapp || 'N/A'}</span>
                    <span>📧 {aluno.email || 'N/A'}</span>
                  </div>
                  <p className="text-sm mt-1 text-gray-600">
                    📍 {aluno.endereco_rua || 'N/A'}, {aluno.endereco_numero || 'N/A'} - {aluno.endereco_bairro || 'N/A'} - {aluno.endereco_cidade || 'N/A'}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-black ${isAtivo ? 'text-green-600' : 'text-red-600'}`}>
                    {isAtivo ? '🟢 ATIVO' : '🔴 INATIVO'}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Matrícula: {formatarData(aluno.data_matricula)}
                  </div>
                </div>
              </div>

              {/* Dados completos em grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 border-2 border-black">
                <div><p className="text-xs font-black uppercase text-gray-500">Curso</p><p className="font-bold">{aluno.curso || 'N/A'}</p></div>
                <div><p className="text-xs font-black uppercase text-gray-500">Nível</p><p className="font-bold">{aluno.nivel || 'N/A'}</p></div>
                <div><p className="text-xs font-black uppercase text-gray-500">Horário</p><p className="font-bold">{aluno.horario || 'N/A'}</p></div>
                <div><p className="text-xs font-black uppercase text-gray-500">Unidade</p><p className="font-bold">{formatarUnidade(aluno.unidade)}</p></div>
                <div><p className="text-xs font-black uppercase text-gray-500">Escola</p><p className="font-bold">{aluno.escola || 'N/A'}</p></div>
                <div><p className="text-xs font-black uppercase text-gray-500">NIS</p><p className="font-bold">{aluno.nis || 'N/A'}</p></div>
              </div>

              {/* Responsável */}
              {aluno.responsavel_nome && (
                <div className="mt-4 p-3 bg-blue-50 border-2 border-blue-300">
                  <p className="text-sm font-bold">👨‍👩‍👧 Responsável: {aluno.responsavel_nome}</p>
                  <p className="text-sm">📞 {aluno.responsavel_telefone || 'N/A'} | CPF: {formatarCPF(aluno.responsavel_cpf)} | Profissão: {aluno.responsavel_profissao || 'N/A'}</p>
                </div>
              )}

              {/* Saúde */}
              {(aluno.alergias === 'SIM' || aluno.problemas_saude === 'SIM') && (
                <div className="mt-4 p-3 bg-red-50 border-2 border-red-300">
                  <p className="text-sm font-bold">⚠️ Informações de Saúde</p>
                  {aluno.alergias === 'SIM' && <p className="text-sm">Alergias: {aluno.alergias_quais || 'Não especificado'}</p>}
                  {aluno.problemas_saude === 'SIM' && <p className="text-sm">Problemas de saúde: {aluno.problemas_saude_quais || 'Não especificado'}</p>}
                  <p className="text-sm">Tipo sanguíneo: {aluno.tipo_sanguineo || 'N/A'} | SUS: {aluno.sus_numero || 'N/A'}</p>
                </div>
              )}

              {/* Ações */}
              <div className="flex gap-4 mt-6 flex-wrap">
                <button onClick={() => setEditando(!editando)} className="bg-yellow-400 px-6 py-2 font-black uppercase text-sm border-2 border-black hover:bg-yellow-300 transition-all">
                  {editando ? '✕ CANCELAR EDIÇÃO' : '✎ EDITAR PERFIL'}
                </button>
                <Link href={`/matricula/nova?alunoId=${aluno.id}`} className="bg-emerald-600 text-white px-6 py-2 font-black uppercase text-sm border-2 border-black hover:bg-emerald-500 transition-all inline-block text-center">
                  📋 NOVA MATRÍCULA
                </Link>
                <button onClick={() => window.print()} className="bg-purple-600 text-white px-6 py-2 font-black uppercase text-sm border-2 border-black hover:bg-purple-500 transition-all">
                  📊 RELATÓRIO
                </button>
              </div>

              {/* Formulário de edição */}
              {editando && (
                <div className="mt-6 p-4 border-4 border-black bg-white">
                  <h3 className="font-black text-lg mb-4">✎ Editar Dados do Aluno</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* ... campos de edição ... */}
                    <div><label className="block text-xs font-black uppercase">Nome *</label><input type="text" value={formData.nome || ''} onChange={e => setFormData({...formData, nome: e.target.value.toUpperCase()})} className="w-full border-2 border-black px-2 py-1 text-sm" /></div>
                    <div><label className="block text-xs font-black uppercase">Nome social</label><input type="text" value={formData.nome_social || ''} onChange={e => setFormData({...formData, nome_social: e.target.value.toUpperCase()})} className="w-full border-2 border-black px-2 py-1 text-sm" /></div>
                    <div><label className="block text-xs font-black uppercase">CPF</label><input type="text" value={formData.cpf || ''} onChange={e => setFormData({...formData, cpf: e.target.value})} className="w-full border-2 border-black px-2 py-1 text-sm" /></div>
                    <div><label className="block text-xs font-black uppercase">Data de nascimento</label><input type="date" value={formData.data_nascimento || ''} onChange={e => setFormData({...formData, data_nascimento: e.target.value})} className="w-full border-2 border-black px-2 py-1 text-sm" /></div>
                    <div><label className="block text-xs font-black uppercase">Telefone</label><input type="text" value={formData.telefone || ''} onChange={e => setFormData({...formData, telefone: e.target.value})} className="w-full border-2 border-black px-2 py-1 text-sm" /></div>
                    <div><label className="block text-xs font-black uppercase">WhatsApp</label><input type="text" value={formData.whatsapp || ''} onChange={e => setFormData({...formData, whatsapp: e.target.value})} className="w-full border-2 border-black px-2 py-1 text-sm" /></div>
                    <div><label className="block text-xs font-black uppercase">Curso</label><input type="text" value={formData.curso || ''} onChange={e => setFormData({...formData, curso: e.target.value.toUpperCase()})} className="w-full border-2 border-black px-2 py-1 text-sm" /></div>
                    <div><label className="block text-xs font-black uppercase">Nível</label><input type="text" value={formData.nivel || ''} onChange={e => setFormData({...formData, nivel: e.target.value.toUpperCase()})} className="w-full border-2 border-black px-2 py-1 text-sm" /></div>
                    <div><label className="block text-xs font-black uppercase">Horário</label><input type="text" value={formData.horario || ''} onChange={e => setFormData({...formData, horario: e.target.value})} className="w-full border-2 border-black px-2 py-1 text-sm" /></div>
                    <div><label className="block text-xs font-black uppercase">Unidade</label><select value={formData.unidade || 'jardim_europa'} onChange={e => setFormData({...formData, unidade: e.target.value})} className="w-full border-2 border-black px-2 py-1 text-sm"><option value="jardim_europa">Jardim Europa</option><option value="centro">Centro</option><option value="sede">Sede</option></select></div>
                    <div><label className="block text-xs font-black uppercase">Escola</label><input type="text" value={formData.escola || ''} onChange={e => setFormData({...formData, escola: e.target.value.toUpperCase()})} className="w-full border-2 border-black px-2 py-1 text-sm" /></div>
                    <div><label className="block text-xs font-black uppercase">NIS</label><input type="text" value={formData.nis || ''} onChange={e => setFormData({...formData, nis: e.target.value})} className="w-full border-2 border-black px-2 py-1 text-sm" /></div>
                    <div className="md:col-span-2"><label className="block text-xs font-black uppercase">Responsável</label><input type="text" value={formData.responsavel_nome || ''} onChange={e => setFormData({...formData, responsavel_nome: e.target.value.toUpperCase()})} className="w-full border-2 border-black px-2 py-1 text-sm" /></div>
                    <div><label className="block text-xs font-black uppercase">CPF do responsável</label><input type="text" value={formData.responsavel_cpf || ''} onChange={e => setFormData({...formData, responsavel_cpf: e.target.value})} className="w-full border-2 border-black px-2 py-1 text-sm" /></div>
                    <div><label className="block text-xs font-black uppercase">Telefone do responsável</label><input type="text" value={formData.responsavel_telefone || ''} onChange={e => setFormData({...formData, responsavel_telefone: e.target.value})} className="w-full border-2 border-black px-2 py-1 text-sm" /></div>
                    <div><label className="block text-xs font-black uppercase">Endereço - Rua</label><input type="text" value={formData.endereco_rua || ''} onChange={e => setFormData({...formData, endereco_rua: e.target.value.toUpperCase()})} className="w-full border-2 border-black px-2 py-1 text-sm" /></div>
                    <div><label className="block text-xs font-black uppercase">Número</label><input type="text" value={formData.endereco_numero || ''} onChange={e => setFormData({...formData, endereco_numero: e.target.value})} className="w-full border-2 border-black px-2 py-1 text-sm" /></div>
                    <div><label className="block text-xs font-black uppercase">Bairro</label><input type="text" value={formData.endereco_bairro || ''} onChange={e => setFormData({...formData, endereco_bairro: e.target.value.toUpperCase()})} className="w-full border-2 border-black px-2 py-1 text-sm" /></div>
                    <div className="md:col-span-2"><label className="block text-xs font-black uppercase">Cidade</label><input type="text" value={formData.endereco_cidade || ''} onChange={e => setFormData({...formData, endereco_cidade: e.target.value.toUpperCase()})} className="w-full border-2 border-black px-2 py-1 text-sm" /></div>
                    <div><label className="block text-xs font-black uppercase">Alergias?</label><select value={formData.alergias || ''} onChange={e => setFormData({...formData, alergias: e.target.value})} className="w-full border-2 border-black px-2 py-1 text-sm"><option value="">Selecione</option><option value="SIM">Sim</option><option value="NAO">Não</option></select></div>
                    <div><label className="block text-xs font-black uppercase">Quais alergias?</label><input type="text" value={formData.alergias_quais || ''} onChange={e => setFormData({...formData, alergias_quais: e.target.value.toUpperCase()})} className="w-full border-2 border-black px-2 py-1 text-sm" /></div>
                    <div><label className="block text-xs font-black uppercase">Problemas de saúde?</label><select value={formData.problemas_saude || ''} onChange={e => setFormData({...formData, problemas_saude: e.target.value})} className="w-full border-2 border-black px-2 py-1 text-sm"><option value="">Selecione</option><option value="SIM">Sim</option><option value="NAO">Não</option></select></div>
                    <div><label className="block text-xs font-black uppercase">Quais problemas?</label><input type="text" value={formData.problemas_saude_quais || ''} onChange={e => setFormData({...formData, problemas_saude_quais: e.target.value.toUpperCase()})} className="w-full border-2 border-black px-2 py-1 text-sm" /></div>
                    <div><label className="block text-xs font-black uppercase">Tipo sanguíneo</label><input type="text" value={formData.tipo_sanguineo || ''} onChange={e => setFormData({...formData, tipo_sanguineo: e.target.value.toUpperCase()})} className="w-full border-2 border-black px-2 py-1 text-sm" /></div>
                    <div><label className="block text-xs font-black uppercase">Nº do SUS</label><input type="text" value={formData.sus_numero || ''} onChange={e => setFormData({...formData, sus_numero: e.target.value})} className="w-full border-2 border-black px-2 py-1 text-sm" /></div>
                  </div>
                  <div className="flex gap-4 mt-4">
                    <button onClick={salvarAlteracoes} className="bg-blue-600 text-white px-6 py-2 font-black uppercase text-sm border-2 border-black hover:bg-blue-500 transition-all">💾 SALVAR ALTERAÇÕES</button>
                    <button onClick={() => { setEditando(false); setFormData(aluno) }} className="bg-gray-200 px-6 py-2 font-black uppercase text-sm border-2 border-black hover:bg-gray-300 transition-all">CANCELAR</button>
                  </div>
                </div>
              )}
            </div>

            {/* ════════════════════════════════════════════════════════════ */}
            {/* RESUMO ACADÊMICO (CARDS) */}
            {/* ════════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#000] text-center">
                <div className="text-3xl font-black text-blue-600">{resumo.total}</div>
                <div className="text-[10px] font-black uppercase">🎓 Total Cursos</div>
              </div>
              <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#000] text-center">
                <div className="text-3xl font-black text-green-600">{resumo.cursando}</div>
                <div className="text-[10px] font-black uppercase">🟢 Cursando</div>
              </div>
              <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#000] text-center">
                <div className="text-3xl font-black text-blue-600">{resumo.concluido}</div>
                <div className="text-[10px] font-black uppercase">✅ Concluídos</div>
              </div>
              <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#000] text-center">
                <div className={`text-3xl font-black ${resumo.frequenciaMedia >= 75 ? 'text-green-600' : resumo.frequenciaMedia >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {resumo.frequenciaMedia}%
                </div>
                <div className="text-[10px] font-black uppercase">📊 Frequência</div>
              </div>
            </div>

            {/* ════════════════════════════════════════════════════════════ */}
            {/* GRÁFICO DE FREQUÊNCIA MENSAL */}
            {/* ════════════════════════════════════════════════════════════ */}
            {frequenciasMensais.length > 0 && (
              <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0px_#000] mb-6">
                <h3 className="text-xl font-black uppercase mb-4">📈 Frequência Mensal</h3>
                <div className="flex items-end h-32 gap-2">
                  {frequenciasMensais.map((item, index) => {
                    const altura = Math.max(10, item.percentual)
                    const cor = item.percentual >= 75 ? 'bg-green-500' : item.percentual >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div 
                          className={`w-full ${cor} rounded-t`}
                          style={{ height: `${altura}%`, minHeight: '10px' }}
                        ></div>
                        <div className="text-[10px] font-black mt-1">{item.mes}</div>
                        <div className="text-[8px] font-bold text-gray-500">{item.percentual}%</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════ */}
            {/* ALERTAS */}
            {/* ════════════════════════════════════════════════════════════ */}
            {alertas.length > 0 && (
              <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0px_#000] mb-6">
                <h3 className="text-xl font-black uppercase mb-4">⚠️ Alertas</h3>
                <div className="space-y-2">
                  {alertas.map((alerta, index) => (
                    <div key={index} className={`p-3 border-2 border-black ${alerta.cor}`}>
                      <p className="text-sm font-bold">{alerta.icone} {alerta.texto}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════ */}
            {/* HISTÓRICO DE CURSOS (DETALHADO) */}
            {/* ════════════════════════════════════════════════════════════ */}
            {matriculas.length > 0 && (
              <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0px_#000] mb-6">
                <h3 className="text-xl font-black uppercase mb-4">📚 Histórico de Cursos</h3>
                <div className="space-y-4">
                  {matriculas.map((m) => {
                    const status = getStatusConfig(m.status)
                    
                    return (
                      <div key={m.id} className={`border-2 border-black p-4 ${status.bg}`}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xl">{status.icone}</span>
                              <h4 className="font-black text-lg">{m.turmas?.oficina || 'N/A'}</h4>
                              <span className={`text-xs font-black px-2 py-0.5 border border-black ${status.cor}`}>
                                {status.label}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-sm">
                              <div>
                                <p className="text-[10px] font-black uppercase text-gray-400">Professor</p>
                                <p className="font-bold">{m.turmas?.professor || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-black uppercase text-gray-400">Unidade</p>
                                <p className="font-bold">{formatarUnidade(m.turmas?.unidade || m.unidade)}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-black uppercase text-gray-400">Horário</p>
                                <p className="font-bold">{m.turmas?.horario || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-black uppercase text-gray-400">Período</p>
                                <p className="font-bold">
                                  {formatarData(m.data_matricula)} 
                                  {m.data_conclusao ? ` → ${formatarData(m.data_conclusao)}` : ' → Atual'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Motivo e Observações */}
                        {(m.motivo_saida || m.observacoes) && (
                          <div className="mt-3 p-3 border-2 border-black bg-white">
                            {m.motivo_saida && (
                              <p className="text-sm"><span className="font-black">📌 Motivo:</span> {m.motivo_saida}</p>
                            )}
                            {m.observacoes && (
                              <p className="text-sm mt-1"><span className="font-black">📝 Observação:</span> {m.observacoes}</p>
                            )}
                          </div>
                        )}

                        {/* Frequência */}
                        {(m.frequencia_total > 0 || m.frequencia_presenca > 0) && (
                          <div className="mt-2 flex items-center gap-4 text-xs">
                            <span className="font-black">📊 Frequência:</span>
                            <span>{m.frequencia_presenca || 0}/{m.frequencia_total || 0} aulas</span>
                            {m.frequencia_total > 0 && (
                              <span className={`font-black ${
                                (m.frequencia_presenca / m.frequencia_total) >= 0.75 
                                  ? 'text-green-600' 
                                  : (m.frequencia_presenca / m.frequencia_total) >= 0.5 
                                    ? 'text-yellow-600' 
                                    : 'text-red-600'
                              }`}>
                                ({Math.round((m.frequencia_presenca / m.frequencia_total) * 100)}%)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════ */}
            {/* OBSERVAÇÕES PEDAGÓGICAS */}
            {/* ════════════════════════════════════════════════════════════ */}
            <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0px_#000] mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-black uppercase">📝 Observações Pedagógicas</h3>
                <button
                  onClick={adicionarObservacao}
                  className="bg-blue-600 text-white px-4 py-1 text-xs font-black border-2 border-black hover:bg-blue-500 transition-all"
                >
                  + ADICIONAR
                </button>
              </div>
              {observacoes.length === 0 ? (
                <p className="text-sm text-gray-400 italic">Nenhuma observação registrada</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {observacoes.map((obs) => (
                    <div key={obs.id} className="border-2 border-black p-3 bg-gray-50">
                      <div className="flex justify-between items-start">
                        <p className="text-sm">{obs.texto}</p>
                        <div className="text-right text-[10px] text-gray-400 flex-shrink-0 ml-4">
                          <p className="font-black">{obs.professor}</p>
                          <p>{formatarData(obs.data)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Nenhum aluno encontrado */}
        {!aluno && !loading && !erro && (
          <div className="text-center py-16">
            <p className="text-3xl font-black italic text-gray-300">BUSQUE UM ALUNO</p>
            <p className="text-sm text-gray-400 mt-2">Digite o CPF ou nome no campo acima</p>
          </div>
        )}
      </div>
    </div>
  )
}
