// src/app/(dashboard)/dashboard/[unidade]/page.js
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import CardStats from '../components/CardStats'
import GraficoOcupacao from '../components/GraficoOcupacao'

const UNIDADES = {
  'jardim_europa': { id: 'jardim_europa', nome: 'Jardim Europa', label: 'Jardim Europa' },
  'centro': { id: 'centro', nome: 'Centro', label: 'Centro' },
  'sede': { id: 'sede', nome: 'Sede', label: 'Sede (Bela Vista)' },
}

export default function DashboardUnidade() {
  const params = useParams()
  const unidadeId = params.unidade
  const unidadeInfo = UNIDADES[unidadeId] || UNIDADES['jardim_europa']

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalAlunos: 0,
    totalTurmas: 0,
    ocupacao: 0,
    totalEvasao: 0,
  })
  const [turmasLotacao, setTurmasLotacao] = useState([])

  useEffect(() => {
    fetchUnidadeData()
  }, [unidadeId])

  async function fetchUnidadeData() {
    setLoading(true)

    try {
      const { data: turmasData } = await supabase
        .from('turmas')
        .select('id, oficina, horario, limite_personalizado')
        .eq('unidade', unidadeId)

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

      const totalAlunos = ocupacaoPorTurma.reduce((acc, t) => acc + t.alunos, 0)
      const totalTurmas = ocupacaoPorTurma.length
      const ocupacaoMedia = totalTurmas > 0
        ? Math.round(ocupacaoPorTurma.reduce((acc, t) => acc + t.percentual, 0) / totalTurmas)
        : 0

      const turmasLotacaoData = [...ocupacaoPorTurma]
        .sort((a, b) => b.percentual - a.percentual)
        .slice(0, 5)

      const { count: evadidos } = await supabase
        .from('matriculas')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'desistente')
        .eq('unidade', unidadeId)

      setStats({
        totalAlunos,
        totalTurmas,
        ocupacao: ocupacaoMedia,
        totalEvasao: evadidos || 0,
      })

      setTurmasLotacao(turmasLotacaoData)

    } catch (error) {
      console.error('Erro ao carregar dados da unidade:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="h-screen flex items-center justify-center font-black text-2xl uppercase italic text-black bg-white">CARREGANDO...</div>
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard" className="text-xs border-2 border-black px-4 py-2 font-black italic uppercase bg-white hover:bg-black hover:text-white transition-all">
            ← VOLTAR
          </Link>
          <h1 className="text-3xl font-black border-l-8 border-black pl-4">
            📊 <span className="text-blue-600">{unidadeInfo.label}</span>
          </h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <CardStats titulo="Total de Alunos" valor={stats.totalAlunos} cor="text-blue-600" icone="👨‍🎓" />
          <CardStats titulo="Total de Turmas" valor={stats.totalTurmas} cor="text-emerald-600" icone="📚" />
          <CardStats titulo="Ocupação Média" valor={`${stats.ocupacao}%`} cor="text-purple-600" icone="📊" />
          <CardStats 
            titulo="Evasão" 
            valor={stats.totalEvasao} 
            cor={stats.totalEvasao > 5 ? 'text-red-600' : 'text-yellow-600'} 
            icone="⚠️" 
          />
        </div>

        <div className="grid grid-cols-1 gap-8">
          <GraficoOcupacao dados={turmasLotacao} titulo="Turmas da Unidade" />
        </div>
      </div>
    </div>
  )
}
