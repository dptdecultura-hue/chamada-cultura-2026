// src/app/(dashboard)/lista/page.js
'use client'

import { Suspense } from 'react'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { UNIDADES } from '@/lib/constants'
import { obterLimiteTurma, getStatusLotacao, formatarDiasTexto } from '@/lib/helpers'

// ════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL (COM SUSPENSE)
// ════════════════════════════════════════════════════════════
export default function ListaTurmas() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8FAFC] p-8 flex items-center justify-center">
        <div className="bg-white border-4 border-black p-8 max-w-md w-full shadow-[8px_8px_0px_#000] text-center">
          <h1 className="text-2xl font-black uppercase mb-4">⏳ Carregando...</h1>
          <p className="text-gray-500">Aguarde um momento</p>
        </div>
      </div>
    }>
      <ConteudoLista />
    </Suspense>
  )
}

// ════════════════════════════════════════════════════════════
// CONTEÚDO DA LISTA (COM useSearchParams)
// ════════════════════════════════════════════════════════════
function ConteudoLista() {
  const searchParams = useSearchParams()
  const professor = searchParams.get('professor')
  const unidadeId = searchParams.get('unidade')

  const [turmas, setTurmas] = useState([])
  const [contagemAlunos, setContagemAlunos] = useState({})
  const [loading, setLoading] = useState(true)

  const unidadeAtual = UNIDADES.find(u => u.id === unidadeId) || UNIDADES[0]

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

  if (loading) {
    return <div className="h-screen flex items-center justify-center font-black text-2xl uppercase italic text-black bg-white">CARREGANDO...</div>
  }

  // Filtrar turmas do professor
  const turmasDoProf = turmas.filter(t => {
    const mesmaUnidade = (t.unidade || 'jardim_europa') === unidadeId
    const mesmoProfessor = t.professor === professor
    return mesmaUnidade && mesmoProfessor
  })

  // Se não encontrar turmas
  if (turmasDoProf.length === 0) {
    return (
      <div className="min-h-screen p-8 max-w-6xl mx-auto">
        <Link href="/menu" className="text-xs mb-4 border-2 border-black px-2 py-1 font-bold italic bg-gray-50 uppercase inline-block">
          ← VOLTAR
        </Link>
        <div className="text-center py-16">
          <p className="text-2xl font-black italic text-gray-400">NENHUMA TURMA ENCONTRADA</p>
          <p className="text-sm text-gray-400 mt-2">Para o professor {professor} na unidade {unidadeAtual.nome}</p>
        </div>
      </div>
    )
  }

  // Agrupar por dia
  const gruposPorDia = {}
  turmasDoProf.forEach(t => {
    const diasArr = Array.isArray(t.dias) ? [...t.dias].map(Number).filter(n => !isNaN(n)).sort((a, b) => a - b) : []
    const chave = diasArr.join(',')
    if (!gruposPorDia[chave]) gruposPorDia[chave] = []
    gruposPorDia[chave].push(t)
  })

  const gruposOrdenados = Object.entries(gruposPorDia).sort(([chaveA], [chaveB]) => {
    const primeiroA = Number(chaveA.split(',')[0])
    const primeiroB = Number(chaveB.split(',')[0])
    return (isNaN(primeiroA) ? 99 : primeiroA) - (isNaN(primeiroB) ? 99 : primeiroB)
  })

  const coresGrupo = ['bg-blue-600', 'bg-red-600', 'bg-emerald-600', 'bg-purple-600', 'bg-orange-600', 'bg-pink-600']

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto italic font-black uppercase">
      <Link href="/menu" className="text-xs mb-4 border-2 border-black px-2 py-1 font-bold italic bg-gray-50 uppercase inline-block no-underline">
        ← VOLTAR
      </Link>
      <p className={`text-xs mb-2 font-bold italic ${unidadeAtual.txt}`}>{unidadeAtual.nome}</p>
      <h2 className="text-6xl mb-12 border-b-8 border-black pb-4 tracking-tighter uppercase font-black">{professor}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {gruposOrdenados.map(([chave, turmasGrupo], i) => {
          const diasArr = chave.split(',').map(Number).filter(n => !isNaN(n))
          const label = formatarDiasTexto(diasArr)
          const cor = coresGrupo[i % coresGrupo.length]
          return (
            <div key={chave || `sem-dia-${i}`}>
              <h3 className={`p-3 mb-6 text-center border-4 border-black ${cor} text-white shadow-[4px_4px_0px_#000] font-black`}>{label}</h3>
              <div className="space-y-4">
                {turmasGrupo.map(c => {
                  const n = contagemAlunos[c.id] || 0
                  const limit = obterLimiteTurma(c)
                  const status = getStatusLotacao(n, limit)

                  return (
                    <Link
                      key={c.id}
                      href={`/chamada/${c.id}`}
                      className={`bg-white border-4 p-4 cursor-pointer shadow-[6px_6px_0px_#000] flex justify-between items-center hover:translate-y-[-2px] transition-all no-underline ${status.bg}`}
                    >
                      <div>
                        <span className="text-2xl block leading-none font-black">{c.horario}</span>
                        <span className="text-[10px] text-gray-400 font-bold italic">{c.oficina}</span>
                      </div>
                      <div className="text-right font-black italic">
                        <span className={`text-lg ${status.cor}`}>{status.icone} {n} / {limit}</span>
                        <span className="block text-[10px] text-gray-400">{Math.round((n/limit)*100)}% - {status.label}</span>
                      </div>
                    </Link>
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
