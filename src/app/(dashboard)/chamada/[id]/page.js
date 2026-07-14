'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { UNIDADES, MESES_NOMES, BLOCOS_TRIMESTRAIS } from '@/lib/constants'
import { obterLimiteTurma, formatarDiasTexto, detectarGenero } from '@/lib/helpers'

// Caminhos locais apontando para a sua pasta public
const URL_LOGO_PREFEITURA = "/logo-prefeitura.png.jpeg";
const URL_LOGO_CULTURA = "/logo-casa-cultura.png";

export default function Chamada() {
  const params = useParams()
  const searchParams = useSearchParams()
  const idAtivo = params.id

  // Pegar parâmetros da URL para voltar corretamente
  const professor = searchParams.get('professor') || ''
  const unidade = searchParams.get('unidade') || 'jardim_europa'

  const [mes, setMes] = useState(6)
  const [turmas, setTurmas] = useState([])
  const [curso, setCurso] = useState(null)
  const [alunosLocais, setAlunosLocais] = useState([])
  const [presencas, setPresencas] = useState({})
  const [loading, setLoading] = useState(true)
  const [numLinhas, setNumLinhas] = useState(10)

  // Estados do modal de exclusão
  const [alunoParaExcluir, setAlunoParaExcluir] = useState(null)
  const [mostrarModalExcluir, setMostrarModalExcluir] = useState(false)

  useEffect(() => {
    fetchTurmas()
    fetchDadosGlobais()
  }, [mes])

  useEffect(() => {
    if (idAtivo) fetchDados()
  }, [idAtivo, mes])

  async function fetchTurmas() {
    const { data: tData } = await supabase.from('turmas').select('*')
    if (tData) {
      setTurmas(tData.sort((a, b) => a.horario.localeCompare(b.horario)))
      const cursoEncontrado = tData.find(t => t.id === idAtivo)
      setCurso(cursoEncontrado)
    }
    setLoading(false)
  }

  async function fetchDadosGlobais() {
    // Não precisa mais buscar dados globais para esta tela
  }

  async function fetchDados() {
    const mes2 = (mes + 1) % 12
    const mes3 = (mes + 2) % 12
    const { data: alData } = await supabase
      .from('alunos')
      .select('*')
      .eq('turma_id', idAtivo)
      .order('posicao', { ascending: true })
    
    const { data: preData } = await supabase
      .from('frequencia')
      .select('*')
      .eq('turma_id', idAtivo)
      .in('mes', [mes, mes2, mes3])

    if (alData) setAlunosLocais(alData)

    const gridPre = {}
    preData?.forEach(p => {
      if (p.aluno_id) {
        if (!gridPre[p.aluno_id]) gridPre[p.aluno_id] = {}
        gridPre[p.aluno_id][p.data_aula] = p.status
      }
    })
    setPresencas(gridPre)
  }

  async function salvarAlunoNoBanco(index) {
    const aluno = alunosLocais[index]
    if (!aluno?.nome || aluno.nome.trim() === "") return null
    const payload = {
      turma_id: idAtivo,
      nome: aluno.nome.trim().toUpperCase(),
      telefone: aluno.telefone || "",
      genero: detectarGenero(aluno.nome),
      posicao: index
    }
    if (aluno.id) {
      await supabase.from('alunos').update(payload).eq('id', aluno.id)
      return aluno.id
    } else {
      const { data: novo } = await supabase.from('alunos').insert(payload).select()
      if (novo && novo[0]) {
        const n = [...alunosLocais]
        n[index].id = novo[0].id
        setAlunosLocais(n)
        return novo[0].id
      }
    }
    return null
  }

  async function alternarPresenca(index, dataAula, mesDaAula) {
    let aId = alunosLocais[index].id
    if (!aId) aId = await salvarAlunoNoBanco(index)
    if (!aId) return
    const constAtual = presencas[aId]?.[dataAula] || ""
    let novoStatus = (constAtual === "") ? "P" : (constAtual === "P") ? "F" : (constAtual === "F") ? "J" : ""
    setPresencas((p) => ({ ...p, [aId]: { ...(p[aId] || {}), [dataAula]: novoStatus } }))
    if (novoStatus === "") {
      await supabase.from('frequencia').delete().eq('aluno_id', aId).eq('data_aula', dataAula).eq('mes', mesDaAula)
    } else {
      await supabase.from('frequencia').upsert({ 
        aluno_id: aId, 
        turma_id: idAtivo, 
        data_aula: dataAula, 
        mes: mesDaAula, 
        status: novoStatus 
      })
    }
  }

  // Excluir aluno
  function confirmarExcluirAluno(index) {
    const aluno = alunosLocais[index]
    if (!aluno || !aluno.nome) return
    setAlunoParaExcluir({ index, aluno })
    setMostrarModalExcluir(true)
  }

  async function executarExclusaoAluno() {
    if (!alunoParaExcluir) return
    const { index, aluno } = alunoParaExcluir

    try {
      if (aluno.id) {
        await supabase.from('frequencia').delete().eq('aluno_id', aluno.id)
        await supabase.from('alunos').delete().eq('id', aluno.id)
      }
      const novosAlunos = [...alunosLocais]
      novosAlunos.splice(index, 1)
      novosAlunos.forEach((a, i) => { a.posicao = i })
      setAlunosLocais(novosAlunos)
      setMostrarModalExcluir(false)
      setAlunoParaExcluir(null)
    } catch (error) {
      console.error('Erro ao excluir aluno:', error)
      alert('❌ Erro ao excluir aluno. Tente novamente.')
    }
  }

  if (loading) {
    return <div className="h-screen flex items-center justify-center font-black text-2xl uppercase italic text-black bg-white">CARREGANDO...</div>
  }

  // Pegar a unidade do curso
  const unidadeInfo = UNIDADES.find(u => u.id === (curso?.unidade || 'jardim_europa')) || UNIDADES[0]

  // Dias da semana do curso
  const diasArrCurso = Array.isArray(curso?.dias) ? curso.dias.map(Number).filter(n => !isNaN(n)) : []
  const diasTexto = formatarDiasTexto(diasArrCurso)

  // Gerar datas do trimestre
  const mes2 = (mes + 1) % 12
  const mes3 = (mes + 2) % 12

  function getDatasParaMes(mesAlvo) {
    const diasAlvo = diasArrCurso
    const datas = []
    const ultimoDia = new Date(2026, mesAlvo + 1, 0).getDate()
    for (let d = 1; d <= ultimoDia; d++) {
      const dataProd = new Date(2026, mesAlvo, d)
      if (diasAlvo.includes(dataProd.getDay())) {
        datas.push({
          formatada: `${d < 10 ? '0' + d : d}/${mesAlvo + 1 < 10 ? '0' + (mesAlvo + 1) : mesAlvo + 1}`,
          diaPuro: `${d < 10 ? '0' + d : d}`,
          mesPuro: mesAlvo
        })
      }
    }
    return datas
  }

  const datasMes1 = getDatasParaMes(mes)
  const datasMes2 = getDatasParaMes(mes2)
  const datasMes3 = getDatasParaMes(mes3)
  const todasDatasTrimestral = [...datasMes1, ...datasMes2, ...datasMes3]

  // Construir URL de voltar com os parâmetros corretos
  const voltarUrl = `/lista?professor=${encodeURIComponent(professor || curso?.professor || '')}&unidade=${encodeURIComponent(unidade || curso?.unidade || 'jardim_europa')}`

  return (
    <div className="min-h-screen font-sans uppercase bg-[#fff] text-black w-full antialiased">
      <title>CASA DA CULTURA 2026</title>

      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 5mm 6mm 4mm 6mm;
          }
          .no-print { display: none !important; }
          body {
            background: #fff !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .folha-container {
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .tabela-wrapper {
            overflow: visible !important;
          }
          table {
            width: 100% !important;
            table-layout: fixed !important;
          }
        }
        @media screen {
          .tabela-wrapper {
            overflow-x: auto;
            max-width: 100%;
            border-bottom: 2.5px solid #000;
          }
        }
      `}</style>

      {/* Controle Superior */}
      <nav className="no-print bg-slate-900 border-b-4 border-black p-4 sticky top-0 z-50 flex justify-between items-center px-8 shadow-md">
        <Link 
          href={voltarUrl}
          className="text-xs border-2 border-white px-4 py-1.5 bg-transparent text-white font-black italic uppercase hover:bg-white hover:text-black transition-all no-underline"
        >
          ← VOLTAR
        </Link>
        <div className="flex gap-4 items-center flex-wrap">
          <button 
            onClick={() => setAlunosLocais([...alunosLocais, { nome: "", telefone: "", posicao: alunosLocais.length, id: null }])} 
            className="bg-emerald-600 text-white px-4 py-1.5 text-[11px] border-2 border-black font-black italic hover:bg-emerald-500 transition-all"
          >
            NOVO ALUNO +
          </button>
          <div className="flex items-center bg-gray-800 text-gray-300 border-2 border-black text-[11px] font-black italic overflow-hidden">
            <button onClick={() => setNumLinhas(n => Math.max(1, n - 1))} className="px-3 py-1.5 hover:bg-red-700 transition-all select-none">−</button>
            <span className="px-3 py-1.5 border-x-2 border-black">{numLinhas} LINHAS</span>
            <button onClick={() => setNumLinhas(n => n + 1)} className="px-3 py-1.5 hover:bg-green-700 transition-all select-none">+</button>
          </div>
          <select 
            value={mes} 
            onChange={e => setMes(Number(e.target.value))} 
            className="border-2 border-black p-1 text-xs font-black bg-white text-black italic uppercase cursor-pointer"
          >
            {BLOCOS_TRIMESTRAIS.map((b, i) => <option key={i} value={b.inicio}>{b.nome}</option>)}
          </select>
          <button 
            onClick={() => window.print()} 
            className="bg-blue-600 text-white px-6 py-1.5 text-[11px] border-2 border-black font-black italic hover:bg-blue-500 transition-all shadow-[2px_2px_0px_#000]"
          >
            IMPRIMIR PAUTA
          </button>
        </div>
      </nav>

      {/* Modal de Confirmação de Exclusão */}
      {mostrarModalExcluir && alunoParaExcluir && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white border-4 border-black p-6 max-w-md w-full shadow-[8px_8px_0px_#000]">
            <h3 className="text-xl font-black uppercase mb-4">⚠️ Confirmar Exclusão</h3>
            <p className="text-sm mb-2">Tem certeza que deseja excluir o aluno:</p>
            <p className="text-lg font-black text-red-600 mb-4">{alunoParaExcluir.aluno.nome}</p>
            <div className="text-xs text-gray-500 mb-4">
              • Todas as frequências serão removidas<br />
              • Esta ação não pode ser desfeita
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setMostrarModalExcluir(false); setAlunoParaExcluir(null); }}
                className="flex-1 bg-gray-200 px-4 py-2 text-sm font-black uppercase border-2 border-black hover:bg-gray-300 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={executarExclusaoAluno}
                className="flex-1 bg-red-600 text-white px-4 py-2 text-sm font-black uppercase border-2 border-black hover:bg-red-500 transition-all"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Folha de Chamada */}
      <div className="folha-container w-full" style={{ padding: "2px 0", margin: "0 auto" }}>
        <div style={{ border: "2.5px solid #000", backgroundColor: "#fff" }} className="mx-1 md:mx-2">

          {/* Cabeçalho */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", backgroundColor: "#fff", height: "76px", borderBottom: "2.5px solid #000" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", borderRight: "2.5px solid #000", padding: "4px" }}>
              <img src={URL_LOGO_PREFEITURA} alt="Prefeitura" style={{ height: "66px", maxWidth: "95%", objectFit: "contain" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4px" }}>
              <img src={URL_LOGO_CULTURA} alt="Casa da Cultura" style={{ height: "66px", maxWidth: "95%", objectFit: "contain" }} />
            </div>
          </div>

          {/* Dados Institucionais */}
          <table className="w-full border-collapse text-[11px] font-bold italic" style={{ borderSpacing: 0, tableLayout: 'fixed' }}>
            <tbody>
              <tr>
                <td style={{ borderRight: "2.5px solid #000", padding: "5px 10px", backgroundColor: "#fff" }} className="w-1/2">
                  OFICINEIRO (A)/ PROFESSOR (A): <span className="font-black text-black">{curso?.professor}</span>
                </td>
                <td style={{ padding: "5px 10px", backgroundColor: "#fff" }} className="w-1/2">
                  CURSO: <span className="font-black text-black">{curso?.oficina}</span>
                </td>
              </tr>
              <tr>
                <td style={{ borderTop: "2px solid #000", borderRight: "2.5px solid #000", padding: "5px 10px", backgroundColor: "#fff" }}>
                  DIAS DA SEMANA: <span className="font-black text-black">{diasTexto}</span>
                </td>
                <td style={{ borderTop: "2px solid #000", padding: "5px 10px", backgroundColor: "#fff" }}>
                  HORÁRIO: <span className="font-black text-black">{curso?.horario}</span>
                </td>
              </tr>
              <tr>
                <td style={{ borderTop: "2px solid #000", borderRight: "2.5px solid #000", padding: "5px 10px", backgroundColor: "#fff" }} className="text-gray-500">
                  {unidadeInfo.nome.toUpperCase()}
                </td>
                <td style={{ borderTop: "2px solid #000", padding: "5px 10px", backgroundColor: "#fff" }} className="text-center font-black tracking-widest text-black uppercase text-[11px]">
                  {MESES_NOMES[mes]}, {MESES_NOMES[mes2]} E {MESES_NOMES[mes3]}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Tabela de Chamada */}
          <div className="tabela-wrapper">
            <table className="border-collapse text-black bg-white" style={{ borderSpacing: 0, width: "100%", minWidth: "1050px", tableLayout: "fixed" }}>
              <thead>
                <tr className="text-[10px] font-black border-t-2 border-b-2 border-black">
                  <th style={{ width: "30px" }} className="bg-white"></th>
                  <th style={{ width: "320px" }} className="bg-white"></th>
                  <th colSpan={datasMes1.length} style={{ borderRight: "2.5px solid #000" }} className="text-center py-1 italic tracking-wider bg-[#c6d6e6] text-black font-black">{MESES_NOMES[mes].toUpperCase()}</th>
                  <th colSpan={datasMes2.length} style={{ borderRight: "2.5px solid #000" }} className="text-center py-1 italic tracking-wider bg-[#b3c7db] text-black font-black">{MESES_NOMES[mes2].toUpperCase()}</th>
                  <th colSpan={datasMes3.length} className="text-center py-1 italic tracking-wider bg-[#a4bdcf] text-black font-black">{MESES_NOMES[mes3].toUpperCase()}</th>
                </tr>
                <tr className="text-[9px] font-black tracking-tight text-center border-b-2 border-black bg-white">
                  <th style={{ borderRight: "2.5px solid #000", width: "30px" }} className="py-1 italic text-center">Nº</th>
                  <th style={{ borderRight: "2.5px solid #000", width: "320px" }} className="text-left px-3 italic">NOME DO ALUNO</th>
                  {todasDatasTrimestral.map((dt, i) => (
                    <th key={i} style={{ borderRight: "1px solid #000", width: "24px", maxWidth: "24px", minWidth: "24px" }} className="font-black p-0 py-1 italic text-center border-r border-black">
                      {dt.diaPuro}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(numLinhas)].map((_, index) => {
                  const al = alunosLocais[index]
                  return (
                    <tr key={index} className="border-b border-black hover:bg-slate-50 transition-colors">
                      <td style={{ borderRight: "2.5px solid #000", height: "32px", width: "30px" }} className="text-center font-black bg-white text-[11px]">
                        {index + 1}
                      </td>
                      <td style={{ borderRight: "2.5px solid #000", width: "320px", padding: "0 8px" }} className="font-black uppercase italic">
                        <div className="w-full h-full flex items-center gap-1">
                          <input
                            type="text"
                            value={al?.nome || ""}
                            onChange={e => {
                              const n = [...alunosLocais]
                              if (!n[index]) n[index] = { nome: "", telefone: "", posicao: index, id: null }
                              n[index].nome = e.target.value.toUpperCase()
                              setAlunosLocais(n)
                            }}
                            onBlur={() => salvarAlunoNoBanco(index)}
                            className="flex-1 bg-transparent outline-none font-black uppercase italic text-[11px] tracking-wide py-1"
                            placeholder=""
                          />
                          {al?.nome && (
                            <button
                              onClick={() => confirmarExcluirAluno(index)}
                              className="text-red-600 hover:text-red-800 text-[14px] font-black px-1 hover:scale-110 transition-all"
                              title="Excluir aluno"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </td>
                      {todasDatasTrimestral.map((dt, idx) => {
                        const status = al?.id ? (presencas[al.id]?.[dt.formatada] || "") : ""
                        return (
                          <td
                            key={idx}
                            onClick={() => al?.id && alternarPresenca(index, dt.formatada, dt.mesPuro)}
                            style={{
                              borderRight: "1px solid #000",
                              width: "24px",
                              maxWidth: "24px",
                              minWidth: "24px",
                              cursor: al?.id ? "pointer" : "default",
                              backgroundColor: status === "P" ? "#dcfce7" : status === "F" ? "#fee2e2" : status === "J" ? "#fef9c3" : "transparent",
                              color: status === "F" ? "#ef4444" : status === "P" ? "#22c55e" : "#eab308"
                            }}
                            className="text-center font-black text-xs select-none p-0 border-r border-black"
                          >
                            {status}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Rodapé */}
        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr 240px", alignItems: "end", marginTop: "20px", padding: "0 16px", color: "#000" }}>
          <div style={{ width: "220px", justifySelf: "start" }} className="text-center">
            <div className="border-t-2 border-black w-full my-1"></div>
            <span className="text-[9px] font-black italic uppercase tracking-tight block text-center">COORDENADOR(A) PEDAGÓGICO(A)</span>
          </div>
          <div className="text-center px-4">
            <p style={{ color: "#475569", fontSize: "9px", lineHeight: "1.2" }} className="font-black italic uppercase tracking-tight">
              A Secretaria de Cultura e Turismo deseja ao professor do curso de {curso?.oficina || "BATERIA"} um ótimo {MESES_NOMES[mes].toLowerCase()}/{MESES_NOMES[mes2].toLowerCase()}/{MESES_NOMES[mes3].toLowerCase()}.
            </p>
          </div>
          <div style={{ width: "220px", justifySelf: "end" }} className="text-center">
            <div className="border-t-2 border-black w-full my-1"></div>
            <span className="text-[9px] font-black italic uppercase tracking-tight block text-center">PROFESSOR(A): {curso?.professor}</span>
          </div>
        </div>

        <div className="w-full text-center mt-4 text-[7.5px] tracking-widest text-gray-400 font-bold italic">
          FOLHA DE CONTROLE DE FREQUÊNCIA — CASA DA CULTURA 2026
        </div>
      </div>
    </div>
  )
}
