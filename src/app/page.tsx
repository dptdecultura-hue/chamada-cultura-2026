'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function CasaDaCulturaPage() {
  const [tela, setTela] = useState('menu')
  const [profSel, setProfSel] = useState("")
  const [idAtivo, setIdAtivo] = useState<string | null>(null)
  const [mes, setMes] = useState(new Date().getMonth())
  const [turmas, setTurmas] = useState<any[]>([])
  const [alunosLocais, setAlunosLocais] = useState<any[]>([])
  const [presencas, setPresencas] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [contagemAlunos, setContagemAlunos] = useState<any>({})
  const [linhasExtras, setLinhasExtras] = useState(0)
  const [busca, setBusca] = useState("")

  const mesesNomes = ["JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"]

  const obterLimiteOficina = (oficina: string) => {
    const o = oficina?.toUpperCase() || ""
    if (o.includes("PIANO")) return 2
    if (o.includes("PERCUSSÃO") || o.includes("BATERIA")) return 10
    if (o.includes("VIOLÃO") || o.includes("CANTO")) return 15
    if (o.includes("VIOLINO")) return 10
    if (o.includes("VIOLA") || o.includes("VIOLONCELO")) return 3
    if (o.includes("FLAUTA DOCE")) return 10
    return 15 
  }

  useEffect(() => { fetchTurmas() }, [])
  useEffect(() => { if (idAtivo) { fetchDados(); setLinhasExtras(0); } }, [idAtivo, mes])

  async function fetchTurmas() {
    const { data: tData } = await supabase.from('turmas').select('*')
    const { data: aData } = await supabase.from('alunos').select('turma_id')
    const contagem: any = {}
    aData?.forEach(a => { contagem[a.turma_id] = (contagem[a.turma_id] || 0) + 1 })
    setContagemAlunos(contagem)
    if (tData) setTurmas(tData.sort((a, b) => a.horario.localeCompare(b.horario)))
    setLoading(false)
  }

  async function fetchDados() {
    const { data: alData } = await supabase.from('alunos').select('*').eq('turma_id', idAtivo).order('posicao', { ascending: true })
    const { data: preData } = await supabase.from('frequencia').select('*').eq('turma_id', idAtivo).eq('mes', mes)
    setAlunosLocais(alData || [])
    const gridPre: any = {}
    preData?.forEach(p => {
      if(!gridPre[p.aluno_posicao]) gridPre[p.aluno_posicao] = {}
      gridPre[p.aluno_posicao][p.data_aula] = p.status
    })
    setPresencas(gridPre)
  }

  const salvarAlunoNoBanco = async (index: number, idReal: string | null, campos: any) => {
    const { data } = await supabase.from('alunos').upsert({ 
      id: idReal || undefined, 
      turma_id: idAtivo, 
      posicao: index,
      ...campos 
    }).select()
    if (data && !idReal) { fetchDados(); fetchTurmas(); }
  }

  const mudarTurmaFacil = async (aluno: any) => {
    const listaOpcoes = turmas.map((t, i) => `${i} - ${t.professor} (${t.oficina} ${t.horario})`).join('\n')
    const escolha = prompt(`PARA ONDE DESEJA MOVER ${aluno.nome}?\n\nDigite o NÚMERO da opção:\n${listaOpcoes}`)
    if (escolha !== null && turmas[parseInt(escolha)]) {
      const novaTurma = turmas[parseInt(escolha)]
      if (confirm(`Confirmar transferência para: ${novaTurma.professor}?`)) {
        await supabase.from('alunos').update({ turma_id: novaTurma.id }).eq('id', aluno.id)
        await supabase.from('frequencia').update({ turma_id: novaTurma.id }).eq('aluno_posicao', aluno.posicao).eq('turma_id', idAtivo)
        fetchDados(); fetchTurmas();
        alert("Feito!");
      }
    }
  }

  const alternarPresenca = async (alunoPos: number, dataAula: string) => {
    const atual = presencas[alunoPos]?.[dataAula] || ""
    let novoStatus = (atual === "") ? "P" : (atual === "P") ? "F" : ""
    setPresencas((prev: any) => ({ ...prev, [alunoPos]: { ...(prev[alunoPos] || {}), [dataAula]: novoStatus } }))
    if (novoStatus === "") {
      await supabase.from('frequencia').delete().match({ turma_id: idAtivo, mes, aluno_posicao: alunoPos, data_aula: dataAula })
    } else {
      await supabase.from('frequencia').upsert({ turma_id: idAtivo, mes, aluno_posicao: alunoPos, data_aula: dataAula, status: novoStatus })
    }
  }

  const getDatasDoMes = (diasSemanaInput: any) => {
    const datas = []
    const diasLimpos = String(diasSemanaInput).replace(/[^0-9,]/g, '')
    const diasSemana = diasLimpos.split(',').map(Number)
    const ultimoDia = new Date(2026, mes + 1, 0).getDate()
    for (let d = 1; d <= ultimoDia; d++) {
      const dataProd = new Date(2026, mes, d)
      if (diasSemana.includes(dataProd.getDay())) {
        datas.push(`${d < 10 ? '0'+d : d}/${mes+1 < 10 ? '0'+(mes+1) : mes+1}`)
      }
    }
    return datas.slice(0, 10)
  }

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-2xl animate-pulse italic uppercase">Carregando...</div>

  // --- TELA 1: MENU ---
  if (tela === 'menu') return (
    <div className="min-h-screen p-8 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <h1 className="text-4xl font-black border-l-8 border-black pl-6 uppercase italic tracking-tighter">CASA DA CULTURA <span className="text-blue-600">2026</span></h1>
          <input 
            type="text" 
            placeholder="BUSCAR ALUNO..." 
            className="border-4 border-black p-3 font-black italic uppercase outline-none shadow-[4px_4px_0px_#000] w-full md:w-80"
            onChange={(e) => setBusca(e.target.value.toUpperCase())}
          />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[...new Set(turmas.map(t => t.professor))].sort().map(p => {
            const totalProf = turmas.filter(t => t.professor === p).reduce((acc, t) => acc + (contagemAlunos[t.id] || 0), 0)
            return (
              <button key={p} onClick={() => {setProfSel(p); setTela('lista');}} 
                className="bg-white border-2 border-black p-8 font-black text-sm uppercase flex flex-col items-center shadow-[4px_4px_0px_#000] hover:translate-y-[-2px] transition-all">
                {p} <span className="text-[10px] text-blue-600 mt-2 font-bold italic tracking-widest">{totalProf} ALUNOS</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )

  // --- TELA 2: LISTA ---
  if (tela === 'lista') {
    const turmasDoProf = turmas.filter(t => t.professor === profSel)
    return (
      <div className="min-h-screen p-8 max-w-6xl mx-auto italic uppercase font-black">
        <button onClick={() => setTela('menu')} className="text-xs border-b-2 border-black tracking-widest mb-12 block">← VOLTAR AO MENU</button>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {['1', '2'].map(dia => (
            <div key={dia}>
              <h3 className="bg-black text-white p-2 mb-6 text-sm text-center uppercase tracking-widest">{dia === '1' ? 'SEGUNDA E QUARTA' : 'TERÇA E QUINTA'}</h3>
              <div className="space-y-4">
                {turmasDoProf.filter(t => String(t.dias).includes(dia)).map(c => {
                   const nAlunos = contagemAlunos[c.id] || 0
                   const limite = obterLimiteOficina(c.oficina)
                   return (
                     <div key={c.id} onClick={() => {setIdAtivo(c.id); setTela('chamada');}} className="cursor-pointer bg-white border-2 border-black p-4 shadow-[4px_4px_0px_#000] flex justify-between items-center hover:scale-[1.02] transition-all">
                       <div><span className="text-2xl italic">{c.horario}</span><br /><span className="text-[10px] text-gray-400">{c.oficina}</span></div>
                       <span className={`text-xl ${nAlunos >= limite ? 'text-red-600' : 'text-black'}`}>{nAlunos}/{limite}</span>
                     </div>
                   )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // --- TELA 3: CHAMADA ---
  const cursoAtivo = turmas.find(c => c.id === idAtivo)
  if (!cursoAtivo) return null
  const datasAulas = getDatasDoMes(cursoAtivo.dias)
  const todasAsLinhas = [...alunosLocais];
  for(let i = 0; i < linhasExtras; i++) { todasAsLinhas.push({ nome: "", posicao: alunosLocais.length + i, id: null, naipe: "" }); }

  return (
    <div className="min-h-screen bg-white">
      <style>{`
        @media print { 
          .no-print { display: none !important; } 
          .print-area { width: 100% !important; margin: 0 !important; } 
        }
      `}</style>
      <nav className="no-print bg-white border-b-2 border-black p-4 sticky top-0 z-50 flex justify-between items-center px-8">
        <button onClick={()=>setTela('lista')} className="font-black text-xs border-2 border-black px-4 py-1">← VOLTAR</button>
        <div className="flex gap-4">
          <button onClick={() => setLinhasExtras(prev => prev + 1)} className="bg-blue-600 text-white px-4 py-2 text-[10px] font-black uppercase">Linha +</button>
          <select value={mes} onChange={e => setMes(Number(e.target.value))} className="border-2 border-black font-black p-1 text-xs uppercase">{mesesNomes.map((m,i)=><option key={i} value={i}>{m}</option>)}</select>
          <button onClick={()=>window.print()} className="bg-black text-white px-4 py-2 text-[10px] font-black shadow-[3px_3px_0px_#000]">Imprimir</button>
        </div>
      </nav>

      <div className="print-area max-w-[1200px] mx-auto p-8 italic font-black uppercase">
        <header className="flex justify-between items-end mb-8 border-b-[6px] border-black pb-4">
          <div><h1 className="text-4xl leading-none">{cursoAtivo.professor}</h1><div className="text-[11px] mt-2">{cursoAtivo.oficina} — {cursoAtivo.horario}</div></div>
          <div className="text-5xl">{mesesNomes[mes]}</div>
        </header>

        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border-2 border-black p-1 text-[9px] w-8">Nº</th>
              <th className="border-2 border-black p-1 text-[9px] w-12">NAIPE</th>
              <th className="border-2 border-black p-1 text-[9px] text-left pl-4">Nome do Aluno</th>
              {datasAulas.map(dt => <th key={dt} className="w-12 border-2 border-black p-1 text-[9px]">{dt}</th>)}
              <th className="no-print w-12 border-2 border-black p-1 text-[9px] bg-red-50">FALTAS</th>
              <th className="no-print w-10 border-2 border-black p-1 text-[9px]">MOVER</th>
            </tr>
          </thead>
          <tbody>
            {todasAsLinhas.map((aluno, i) => {
              const numFaltas = Object.values(presencas[i] || {}).filter(v => v === "F").length
              return (
                <tr key={i} className="h-10">
                  <td className="border-2 border-black text-center text-[10px]">{i+1}</td>
                  <td className="border-2 border-black">
                    <input className="w-full text-center border-none outline-none text-[10px] font-black uppercase bg-gray-50" placeholder="-" defaultValue={aluno.naipe} onBlur={(e)=>salvarAlunoNoBanco(i, aluno.id, {naipe: e.target.value.toUpperCase()})} />
                  </td>
                  <td className="border-2 border-black px-4">
                    <input className="w-full border-none outline-none text-[12px] bg-transparent font-black uppercase" defaultValue={aluno.nome} onBlur={(e)=>salvarAlunoNoBanco(i, aluno.id, {nome: e.target.value.toUpperCase()})} />
                  </td>
                  {datasAulas.map(dt => <td key={dt} onClick={()=>alternarPresenca(i, dt)} className="border-2 border-black text-center text-xl cursor-pointer select-none">{presencas[i]?.[dt]}</td>)}
                  <td className="no-print border-2 border-black text-center font-black text-red-600 bg-red-50 text-xs">{numFaltas || ""}</td>
                  <td className="no-print border-2 border-black text-center">
                    <button onClick={() => mudarTurmaFacil(aluno)} className="text-sm text-blue-500 font-black">⇄</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}