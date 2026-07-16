'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { UNIDADES } from '@/lib/constants'

export default function Menu() {
  const [turmas, setTurmas] = useState([])
  const [todosAlunos, setTodosAlunos] = useState([])
  const [contagemAlunos, setContagemAlunos] = useState({})
  const [loading, setLoading] = useState(true)
  const [mes, setMes] = useState(6)

  const mesesNomes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]

  const blocosTrimestrais = [
    { inicio: 0, nome: "Jan, Fev e Mar" },
    { inicio: 3, nome: "Abr, Mai e Jun" },
    { inicio: 6, nome: "Jul, Ago e Set" },
    { inicio: 9, nome: "Out, Nov e Dez" }
  ]

  useEffect(() => {
    fetchTurmas()
    fetchDadosGlobais()
  }, [mes])

  async function fetchTurmas() {
    const { data: tData } = await supabase.from('turmas').select('*')
    const { data: aData } = await supabase.from('alunos').select('turma_id')
    const contagem = {}
    aData?.forEach(a => { contagem[a.turma_id] = (contagem[a.turma_id] || 0) + 1 })
    setContagemAlunos(contagem)
    if (tData) setTurmas(tData.sort((a, b) => a.horario.localeCompare(b.horario)))
    setLoading(false)
  }

  async function fetchDadosGlobais() {
    const { data: alu } = await supabase.from('alunos').select('*')
    if (alu) setTodosAlunos(alu)
  }

  if (loading) {
    return <div className="h-screen flex items-center justify-center font-black text-2xl uppercase italic text-black bg-white">CARREGANDO...</div>
  }

  // Ícones e cores dos botões
  const menuItems = [
    { href: '/turmas', icon: '⚙', label: 'TURMAS', cor: 'bg-black hover:bg-gray-800' },
    { href: '/alunos', icon: '👤', label: 'ALUNOS', cor: 'bg-purple-600 hover:bg-purple-700' },
    { href: '/dashboard', icon: '📊', label: 'DASHBOARD', cor: 'bg-blue-600 hover:bg-blue-700' },
    { href: '/relatorios/frequencia', icon: '📊', label: 'RELATÓRIOS', cor: 'bg-amber-600 hover:bg-amber-700' },
    { href: '/previsao-evasao', icon: '🤖', label: 'EVASÃO', cor: 'bg-red-600 hover:bg-red-700' },
    { href: '/notificacoes', icon: '📱', label: 'NOTIFICAÇÕES', cor: 'bg-green-600 hover:bg-green-700' },
  ]

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-black uppercase">
      
      {/* TOPO */}
      <div className="bg-white border-b-4 border-black p-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-black border-l-8 border-black pl-4 italic tracking-tighter">
            CASA DA CULTURA <span className="text-blue-600">TRIMESTRAL</span>
          </h1>
          <div className="flex items-center gap-2 bg-white border-4 border-black p-2 shadow-[4px_4px_0px_#000]">
            <span className="text-[10px] font-black">BLOCO:</span>
            <select
              value={mes}
              onChange={e => setMes(Number(e.target.value))}
              className="bg-black text-white px-4 py-1 text-xs font-black italic outline-none cursor-pointer"
            >
              {blocosTrimestrais.map((b, i) => <option key={i} value={b.inicio}>{b.nome}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* MENU EM TABS */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${item.cor} text-white px-4 py-3 text-center text-xs border-4 border-black shadow-[4px_4px_0px_#000] transition-all hover:translate-y-[-2px]`}
            >
              <div className="text-lg">{item.icon}</div>
              <div className="font-black">{item.label}</div>
            </Link>
          ))}
        </div>

        {/* LINHA DIVISÓRIA */}
        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 border-t-2 border-black"></div>
          <span className="text-[10px] text-gray-400 tracking-widest">UNIDADES</span>
          <div className="flex-1 border-t-2 border-black"></div>
        </div>

        {/* BOTÕES DAS UNIDADES (TABS PEQUENAS) */}
        <div className="flex flex-wrap justify-center gap-2">
          {UNIDADES.map(u => (
            <a
              key={u.id}
              href={`#${u.id}`}
              className={`border-2 border-black px-4 py-1.5 text-xs font-black ${u.accent} bg-white hover:bg-black hover:text-white transition-all`}
            >
              {u.label}
            </a>
          ))}
        </div>

        {/* UNIDADES */}
        {UNIDADES.map((u, idx) => {
          const turmasDaUnidade = turmas.filter(t => (t.unidade || 'jardim_europa') === u.id)
          const turmaIdsUnidade = new Set(turmasDaUnidade.map(t => t.id))
          const alunosUnidade = todosAlunos.filter(a => turmaIdsUnidade.has(a.turma_id))

          const listaProfessoresUnidade = [...new Set(turmasDaUnidade.map(t => 
            t.oficina.toUpperCase().includes("PIANO") ? `MICHEL (PIANO)` : t.professor
          ))].sort()

          return (
            <div key={u.id} id={u.id} className="mt-10">
              {/* CABEÇALHO DA UNIDADE */}
              <div className={`flex items-center gap-3 border-l-8 ${u.accent} pl-4 mb-4`}>
                <h2 className="text-xl font-black italic tracking-tighter">{u.nome}</h2>
                <span className="text-xs font-bold text-gray-400">{alunosUnidade.length} alunos</span>
                <span className="text-xs font-bold text-gray-400">{turmasDaUnidade.length} turmas</span>
              </div>

              {/* PROFESSORES DA UNIDADE */}
              {listaProfessoresUnidade.length === 0 ? (
                <p className="text-xs text-gray-400 font-bold italic">
                  NENHUMA TURMA CADASTRADA NESTA UNIDADE AINDA.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {listaProfessoresUnidade.map(p => {
                    const isPiano = p === "MICHEL (PIANO)"
                    const turmasDoProfessor = turmasDaUnidade.filter(t => 
                      isPiano 
                        ? (t.professor === "MICHEL" && t.oficina.toUpperCase().includes("PIANO")) 
                        : (t.professor === p && !t.oficina.toUpperCase().includes("PIANO"))
                    )
                    const totalAlunos = turmasDoProfessor.reduce((acc, t) => acc + (contagemAlunos[t.id] || 0), 0)

                    return (
                      <Link
                        key={p}
                        href={`/lista?professor=${encodeURIComponent(p)}&unidade=${u.id}`}
                        className="border-2 border-black bg-white p-3 text-center shadow-[2px_2px_0px_#000] hover:translate-y-[-2px] transition-all font-black no-underline"
                      >
                        <div className="text-xs leading-tight">{p}</div>
                        <div className={`text-[10px] mt-1 font-bold ${u.txt}`}>
                          {totalAlunos} ALUNOS
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}

              {idx < UNIDADES.length - 1 && (
                <div className="border-t-2 border-dashed border-gray-300 my-10"></div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
