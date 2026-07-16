// src/app/(dashboard)/dashboard/page.js
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Loading from '@/components/ui/Loading'
import CardStats from './components/CardStats'
import GraficoEvasao from './components/GraficoEvasao'
import GraficoOcupacao from './components/GraficoOcupacao'

const UNIDADES = [
  { id: 'jardim_europa', nome: 'Jardim Europa', label: 'Jardim Europa' },
  { id: 'centro', nome: 'Centro', label: 'Centro' },
  { id: 'sede', nome: 'Sede', label: 'Sede (Bela Vista)' },
]

export default function DashboardGeral() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalAlunos: 0,
    totalTurmas: 0,
    ocupacao: 0,
    totalEvasao: 0,
  })
  const [evasaoMensal, setEvasaoMensal] = useState([])
  const [unidadesResumo, setUnidadesResumo] = useState([])
  const [turmasLotacao, setTurmasLotacao] = useState([])
  const [alertas, setAlertas] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    setLoading(true)

    try {
      const { count: totalAlunos } = await supabase
        .from('alunos')
        .select('*', { count: 'exact', head: true })

      const { count: totalTurmas } = await supabase
        .from('turmas')
        .select('*', { count: 'exact', head: true })

      const { count: evadidos } = await supabase
        .from('matriculas')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'desistente')

      const { data: turmasData } = await supabase
        .from('turmas')
        .select('id, oficina, horario, limite_personalizado, unidade')
      
      const { data: alunosData } = await supabase
        .from('alunos')
        .select('turma_id')

      const ocupacaoPorTurma = turmasData?.map(turma => {
        const alunosNaTurma = alunosData?.filter(a => a.turma_id === turma.id).length || 0
        const limite = turma.limite_personalizado || 15
        return {
          ...turma,
          alunos: alunosNaTurma,
          limite: limite,
          percentual: Math.round((alunosNaTurma / limite) * 100)
        }
      }) || []

      const unidadesResumoData = UNIDADES.map(unidade => {
        const turmasDaUnidade = ocupacaoPorTurma.filter(t => t.unidade === unidade.id)
        const totalAlunosUnidade = turmasDaUnidade.reduce((acc, t) => acc + t.alunos, 0)
        const totalTurmasUnidade = turmasDaUnidade.length
        const ocupacaoUnidade = totalTurmasUnidade > 0
          ? Math.round(turmasDaUnidade.reduce((acc, t) => acc + t.percentual, 0) / totalTurmasUnidade)
          : 0
        return {
          ...unidade,
          totalAlunos: totalAlunosUnidade,
          totalTurmas: totalTurmasUnidade,
          ocupacao: ocupacaoUnidade
        }
      })

      const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
      const evasaoMensalData = []
      const hoje = new Date()
      for (let i = 5; i >= 0; i--) {
        const mes = (hoje.getMonth() - i + 12) % 12
        const ano = hoje.getMonth() - i < 0 ? hoje.getFullYear() - 1 : hoje.getFullYear()
        const { count } = await supabase
          .from('matriculas')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'desistente')
          .gte('created_at', `${ano}-${String(mes+1).padStart(2,'0')}-01`)
          .lt('created_at', `${ano}-${String(mes+2).padStart(2,'0')}-01`)
        evasaoMensalData.push({
          mes: meses[mes],
          total: count || 0
        })
      }

      const alertasData = ocupacaoPorTurma.filter(t => t.percentual >= 90 || t.percentual <= 20)
      const turmasLotacaoData = [...ocupacaoPorTurma]
        .sort((a, b) => b.percentual - a.percentual)
        .slice(0, 5)

      const ocupacaoTotal = ocupacaoPorTurma.length > 0
        ? Math.round(ocupacaoPorTurma.reduce((acc, t) => acc + t.percentual, 0) / ocupacaoPorTurma.length)
        : 0

      setStats({
        totalAlunos: totalAlunos || 0,
        totalTurmas: totalTurmas || 0,
        ocupacao: ocupacaoTotal,
        totalEvasao: evadidos || 0,
      })

      setEvasaoMensal(evasaoMensalData)
      setUnidadesResumo(unidadesResumoData)
      setTurmasLotacao(turmasLotacaoData)
      setAlertas(alertasData)

    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <Loading mensagem="Carregando dashboard..." />
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/menu" className="text-xs border-2 border-black px-4 py-2 font-black italic uppercase bg-white hover:bg-black hover:text-white transition-all">
              ← VOLTAR
            </Link>
            <h1 className="text-3xl font-black border-l-8 border-black pl-4">
              📊 DASHBOARD <span className="text-blue-600">GERAL</span>
            </h1>
          </div>
          <div className="flex gap-2">
            {UNIDADES.map(u => (
              <Link
                key={u.id}
                href={`/dashboard/${u.id}`}
                className="text-xs border-2 border-black px-3 py-1 font-black uppercase bg-white hover:bg-black hover:text-white transition-all"
              >
                {u.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <CardStats titulo="Total de Alunos" valor={stats.totalAlunos} cor="text-blue-600" icone="👨‍🎓" />
          <CardStats titulo="Total de Turmas" valor={stats.totalTurmas} cor="text-emerald-600" icone="📚" />
          <CardStats titulo="Ocupação Média" valor={`${stats.ocupacao}%`} cor="text-purple-600" icone="📊" />
          <CardStats 
            titulo="Evasão Total" 
            valor={stats.totalEvasao} 
            cor={stats.totalEvasao > 10 ? 'text-red-600' : 'text-yellow-600'} 
            icone="⚠️" 
          />
        </div>

        <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0px_#000] mb-8">
          <h2 className="text-xl font-black uppercase mb-4">🏠 Resumo por Unidade</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {unidadesResumo.map((unidade, index) => (
              <Link
                key={index}
                href={`/dashboard/${unidade.id}`}
                className="border-2 border-black p-4 hover:bg-gray-50 transition-all"
              >
                <h3 className="font-black text-lg">{unidade.label}</h3>
                <div className="flex justify-between mt-2 text-sm">
                  <span>👨‍🎓 {unidade.totalAlunos} alunos</span>
                  <span>📚 {unidade.totalTurmas} turmas</span>
                </div>
                <div className="mt-2 w-full h-4 bg-gray-200 border border-black">
                  <div 
                    className={`h-full ${unidade.ocupacao >= 90 ? 'bg-red-500' : unidade.ocupacao >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(unidade.ocupacao, 100)}%` }}
                  ></div>
                </div>
                <div className="text-right text-xs font-bold mt-1">{unidade.ocupacao}% ocupado</div>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <GraficoEvasao dados={evasaoMensal} titulo="Evolução da Evasão" />
          <GraficoOcupacao dados={turmasLotacao} titulo="Turmas com Maior Ocupação" />
        </div>

        {alertas.length > 0 && (
          <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0px_#000]">
            <h2 className="text-xl font-black uppercase mb-4">⚠️ Alertas</h2>
            <div className="space-y-2">
              {alertas.map((turma, index) => {
                const isLotada = turma.percentual >= 90
                return (
                  <div key={index} className={`p-3 border-2 border-black flex justify-between items-center ${isLotada ? 'bg-red-50' : 'bg-yellow-50'}`}>
                    <div>
                      <span className="font-black">{turma.oficina}</span>
                      <span className="text-sm text-gray-600 ml-2">{turma.horario}</span>
                      <span className="text-xs text-gray-400 ml-2">
                        {UNIDADES.find(u => u.id === turma.unidade)?.label || turma.unidade}
                      </span>
                    </div>
                    <div>
                      <span className={`font-black ${isLotada ? 'text-red-600' : 'text-yellow-600'}`}>
                        {isLotada ? '🔴 LOTADA' : '🟡 POUCOS ALUNOS'}
                      </span>
                      <span className="text-sm ml-2">{turma.alunos}/{turma.limite}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
