// src/app/(dashboard)/dashboard/page.js
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Loading from '@/components/ui/Loading'
import { obterLimiteOficina } from '@/lib/helpers'

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
    ocupacaoGeral: 0,
    totalEvasao: 0,
    variacaoAlunos: 0,
    variacaoTurmas: 0,
    variacaoOcupacao: 0,
  })
  const [unidadesResumo, setUnidadesResumo] = useState([])
  const [cursosOcupacao, setCursosOcupacao] = useState([])
  const [alertas, setAlertas] = useState([])
  const [evasaoMensal, setEvasaoMensal] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    setLoading(true)

    try {
      // 1. Dados básicos
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

      // 2. Turmas e alunos para ocupação
      const { data: turmasData } = await supabase
        .from('turmas')
        .select('id, oficina, horario, limite_personalizado, unidade, professor')
      
      const { data: alunosData } = await supabase
        .from('alunos')
        .select('turma_id, unidade, curso')

      // 3. Evasão mensal
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

      // 4. Ocupação por turma
      const ocupacaoPorTurma = turmasData?.map(turma => {
        const alunosNaTurma = alunosData?.filter(a => a.turma_id === turma.id).length || 0
        const limite = turma.limite_personalizado || obterLimiteOficina(turma.oficina) || 15
        return {
          ...turma,
          alunos: alunosNaTurma,
          limite: limite,
          percentual: Math.round((alunosNaTurma / limite) * 100)
        }
      }) || []

      // 5. Ocupação por curso (agrupado)
      const cursosMap = {}
      ocupacaoPorTurma.forEach(t => {
        const nome = t.oficina || 'N/A'
        if (!cursosMap[nome]) {
          cursosMap[nome] = {
            nome,
            totalAlunos: 0,
            totalTurmas: 0,
            capacidadeTotal: 0,
            limitePorTurma: obterLimiteOficina(nome) || 15,
            unidade: t.unidade,
            professor: t.professor
          }
        }
        cursosMap[nome].totalAlunos += t.alunos
        cursosMap[nome].totalTurmas += 1
        cursosMap[nome].capacidadeTotal += t.limite
      })

      const cursosOcupacaoData = Object.values(cursosMap).map(curso => {
        const ocupacao = curso.capacidadeTotal > 0 
          ? Math.round((curso.totalAlunos / curso.capacidadeTotal) * 100) 
          : 0
        return { ...curso, ocupacao }
      }).sort((a, b) => b.ocupacao - a.ocupacao)

      // 6. Resumo por unidade
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

      // 7. Alertas
      const alertasData = ocupacaoPorTurma.filter(t => t.percentual >= 90 || t.percentual <= 20)

      // 8. Estatísticas gerais
      const ocupacaoGeral = ocupacaoPorTurma.length > 0
        ? Math.round(ocupacaoPorTurma.reduce((acc, t) => acc + t.percentual, 0) / ocupacaoPorTurma.length)
        : 0

      setStats({
        totalAlunos: totalAlunos || 0,
        totalTurmas: totalTurmas || 0,
        ocupacaoGeral,
        totalEvasao: evadidos || 0,
        variacaoAlunos: 12,
        variacaoTurmas: 3,
        variacaoOcupacao: 5,
      })

      setUnidadesResumo(unidadesResumoData)
      setCursosOcupacao(cursosOcupacaoData)
      setAlertas(alertasData)
      setEvasaoMensal(evasaoMensalData)

    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <Loading mensagem="Carregando painel de gestão..." />
  }

  // Função para determinar cor e ação com base na ocupação
  const getStatusCurso = (ocupacao) => {
    if (ocupacao >= 95) return { cor: 'text-red-600', bg: 'bg-red-50', status: '🔴 LOTADO', action: 'Abrir nova turma' }
    if (ocupacao >= 80) return { cor: 'text-yellow-600', bg: 'bg-yellow-50', status: '🟡 ATENÇÃO', action: 'Monitorar' }
    if (ocupacao >= 60) return { cor: 'text-blue-600', bg: 'bg-blue-50', status: '🔵 OK', action: 'Manter' }
    return { cor: 'text-green-600', bg: 'bg-green-50', status: '🟢 BAIXA', action: 'Ocupar vagas' }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/menu" className="text-xs border-2 border-black px-4 py-2 font-black italic uppercase bg-white hover:bg-black hover:text-white transition-all">
              ← VOLTAR
            </Link>
            <h1 className="text-3xl font-black border-l-8 border-black pl-4">
              📊 PAINEL DE <span className="text-blue-600">GESTÃO</span>
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

        {/* Cards de KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#000]">
            <div className="text-3xl font-black text-blue-600">{stats.totalAlunos}</div>
            <div className="text-[10px] font-black uppercase">👨‍🎓 Alunos</div>
            <div className="text-xs text-green-600 font-bold">▲ {stats.variacaoAlunos}%</div>
          </div>
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#000]">
            <div className="text-3xl font-black text-emerald-600">{stats.totalTurmas}</div>
            <div className="text-[10px] font-black uppercase">📚 Turmas</div>
            <div className="text-xs text-green-600 font-bold">▲ {stats.variacaoTurmas}%</div>
          </div>
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#000]">
            <div className="text-3xl font-black text-purple-600">{stats.ocupacaoGeral}%</div>
            <div className="text-[10px] font-black uppercase">📊 Ocupação</div>
            <div className="text-xs text-green-600 font-bold">▲ {stats.variacaoOcupacao}%</div>
          </div>
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#000]">
            <div className={`text-3xl font-black ${stats.totalEvasao > 10 ? 'text-red-600' : 'text-yellow-600'}`}>
              {stats.totalEvasao}
            </div>
            <div className="text-[10px] font-black uppercase">⚠️ Evasão</div>
            <div className="text-xs text-gray-400 font-bold">▲ 2%</div>
          </div>
        </div>

        {/* Top 5 Cursos por OCUPAÇÃO */}
        <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0px_#000] mb-8">
          <h2 className="text-xl font-black uppercase mb-4">🏆 Cursos - Ocupação Real</h2>
          <div className="space-y-4">
            {cursosOcupacao.slice(0, 5).map((curso, index) => {
              const status = getStatusCurso(curso.ocupacao)
              return (
                <div key={index} className={`border-2 border-black p-4 ${status.bg}`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-black">#{index + 1}</span>
                        <span className="font-black text-lg">{curso.nome}</span>
                        <span className={`text-xs font-bold ${status.cor}`}>{status.status}</span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm mt-1">
                        <span>👨‍🎓 {curso.totalAlunos} alunos</span>
                        <span>📚 {curso.totalTurmas} turmas</span>
                        <span>🎯 {curso.limitePorTurma} por turma</span>
                        <span className="text-gray-400">Capacidade: {curso.capacidadeTotal}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32">
                        <div className="flex justify-between text-xs font-bold">
                          <span>{curso.ocupacao}%</span>
                        </div>
                        <div className="w-full h-4 bg-gray-200 border border-black">
                          <div 
                            className={`h-full ${curso.ocupacao >= 90 ? 'bg-red-500' : curso.ocupacao >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min(curso.ocupacao, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-xs font-black text-gray-500 min-w-[80px]">
                        {status.action}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Resumo por Unidade */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {unidadesResumo.map((unidade, index) => (
            <Link
              key={index}
              href={`/dashboard/${unidade.id}`}
              className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#000] hover:translate-y-[-2px] transition-all"
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

        {/* Evasão Mensal */}
        <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0px_#000] mb-8">
          <h2 className="text-xl font-black uppercase mb-4">📈 Evolução da Evasão</h2>
          <div className="flex items-end h-48 gap-2">
            {evasaoMensal.map((item, index) => {
              const maxValor = Math.max(...evasaoMensal.map(d => d.total), 1)
              const altura = Math.max(10, (item.total / maxValor) * 100)
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-red-500 rounded-t"
                    style={{ height: `${altura}%`, minHeight: '10px' }}
                  ></div>
                  <div className="text-[10px] font-black mt-1">{item.mes}</div>
                  <div className="text-[8px] font-bold text-gray-500">{item.total}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Alertas */}
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
                      <span className="text-xs text-gray-400 ml-2">({turma.professor})</span>
                    </div>
                    <div>
                      <span className={`font-black ${isLotada ? 'text-red-600' : 'text-yellow-600'}`}>
                        {isLotada ? '🔴 LOTADA' : '🟡 POUCOS ALUNOS'}
                      </span>
                      <span className="text-sm ml-2">{turma.alunos}/{turma.limite}</span>
                      <span className="text-sm ml-2 text-gray-400">({turma.percentual}%)</span>
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
