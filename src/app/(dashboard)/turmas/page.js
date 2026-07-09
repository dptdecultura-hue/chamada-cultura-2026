'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { UNIDADES, DIAS_SEMANA } from '@/lib/constants'
import { obterLimiteOficina, obterLimiteTurma, getStatusLotacao, formatarDiasTexto } from '@/lib/helpers'

export default function GerenciarTurmas() {
  const [turmas, setTurmas] = useState([])
  const [contagemAlunos, setContagemAlunos] = useState({})
  const [loading, setLoading] = useState(true)
  const [mensagem, setMensagem] = useState(null)

  // Estados do formulário
  const [editandoTurma, setEditandoTurma] = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [turmaForm, setTurmaForm] = useState({
    professor: '',
    oficina: '',
    horario: '',
    unidade: 'jardim_europa',
    dias: [],
    limite_personalizado: 15,
  })

  // Filtro
  const [filtroProfessor, setFiltroProfessor] = useState('')

  // ════════════════════════════════════════════════════════════
  // ESTADO PARA SUBSTITUIÇÃO DE PROFESSOR
  // ════════════════════════════════════════════════════════════
  const [mostrarModalSubstituir, setMostrarModalSubstituir] = useState(false)
  const [novoProfessor, setNovoProfessor] = useState('')
  const [professorSubstituir, setProfessorSubstituir] = useState('')

  useEffect(() => {
    fetchTurmas()
  }, [])

  async function fetchTurmas() {
    const { data: tData } = await supabase.from('turmas').select('*')
    const { data: aData } = await supabase.from('alunos').select('turma_id')
    const contagem = {}
    aData?.forEach(a => { contagem[a.turma_id] = (contagem[a.turma_id] || 0) + 1 })
    setContagemAlunos(contagem)
    if (tData) setTurmas(tData.sort((a, b) => a.horario.localeCompare(b.horario)))
    setLoading(false)
  }

  function resetarForm() {
    setTurmaForm({
      professor: '',
      oficina: '',
      horario: '',
      unidade: 'jardim_europa',
      dias: [],
      limite_personalizado: 15,
    })
    setEditandoTurma(null)
    setMostrarForm(false)
    setMensagem(null)
  }

  function abrirFormEditar(turma) {
    setEditandoTurma(turma)
    setTurmaForm({
      professor: turma.professor || '',
      oficina: turma.oficina || '',
      horario: turma.horario || '',
      unidade: turma.unidade || 'jardim_europa',
      dias: turma.dias || [],
      limite_personalizado: turma.limite_personalizado || obterLimiteOficina(turma.oficina),
    })
    setMostrarForm(true)
    setMensagem(null)
  }

  function toggleDia(diaId) {
    setTurmaForm(prev => {
      const dias = prev.dias.includes(diaId)
        ? prev.dias.filter(d => d !== diaId)
        : [...prev.dias, diaId]
      return { ...prev, dias }
    })
  }

  async function salvarTurma() {
    if (!turmaForm.professor.trim()) {
      setMensagem({ tipo: 'erro', texto: 'Informe o nome do professor!' })
      return
    }
    if (!turmaForm.oficina.trim()) {
      setMensagem({ tipo: 'erro', texto: 'Informe o nome da oficina/curso!' })
      return
    }
    if (!turmaForm.horario.trim()) {
      setMensagem({ tipo: 'erro', texto: 'Informe o horário!' })
      return
    }
    if (turmaForm.dias.length === 0) {
      setMensagem({ tipo: 'erro', texto: 'Selecione pelo menos um dia da semana!' })
      return
    }

    setMensagem(null)

    const payload = {
      professor: turmaForm.professor.toUpperCase().trim(),
      oficina: turmaForm.oficina.toUpperCase().trim(),
      horario: turmaForm.horario.trim(),
      unidade: turmaForm.unidade,
      dias: turmaForm.dias.sort((a, b) => a - b),
      limite_personalizado: turmaForm.limite_personalizado || null,
    }

    try {
      if (editandoTurma) {
        const { error } = await supabase.from('turmas').update(payload).eq('id', editandoTurma.id)
        if (error) throw error
        setMensagem({ tipo: 'ok', texto: '✅ Turma atualizada com sucesso!' })
      } else {
        const { error } = await supabase.from('turmas').insert(payload)
        if (error) throw error
        setMensagem({ tipo: 'ok', texto: '✅ Turma criada com sucesso!' })
      }
      await fetchTurmas()
      resetarForm()
      setTimeout(() => setMensagem(null), 3000)
    } catch (error) {
      console.error('Erro ao salvar turma:', error)
      setMensagem({ tipo: 'erro', texto: '❌ Erro ao salvar turma!' })
    }
  }

  async function excluirTurma(turmaId) {
    const { data: alunos } = await supabase.from('alunos').select('id').eq('turma_id', turmaId)

    if (alunos && alunos.length > 0) {
      if (!confirm(`Esta turma tem ${alunos.length} aluno(s). Deseja excluir mesmo assim?`)) return
      await supabase.from('alunos').delete().eq('turma_id', turmaId)
      await supabase.from('frequencia').delete().eq('turma_id', turmaId)
    } else {
      if (!confirm('Tem certeza que deseja excluir esta turma?')) return
    }

    try {
      const { error } = await supabase.from('turmas').delete().eq('id', turmaId)
      if (error) throw error
      await fetchTurmas()
      setMensagem({ tipo: 'ok', texto: '✅ Turma excluída com sucesso!' })
      setTimeout(() => setMensagem(null), 3000)
    } catch (error) {
      console.error('Erro ao excluir turma:', error)
      setMensagem({ tipo: 'erro', texto: '❌ Erro ao excluir turma!' })
    }
  }

  // ════════════════════════════════════════════════════════════
  // FUNÇÃO PARA SUBSTITUIR PROFESSOR EM MASSA
  // ════════════════════════════════════════════════════════════

  function abrirModalSubstituir() {
    if (!filtroProfessor) {
      alert('Selecione um professor no filtro primeiro!')
      return
    }
    setProfessorSubstituir(filtroProfessor)
    setNovoProfessor('')
    setMostrarModalSubstituir(true)
  }

  async function substituirProfessor() {
    if (!novoProfessor.trim()) {
      alert('Informe o nome do novo professor!')
      return
    }

    const confirmMsg = `Deseja substituir "${professorSubstituir}" por "${novoProfessor.toUpperCase()}" em TODAS as turmas?\n\nIsso afetará ${turmas.filter(t => t.professor === professorSubstituir).length} turma(s).`
    
    if (!confirm(confirmMsg)) {
      return
    }

    try {
      const { error } = await supabase
        .from('turmas')
        .update({ professor: novoProfessor.toUpperCase().trim() })
        .eq('professor', professorSubstituir)

      if (error) throw error

      await fetchTurmas()
      setMostrarModalSubstituir(false)
      setNovoProfessor('')
      setFiltroProfessor('')
      
      setMensagem({ 
        tipo: 'ok', 
        texto: `✅ Todas as turmas de "${professorSubstituir}" foram atualizadas para "${novoProfessor.toUpperCase()}"!` 
      })
      setTimeout(() => setMensagem(null), 4000)
    } catch (error) {
      console.error('Erro ao substituir professor:', error)
      alert('❌ Erro ao substituir professor. Tente novamente.')
    }
  }

  // Lista de professores para o filtro
  const todosProfessores = [...new Set(turmas.map(t => t.professor))].sort()
  const turmasFiltradas = filtroProfessor ? turmas.filter(t => t.professor === filtroProfessor) : turmas
  const turmasPorUnidade = UNIDADES.map(u => ({
    ...u,
    turmas: turmasFiltradas.filter(t => (t.unidade || 'jardim_europa') === u.id)
  }))

  if (loading) {
    return <div className="h-screen flex items-center justify-center font-black text-2xl uppercase italic text-black bg-white">CARREGANDO...</div>
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Link href="/menu" className="text-xs border-2 border-black px-4 py-2 font-black italic uppercase bg-white hover:bg-black hover:text-white transition-all">
              ← VOLTAR
            </Link>
            <h1 className="text-4xl font-black italic inline-block border-l-8 border-black pl-4">
              GERENCIAR <span className="text-blue-600">TURMAS</span>
            </h1>
          </div>
          <button
            onClick={() => {
              resetarForm()
              setMostrarForm(true)
            }}
            className="bg-emerald-600 text-white px-6 py-3 font-black uppercase italic text-sm border-4 border-black shadow-[4px_4px_0px_#000] hover:bg-emerald-500 transition-all"
          >
            + NOVA TURMA
          </button>
        </div>

        {/* Filtro + Botão Substituir */}
        <div className="bg-white border-4 border-black p-4 mb-6 shadow-[4px_4px_0px_#000] flex flex-wrap items-center gap-4">
          <span className="text-[10px] font-black uppercase">Filtrar por professor:</span>
          <select
            value={filtroProfessor}
            onChange={e => setFiltroProfessor(e.target.value)}
            className="border-2 border-black px-4 py-2 text-sm font-bold uppercase outline-none flex-1 min-w-[200px] bg-white"
          >
            <option value="">TODOS OS PROFESSORES</option>
            {todosProfessores.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          {filtroProfessor && (
            <>
              <button
                onClick={() => setFiltroProfessor('')}
                className="bg-red-600 text-white px-4 py-2 text-xs font-black uppercase border-2 border-black hover:bg-red-500 transition-all"
              >
                ✕ LIMPAR
              </button>
              <button
                onClick={abrirModalSubstituir}
                className="bg-blue-600 text-white px-4 py-2 text-xs font-black uppercase border-2 border-black hover:bg-blue-500 transition-all flex items-center gap-2"
              >
                🔁 SUBSTITUIR PROFESSOR
              </button>
            </>
          )}
          <span className="text-xs text-gray-500 font-bold ml-auto">
            {turmasFiltradas.length} turma(s) encontrada(s)
          </span>
        </div>

        {/* MODAL DE SUBSTITUIÇÃO EM MASSA */}
        {mostrarModalSubstituir && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white border-4 border-black p-6 max-w-md w-full shadow-[8px_8px_0px_#000]">
              <h3 className="text-xl font-black uppercase mb-4">🔁 Substituir Professor</h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-1">Professor atual:</p>
                <p className="text-lg font-black text-red-600">{professorSubstituir}</p>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-1">Quantidade de turmas:</p>
                <p className="text-lg font-black">{turmas.filter(t => t.professor === professorSubstituir).length} turma(s)</p>
              </div>
              
              <div className="mb-4">
                <label className="block text-[10px] font-black uppercase mb-1">
                  Novo professor *
                </label>
                <input
                  type="text"
                  value={novoProfessor}
                  onChange={e => setNovoProfessor(e.target.value.toUpperCase())}
                  className="w-full border-2 border-black px-3 py-2 text-sm font-bold uppercase outline-none"
                  placeholder="Nome do novo professor"
                  autoFocus
                />
              </div>
              
              <div className="text-xs text-yellow-600 bg-yellow-50 border-2 border-yellow-600 p-2 mb-4">
                ⚠️ Esta ação substituirá o professor em TODAS as turmas listadas acima. Esta ação não pode ser desfeita individualmente.
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setMostrarModalSubstituir(false)
                    setNovoProfessor('')
                  }}
                  className="flex-1 bg-gray-200 px-4 py-2 text-sm font-black uppercase border-2 border-black hover:bg-gray-300 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={substituirProfessor}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 text-sm font-black uppercase border-2 border-black hover:bg-blue-500 transition-all"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mensagem */}
        {mensagem && (
          <div className={`mb-6 px-4 py-3 border-4 border-black font-bold text-sm ${
            mensagem.tipo === 'ok' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {mensagem.texto}
          </div>
        )}

        {/* Formulário */}
        {mostrarForm && (
          <div className="bg-white border-4 border-black p-6 mb-8 shadow-[6px_6px_0px_#000]">
            <h2 className="text-2xl font-black italic mb-4">
              {editandoTurma ? 'EDITAR TURMA' : 'NOVA TURMA'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase mb-1">Professor *</label>
                <input
                  type="text"
                  value={turmaForm.professor}
                  onChange={e => setTurmaForm({ ...turmaForm, professor: e.target.value.toUpperCase() })}
                  className="w-full border-2 border-black px-3 py-2 text-sm font-bold uppercase outline-none"
                  placeholder="Nome do professor"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase mb-1">Oficina/Curso *</label>
                <input
                  type="text"
                  value={turmaForm.oficina}
                  onChange={e => setTurmaForm({ ...turmaForm, oficina: e.target.value.toUpperCase() })}
                  className="w-full border-2 border-black px-3 py-2 text-sm font-bold uppercase outline-none"
                  placeholder="Ex: VIOLÃO, PIANO, CANTO..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase mb-1">Horário *</label>
                <input
                  type="text"
                  value={turmaForm.horario}
                  onChange={e => setTurmaForm({ ...turmaForm, horario: e.target.value })}
                  className="w-full border-2 border-black px-3 py-2 text-sm font-bold outline-none"
                  placeholder="Ex: 14:00 - 15:30"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase mb-1">Unidade *</label>
                <select
                  value={turmaForm.unidade}
                  onChange={e => setTurmaForm({ ...turmaForm, unidade: e.target.value })}
                  className="w-full border-2 border-black px-3 py-2 text-sm font-bold outline-none"
                >
                  {UNIDADES.map(u => (
                    <option key={u.id} value={u.id}>{u.nome}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black uppercase mb-2">Dias da Semana *</label>
                <div className="flex flex-wrap gap-2">
                  {DIAS_SEMANA.map(dia => (
                    <button
                      key={dia.id}
                      onClick={() => toggleDia(dia.id)}
                      className={`px-4 py-2 border-2 border-black font-bold text-sm transition-all ${
                        turmaForm.dias.includes(dia.id) ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
                      }`}
                    >
                      {dia.label}
                    </button>
                  ))}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {turmaForm.dias.length > 0 ? `Dias selecionados: ${turmaForm.dias.map(d => DIAS_SEMANA.find(dia => dia.id === d)?.label).join(', ')}` : 'Nenhum dia selecionado'}
                </div>
              </div>

              {/* Limite personalizado */}
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black uppercase mb-1">Limite de alunos</label>
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setTurmaForm(prev => ({
                      ...prev,
                      limite_personalizado: Math.max(1, (prev.limite_personalizado || 15) - 1)
                    }))}
                    className="bg-gray-200 px-4 py-2 border-2 border-black font-black hover:bg-gray-300 text-lg"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={turmaForm.limite_personalizado || ''}
                    onChange={e => {
                      const val = parseInt(e.target.value)
                      setTurmaForm(prev => ({
                        ...prev,
                        limite_personalizado: isNaN(val) ? 0 : Math.max(1, Math.min(99, val))
                      }))
                    }}
                    className="w-24 border-2 border-black px-3 py-2 text-lg font-bold text-center outline-none"
                    min="1"
                    max="99"
                  />
                  <button
                    type="button"
                    onClick={() => setTurmaForm(prev => ({
                      ...prev,
                      limite_personalizado: Math.min(99, (prev.limite_personalizado || 15) + 1)
                    }))}
                    className="bg-gray-200 px-4 py-2 border-2 border-black font-black hover:bg-gray-300 text-lg"
                  >
                    +
                  </button>
                  <span className="text-xs text-gray-500 font-bold ml-2">
                    Padrão: {obterLimiteOficina(turmaForm.oficina)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTurmaForm(prev => ({
                      ...prev,
                      limite_personalizado: obterLimiteOficina(prev.oficina)
                    }))}
                    className="text-xs bg-gray-100 px-3 py-1 border border-black font-bold hover:bg-gray-200"
                  >
                    Restaurar padrão
                  </button>
                </div>
                <p className="text-[9px] text-gray-400 mt-1">Deixe em branco ou 0 para usar o limite padrão da oficina</p>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={salvarTurma}
                className="bg-blue-600 text-white px-6 py-3 font-black uppercase italic text-sm border-4 border-black shadow-[4px_4px_0px_#000] hover:bg-blue-500 transition-all"
              >
                {editandoTurma ? 'ATUALIZAR TURMA' : 'CRIAR TURMA'}
              </button>
              <button
                onClick={resetarForm}
                className="bg-gray-200 px-6 py-3 font-black uppercase italic text-sm border-4 border-black hover:bg-gray-300 transition-all"
              >
                CANCELAR
              </button>
            </div>
          </div>
        )}

        {/* Lista de turmas por unidade */}
        {turmasPorUnidade.map(unidade => {
          if (unidade.turmas.length === 0) return null

          return (
            <div key={unidade.id} className="mb-12">
              <div className={`flex items-center gap-3 border-l-8 ${unidade.accent} pl-4 mb-4`}>
                <h2 className="text-2xl font-black italic">{unidade.nome}</h2>
                <span className="text-sm text-gray-500 font-bold">{unidade.turmas.length} turmas</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {unidade.turmas.map(turma => {
                  const alunos = contagemAlunos[turma.id] || 0
                  const limite = obterLimiteTurma(turma)
                  const status = getStatusLotacao(alunos, limite)
                  const isPersonalizado = turma.limite_personalizado && turma.limite_personalizado > 0

                  return (
                    <div key={turma.id} className={`bg-white border-4 p-4 shadow-[4px_4px_0px_#000] ${status.bg}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-black text-lg">{turma.oficina}</h3>
                          <p className="text-sm font-bold">{turma.professor}</p>
                          <p className="text-xs text-gray-600 font-bold">{turma.horario}</p>
                          <p className="text-xs font-bold italic mt-1">
                            {formatarDiasTexto(turma.dias)}
                          </p>
                          <p className={`text-xs font-bold mt-1 ${status.cor}`}>
                            {status.icone} Alunos: {alunos} / {limite}
                            {isPersonalizado && (
                              <span className="text-[10px] text-gray-400 ml-1">(personalizado)</span>
                            )}
                            <span className="text-[10px] ml-1">({Math.round((alunos/limite)*100)}%)</span>
                            <span className={`text-[10px] ml-1 font-bold ${status.cor}`}>{status.label}</span>
                          </p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => abrirFormEditar(turma)}
                            className="bg-yellow-400 text-black px-3 py-1 text-[10px] font-black uppercase border-2 border-black hover:bg-yellow-300 transition-all"
                          >
                            ✎ EDITAR
                          </button>
                          <button
                            onClick={() => excluirTurma(turma.id)}
                            className="bg-red-600 text-white px-3 py-1 text-[10px] font-black uppercase border-2 border-black hover:bg-red-500 transition-all"
                          >
                            ✕ EXCLUIR
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
