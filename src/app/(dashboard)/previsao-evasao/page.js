// src/app/(dashboard)/previsao-evasao/page.js
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Loading from '@/components/ui/Loading'

export default function PrevisaoEvasao() {
  const [loading, setLoading] = useState(true)
  const [alunos, setAlunos] = useState([])
  const [filtro, setFiltro] = useState('todos')
  const [stats, setStats] = useState({ total: 0, baixo: 0, medio: 0, alto: 0 })

  useEffect(() => {
    fetchDados()
  }, [])

  async function fetchDados() {
    setLoading(true)
    try {
      const { data: alunosData } = await supabase
        .from('alunos')
        .select('id, nome, turma_id, telefone, whatsapp')
        .not('turma_id', 'is', null)

      const { data: turmasData } = await supabase
        .from('turmas')
        .select('id, oficina, horario, professor')

      const { data: frequenciasData } = await supabase
        .from('frequencia')
        .select('aluno_id, status, data_aula, mes')

      const alunosAnalisados = alunosData?.map(aluno => {
        const freqAluno = frequenciasData?.filter(f => f.aluno_id === aluno.id) || []
        const totalAulas = freqAluno.length
        const presencas = freqAluno.filter(f => f.status === 'P').length
        const faltas = freqAluno.filter(f => f.status === 'F').length
        const ultimasAulas = freqAluno.sort((a, b) => new Date(b.data_aula) - new Date(a.data_aula)).slice(0, 3)
        const faltasConsecutivas = ultimasAulas.filter(f => f.status === 'F').length
        const ultimaPresenca = freqAluno.filter(f => f.status === 'P').sort((a, b) => new Date(b.data_aula) - new Date(a.data_aula))[0]
        const diasSemPresenca = ultimaPresenca ? Math.floor((Date.now() - new Date(ultimaPresenca.data_aula)) / (1000 * 60 * 60 * 24)) : 30
        const percentualPresenca = totalAulas > 0 ? Math.round((presencas / totalAulas) * 100) : 0

        let risco = 0
        if (faltasConsecutivas >= 3) risco += 40
        if (faltasConsecutivas >= 2) risco += 20
        if (diasSemPresenca >= 15) risco += 30
        if (diasSemPresenca >= 7) risco += 15
        if (percentualPresenca < 50) risco += 30
        if (percentualPresenca < 75) risco += 15
        if (faltas > totalAulas * 0.3) risco += 20
        risco = Math.min(risco, 100)

        let nivel = 'baixo', cor = 'text-green-600', bg = 'bg-green-50', icone = '🟢'
        if (risco >= 70) { nivel = 'alto'; cor = 'text-red-600'; bg = 'bg-red-50'; icone = '🔴' }
        else if (risco >= 40) { nivel = 'medio'; cor = 'text-yellow-600'; bg = 'bg-yellow-50'; icone = '🟡' }

        const turma = turmasData?.find(t => t.id === aluno.turma_id)
        return { ...aluno, turma, totalAulas, presencas, faltas, percentualPresenca, faltasConsecutivas, diasSemPresenca, risco, nivel, cor, bg, icone }
      }) || []

      const total = alunosAnalisados.length
      const baixo = alunosAnalisados.filter(a => a.nivel === 'baixo').length
      const medio = alunosAnalisados.filter(a => a.nivel === 'medio').length
      const alto = alunosAnalisados.filter(a => a.nivel === 'alto').length

      setStats({ total, baixo, medio, alto })
      setAlunos(alunosAnalisados)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const alunosFiltrados = filtro === 'todos' ? alunos : alunos.filter(a => a.nivel === filtro)

  const contatarWhatsApp = (numero) => {
    if (!numero) return
    const msg = 'Olá! A Casa da Cultura está com uma preocupação com a frequência do seu(sua) filho(a). Por favor, entre em contato conosco para conversarmos.'
    window.open(`https://wa.me/55${numero.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  if (loading) {
    return <Loading mensagem="Analisando dados..." />
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/menu" className="text-xs border-2 border-black px-4 py-2 font-black italic uppercase bg-white hover:bg-black hover:text-white transition-all">← VOLTAR</Link>
          <h1 className="text-3xl font-black border-l-8 border-black pl-4">🤖 PREVISÃO DE <span className="text-blue-600">EVASÃO</span></h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#000] text-center">
            <div className="text-3xl font-black text-blue-600">{stats.total}</div>
            <div className="text-[10px] font-black uppercase">Total de Alunos</div>
          </div>
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#000] text-center">
            <div className="text-3xl font-black text-green-600">{stats.baixo}</div>
            <div className="text-[10px] font-black uppercase">🟢 Baixo Risco</div>
          </div>
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#000] text-center">
            <div className="text-3xl font-black text-yellow-600">{stats.medio}</div>
            <div className="text-[10px] font-black uppercase">🟡 Médio Risco</div>
          </div>
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#000] text-center">
            <div className={`text-3xl font-black ${stats.alto > 0 ? 'text-red-600' : 'text-gray-400'}`}>{stats.alto}</div>
            <div className="text-[10px] font-black uppercase">🔴 Alto Risco</div>
          </div>
        </div>

        <div className="bg-white border-4 border-black p-4 mb-6 shadow-[4px_4px_0px_#000]">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setFiltro('todos')} className={`px-4 py-1 text-xs font-black uppercase border-2 border-black transition-all ${filtro === 'todos' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}>Todos ({stats.total})</button>
            <button onClick={() => setFiltro('baixo')} className={`px-4 py-1 text-xs font-black uppercase border-2 border-black transition-all ${filtro === 'baixo' ? 'bg-green-600 text-white' : 'bg-white hover:bg-gray-100'}`}>🟢 Baixo ({stats.baixo})</button>
            <button onClick={() => setFiltro('medio')} className={`px-4 py-1 text-xs font-black uppercase border-2 border-black transition-all ${filtro === 'medio' ? 'bg-yellow-500 text-white' : 'bg-white hover:bg-gray-100'}`}>🟡 Médio ({stats.medio})</button>
            <button onClick={() => setFiltro('alto')} className={`px-4 py-1 text-xs font-black uppercase border-2 border-black transition-all ${filtro === 'alto' ? 'bg-red-600 text-white' : 'bg-white hover:bg-gray-100'}`}>🔴 Alto ({stats.alto})</button>
          </div>
        </div>

        <div className="bg-white border-4 border-black shadow-[4px_4px_0px_#000] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-black">
                  <th className="px-4 py-2 text-left font-black">Aluno</th>
                  <th className="px-4 py-2 text-left font-black">Turma</th>
                  <th className="px-4 py-2 text-center font-black">Presença</th>
                  <th className="px-4 py-2 text-center font-black">Faltas</th>
                  <th className="px-4 py-2 text-center font-black">Faltas Consec.</th>
                  <th className="px-4 py-2 text-center font-black">Risco</th>
                  <th className="px-4 py-2 text-center font-black">Status</th>
                  <th className="px-4 py-2 text-center font-black">Ação</th>
                </tr>
              </thead>
              <tbody>
                {alunosFiltrados.map((aluno) => (
                  <tr key={aluno.id} className={`border-b border-black ${aluno.bg}`}>
                    <td className="px-4 py-2 font-bold uppercase">{aluno.nome}</td>
                    <td className="px-4 py-2 text-sm">{aluno.turma?.oficina || 'N/A'}<span className="block text-[10px] text-gray-400">{aluno.turma?.horario} - {aluno.turma?.professor}</span></td>
                    <td className="px-4 py-2 text-center font-bold text-green-600">{aluno.percentualPresenca}%</td>
                    <td className="px-4 py-2 text-center font-bold text-red-600">{aluno.faltas}</td>
                    <td className="px-4 py-2 text-center font-bold">{aluno.faltasConsecutivas}</td>
                    <td className="px-4 py-2 text-center font-bold"><span className={`px-2 py-1 border border-black ${aluno.bg}`}>{aluno.risco}%</span></td>
                    <td className="px-4 py-2 text-center text-2xl">{aluno.icone}</td>
                    <td className="px-4 py-2 text-center">
                      {aluno.whatsapp && <button onClick={() => contatarWhatsApp(aluno.whatsapp)} className="bg-green-500 text-white px-2 py-1 text-xs font-black border border-black hover:bg-green-600 transition-all">💬</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {alunosFiltrados.length === 0 && <div className="text-center py-8"><p className="text-xl font-black text-gray-400">Nenhum aluno encontrado</p></div>}
      </div>
    </div>
  )
}
