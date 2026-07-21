// src/app/(dashboard)/matricula/nova/page.js
'use client'

import { Suspense } from 'react'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { UNIDADES } from '@/lib/constants'

export default function NovaMatricula() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-black">Carregando...</div>}>
      <ConteudoMatricula />
    </Suspense>
  )
}

function ConteudoMatricula() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const alunoId = searchParams.get('alunoId')

  const [loading, setLoading] = useState(false)
  const [mensagem, setMensagem] = useState(null)
  const [aluno, setAluno] = useState(null)
  const [turmas, setTurmas] = useState([])
  const [diasDaTurma, setDiasDaTurma] = useState([])

  const [formData, setFormData] = useState({
    aluno_id: alunoId || '',
    turma_id: '',
    unidade: '',
    data_matricula: new Date().toISOString().split('T')[0],
    status: 'cursando',
  })

  useEffect(() => {
    if (alunoId) {
      fetchAluno()
    }
    fetchTurmas()
  }, [alunoId])

  // ════════════════════════════════════════════════════════════
  // QUANDO A TURMA MUDA, BUSCAR OS DIAS
  // ════════════════════════════════════════════════════════════
  useEffect(() => {
    if (formData.turma_id) {
      const turmaSelecionada = turmas.find(t => t.id === formData.turma_id)
      setDiasDaTurma(turmaSelecionada?.dias || [])
    } else {
      setDiasDaTurma([])
    }
  }, [formData.turma_id, turmas])

  async function fetchAluno() {
    const { data, error } = await supabase
      .from('alunos')
      .select('*')
      .eq('id', alunoId)
      .single()

    if (error) {
      console.error('Erro ao buscar aluno:', error)
      setMensagem({ tipo: 'erro', texto: 'Aluno não encontrado!' })
      return
    }
    setAluno(data)
  }

  async function fetchTurmas() {
    const { data, error } = await supabase
      .from('turmas')
      .select('*')
      .order('oficina', { ascending: true })

    if (error) {
      console.error('Erro ao buscar turmas:', error)
      return
    }
    setTurmas(data || [])
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'turma_id') {
      const turmaSelecionada = turmas.find(t => t.id === value)
      setFormData(prev => ({
        ...prev,
        turma_id: value,
        unidade: turmaSelecionada?.unidade || ''
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  // ════════════════════════════════════════════════════════════
  // FUNÇÃO PARA FORMATAR OS DIAS
  // ════════════════════════════════════════════════════════════
  const formatarDias = (diasArray) => {
    if (!diasArray || diasArray.length === 0) return 'Selecione uma turma'
    const NOMES_DIAS = ['DOMINGO', 'SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO']
    return diasArray.map(d => NOMES_DIAS[d]).join(' E ')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMensagem(null)

    if (!formData.turma_id) {
      setMensagem({ tipo: 'erro', texto: 'Selecione uma turma!' })
      setLoading(false)
      return
    }

    try {
      const { data: turmaData, error: turmaError } = await supabase
        .from('turmas')
        .select('oficina, horario, professor, unidade')
        .eq('id', formData.turma_id)
        .single()

      if (turmaError) throw turmaError

      const { data: existente, error: checkError } = await supabase
        .from('matriculas')
        .select('*')
        .eq('aluno_id', formData.aluno_id)
        .eq('turma_id', formData.turma_id)
        .eq('status', 'cursando')

      if (checkError) throw checkError

      if (existente && existente.length > 0) {
        setMensagem({ tipo: 'erro', texto: 'Aluno já está matriculado nesta turma!' })
        setLoading(false)
        return
      }

      await supabase
        .from('matriculas')
        .insert([{
          aluno_id: formData.aluno_id,
          turma_id: formData.turma_id,
          unidade: formData.unidade,
          data_matricula: formData.data_matricula,
          status: formData.status,
        }])

      await supabase
        .from('alunos')
        .update({
          turma_id: formData.turma_id,
          unidade: formData.unidade,
          curso: turmaData.oficina,
          horario: turmaData.horario,
        })
        .eq('id', formData.aluno_id)

      const { data: alunosNaTurma } = await supabase
        .from('alunos')
        .select('posicao')
        .eq('turma_id', formData.turma_id)
        .order('posicao', { ascending: true })

      const ultimaPosicao = alunosNaTurma?.length || 0

      await supabase
        .from('alunos')
        .update({ posicao: ultimaPosicao + 1 })
        .eq('id', formData.aluno_id)

      setMensagem({ 
        tipo: 'ok', 
        texto: `✅ Aluno matriculado em "${turmaData.oficina}" com ${turmaData.professor}!` 
      })

      setTimeout(() => {
        router.push(`/alunos`)
      }, 2000)

    } catch (error) {
      console.error('Erro ao matricular:', error)
      setMensagem({ tipo: 'erro', texto: '❌ Erro ao realizar matrícula!' })
    } finally {
      setLoading(false)
    }
  }

  if (!alunoId) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-8 flex items-center justify-center">
        <div className="bg-white border-4 border-black p-8 max-w-md w-full shadow-[8px_8px_0px_#000] text-center">
          <h1 className="text-2xl font-black uppercase mb-4">⚠️ Nenhum aluno selecionado</h1>
          <p className="text-gray-500 mb-6">Volte para o perfil do aluno e clique em "NOVA MATRÍCULA"</p>
          <Link href="/alunos" className="bg-black text-white px-6 py-2 font-black uppercase text-sm border-2 border-black hover:bg-white hover:text-black transition-all inline-block">
            ← VOLTAR
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/alunos`} className="text-xs border-2 border-black px-4 py-2 font-black italic uppercase bg-white hover:bg-black hover:text-white transition-all">
            ← VOLTAR
          </Link>
          <h1 className="text-3xl font-black border-l-8 border-black pl-4">
            NOVA <span className="text-blue-600">MATRÍCULA</span>
          </h1>
        </div>

        {aluno && (
          <div className="bg-white border-4 border-black p-4 mb-6 shadow-[4px_4px_0px_#000]">
            <p className="font-black text-lg">{aluno.nome}</p>
            <p className="text-sm text-gray-600">CPF: {aluno.cpf}</p>
          </div>
        )}

        {mensagem && (
          <div className={`mb-6 px-4 py-3 border-4 border-black font-bold text-sm ${
            mensagem.tipo === 'ok' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {mensagem.texto}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white border-4 border-black p-6 shadow-[4px_4px_0px_#000]">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase mb-1">Turma *</label>
              <select
                name="turma_id"
                value={formData.turma_id}
                onChange={handleChange}
                className="w-full border-2 border-black px-3 py-2 text-sm font-bold uppercase outline-none"
                required
              >
                <option value="">Selecione uma turma</option>
                {turmas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.oficina} - {t.horario} - {t.professor}
                  </option>
                ))}
              </select>
            </div>

            {/* ════════════════════════════════════════════════════════════ */}
            {/* EXIBIR DIAS DA SEMANA DA TURMA SELECIONADA */}
            {/* ════════════════════════════════════════════════════════════ */}
            <div>
              <label className="block text-[10px] font-black uppercase mb-1">📅 Dias da Semana</label>
              <div className="w-full border-2 border-black px-3 py-2 text-sm font-bold bg-gray-50">
                {diasDaTurma.length > 0 ? formatarDias(diasDaTurma) : 'Selecione uma turma'}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase mb-1">Unidade</label>
              <input
                type="text"
                value={UNIDADES.find(u => u.id === formData.unidade)?.nome || formData.unidade}
                className="w-full border-2 border-black px-3 py-2 text-sm font-bold outline-none bg-gray-100"
                disabled
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase mb-1">Data da Matrícula</label>
              <input
                type="date"
                name="data_matricula"
                value={formData.data_matricula}
                onChange={handleChange}
                className="w-full border-2 border-black px-3 py-2 text-sm font-bold outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full border-2 border-black px-3 py-2 text-sm font-bold outline-none"
              >
                <option value="cursando">🟢 Cursando</option>
                <option value="concluido">✅ Concluído</option>
                <option value="desistente">🔴 Desistente</option>
                <option value="transferido">🟡 Transferido</option>
              </select>
            </div>

            <div className="text-xs text-gray-500">
              ⚠️ Status "Cursando" significa que o aluno está ativo na turma.
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 text-white px-6 py-3 font-black uppercase italic text-sm border-4 border-black shadow-[4px_4px_0px_#000] hover:bg-emerald-500 transition-all disabled:opacity-50"
            >
              {loading ? 'Salvando...' : '📋 REALIZAR MATRÍCULA'}
            </button>
            <Link href={`/alunos`} className="bg-gray-200 px-6 py-3 font-black uppercase italic text-sm border-4 border-black hover:bg-gray-300 transition-all text-center">
              CANCELAR
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
