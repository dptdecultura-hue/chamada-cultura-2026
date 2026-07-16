// src/app/(dashboard)/relatorios/frequencia/page.js
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Loading from '@/components/ui/Loading'

export default function RelatorioFrequencia() {
  const [loading, setLoading] = useState(true)
  const [turmas, setTurmas] = useState([])
  const [turmaSelecionada, setTurmaSelecionada] = useState('')
  const [dadosFrequencia, setDadosFrequencia] = useState([])
  const [resumo, setResumo] = useState({ total: 0, presentes: 0, faltas: 0, justificados: 0 })

  useEffect(() => {
    fetchTurmas()
  }, [])

  useEffect(() => {
    if (turmaSelecionada) fetchFrequencia()
  }, [turmaSelecionada])

  async function fetchTurmas() {
    const { data } = await supabase.from('turmas').select('id, oficina, horario, professor, unidade')
    setTurmas(data || [])
    setLoading(false)
  }

  async function fetchFrequencia() {
    setLoading(true)
    try {
      const { data: alunos } = await supabase.from('alunos').select('id, nome').eq('turma_id', turmaSelecionada).order('posicao', { ascending: true })
      const { data: frequencias } = await supabase.from('frequencia').select('aluno_id, status').eq('turma_id', turmaSelecionada)
      const total = alunos?.length || 0
      const presentes = frequencias?.filter(f => f.status === 'P').length || 0
      const faltas = frequencias?.filter(f => f.status === 'F').length || 0
      const justificados = frequencias?.filter(f => f.status === 'J').length || 0
      setResumo({ total, presentes, faltas, justificados })

      const dados = alunos?.map(aluno => {
        const freqAluno = frequencias?.filter(f => f.aluno_id === aluno.id) || []
        const presencas = freqAluno.filter(f => f.status === 'P').length
        const faltasAluno = freqAluno.filter(f => f.status === 'F').length
        const justificadosAluno = freqAluno.filter(f => f.status === 'J').length
        const totalAulas = freqAluno.length
        const percentual = totalAulas > 0 ? Math.round((presencas / totalAulas) * 100) : 0
        return { ...aluno, presencas, faltas: faltasAluno, justificados: justificadosAluno, totalAulas, percentual, status: totalAulas > 0 ? (percentual >= 75 ? '✅' : percentual >= 50 ? '⚠️' : '🔴') : '⚪' }
      }) || []

      setDadosFrequencia(dados)
    } catch (error) {
      console.error('Erro ao carregar frequência:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => window.print()
  const turma = turmas.find(t => t.id === turmaSelecionada)

  if (loading && turmaSelecionada) {
    return <Loading mensagem="Carregando relatório..." />
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/menu" className="text-xs border-2 border-black px-4 py-2 font-black italic uppercase bg-white hover:bg-black hover:text-white transition-all">← VOLTAR</Link>
            <h1 className="text-3xl font-black border-l-8 border-black pl-4">📊 RELATÓRIO DE <span className="text-blue-600">FREQUÊNCIA</span></h1>
          </div>
          {turmaSelecionada && <button onClick={handlePrint} className="bg-black text-white px-6 py-2 font-black uppercase text-sm border-2 border-black shadow-[2px_2px_0px_#000] hover:bg-white hover:text-black transition-all">🖨️ IMPRIMIR</button>}
        </div>

        <div className="bg-white border-4 border-black p-4 mb-6 shadow-[4px_4px_0px_#000]">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-[10px] font-black uppercase">Selecione a Turma:</span>
            <select value={turmaSelecionada} onChange={e => setTurmaSelecionada(e.target.value)} className="border-2 border-black px-4 py-2 text-sm font-bold uppercase outline-none flex-1 min-w-[200px] bg-white">
              <option value="">Todas as turmas</option>
              {turmas.map(t => <option key={t.id} value={t.id}>{t.oficina} - {t.horario} - {t.professor}</option>)}
            </select>
          </div>
        </div>

        {turmaSelecionada && turma && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#000] text-center"><div className="text-2xl font-black text-blue-600">{resumo.total}</div><div className="text-[10px] font-black uppercase">Total de Alunos</div></div>
            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#000] text-center"><div className="text-2xl font-black text-green-600">{resumo.presentes}</div><div className="text-[10px] font-black uppercase">Presentes</div></div>
            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#000] text-center"><div className="text-2xl font-black text-red-600">{resumo.faltas}</div><div className="text-[10px] font-black uppercase">Faltas</div></div>
            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#000] text-center"><div className="text-2xl font-black text-yellow-600">{resumo.justificados}</div><div className="text-[10px] font-black uppercase">Justificados</div></div>
          </div>
        )}

        {turmaSelecionada && dadosFrequencia.length > 0 && (
          <div className="bg-white border-4 border-black shadow-[4px_4px_0px_#000] overflow-hidden print:border-2">
            <div className="p-4 border-b-2 border-black bg-gray-50"><h2 className="font-black text-lg">{turma?.oficina} - {turma?.professor}</h2><p className="text-sm text-gray-600">{turma?.horario}</p></div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead><tr className="bg-gray-100 border-b-2 border-black"><th className="px-4 py-2 text-left font-black">Nº</th><th className="px-4 py-2 text-left font-black">Aluno</th><th className="px-4 py-2 text-center font-black">Presenças</th><th className="px-4 py-2 text-center font-black">Faltas</th><th className="px-4 py-2 text-center font-black">Justif.</th><th className="px-4 py-2 text-center font-black">Total</th><th className="px-4 py-2 text-center font-black">%</th><th className="px-4 py-2 text-center font-black">Status</th></tr></thead>
                <tbody>
                  {dadosFrequencia.map((aluno, index) => (
                    <tr key={aluno.id} className="border-b border-black hover:bg-gray-50">
                      <td className="px-4 py-2 font-bold">{index + 1}</td>
                      <td className="px-4 py-2 font-bold uppercase">{aluno.nome}</td>
                      <td className="px-4 py-2 text-center text-green-600 font-bold">{aluno.presencas}</td>
                      <td className="px-4 py-2 text-center text-red-600 font-bold">{aluno.faltas}</td>
                      <td className="px-4 py-2 text-center text-yellow-600 font-bold">{aluno.justificados}</td>
                      <td className="px-4 py-2 text-center font-bold">{aluno.totalAulas}</td>
                      <td className="px-4 py-2 text-center font-bold">{aluno.percentual}%</td>
                      <td className="px-4 py-2 text-center text-2xl">{aluno.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {turmaSelecionada && dadosFrequencia.length === 0 && !loading && (
          <div className="bg-white border-4 border-black p-8 text-center"><p className="text-xl font-black text-gray-400">Nenhum aluno encontrado nesta turma</p></div>
        )}
      </div>
    </div>
  )
}
