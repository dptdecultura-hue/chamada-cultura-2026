'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface TabelaProps { idAtivo: string; profSel: string; }

export default function TabelaChamada({ idAtivo, profSel }: TabelaProps) {
  const [alunosLocais, setAlunosLocais] = useState<any[]>(Array(18).fill({ nome: "" }))
  const [presencas, setPresencas] = useState<any>({})
  const [mes, setMes] = useState(new Date().getMonth())
  const [loading, setLoading] = useState(true)
  const [cursoAtivo, setCursoAtivo] = useState<any>(null)

  const mesesNomes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]

  useEffect(() => { fetchDados() }, [idAtivo, mes])

  async function fetchDados() {
    setLoading(true)
    try {
      const { data: tData } = await supabase.from('turmas').select('*').eq('id', idAtivo).single()
      if (tData) setCursoAtivo(tData)

      const { data: alData } = await supabase.from('alunos').select('*').eq('turma_id', idAtivo).order('posicao', { ascending: true })
      
      const gridAlunos = Array(18).fill(null).map((_, i) => {
        const encontrado = alData?.find(a => Number(a.posicao) === i)
        return encontrado ? encontrado : { nome: "", posicao: i, turma_id: idAtivo }
      })
      setAlunosLocais(gridAlunos)

      const { data: preData } = await supabase.from('frequencia').select('*').eq('turma_id', idAtivo).eq('mes', mes)
      const gridPre: any = {}
      preData?.forEach(p => {
        if(!gridPre[p.aluno_posicao]) gridPre[p.aluno_posicao] = {}
        gridPre[p.aluno_posicao][p.data_aula] = p.status
      })
      setPresencas(gridPre)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const salvarNomeAluno = async (posicao: number, novoNome: string) => {
    const nomeFormatado = novoNome.toUpperCase().trim()
    if (nomeFormatado === alunosLocais[posicao].nome) return

    if (nomeFormatado === "") {
      if (alunosLocais[posicao].id) {
        await supabase.from('alunos').delete().eq('id', alunosLocais[posicao].id)
        await supabase.from('frequencia').delete().eq('aluno_posicao', posicao).eq('turma_id', idAtivo)
      }
    } else {
      await supabase.from('alunos').upsert({
        id: alunosLocais[posicao].id || undefined,
        nome: nomeFormatado,
        posicao: posicao,
        turma_id: idAtivo
      })
    }
    fetchDados()
  }

  const togglePresenca = async (posicao: number, dataAula: string) => {
    // Só permite marcar se a linha tiver um nome salvo ou digitado
    const nomeNaLinha = alunosLocais[posicao]?.nome
    if (!nomeNaLinha || nomeNaLinha === "") return

    const atual = presencas[posicao]?.[dataAula] || ""
    const proximo = atual === "" ? "P" : atual === "P" ? "F" : atual === "F" ? "AJ" : ""

    // Atualiza a tela na hora para não parecer travado
    setPresencas(prev => ({
      ...prev,
      [posicao]: { ...(prev[posicao] || {}), [dataAula]: proximo }
    }))

    // Salva no banco de dados
    await supabase.from('frequencia').upsert({
      aluno_posicao: posicao,
      turma_id: idAtivo,
      data_aula: dataAula,
      mes: mes,
      status: proximo
    }, { onConflict: 'aluno_posicao,data_aula,turma_id' })
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

  if (loading || !cursoAtivo) return <div className="p-10 font-black text-center uppercase italic text-2xl">Carregando Chamada...</div>
  const datasAulas = getDatasDoMes(cursoAtivo.dias)

  return (
    <div className="w-full max-w-[1100px] mx-auto bg-white p-4 print:p-0">
      
      <div className="flex justify-between items-center mb-6 print:hidden border-2 border-black p-4 bg-slate-50 shadow-[4px_4px_0px_#000]">
        <select value={mes} onChange={e => setMes(Number(e.target.value))} className="border-2 border-black p-2 font-black uppercase text-xs outline-none bg-white">
          {mesesNomes.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
        <span className="text-[10px] font-black uppercase text-slate-500 italic">Dica: Digite o nome e clique fora para salvar. Clique nas datas para P/F/AJ</span>
        <button onClick={() => window.print()} className="bg-blue-600 text-white px-8 py-2 font-black uppercase text-xs shadow-[2px_2px_0px_#000]">
          Imprimir Folha
        </button>
      </div>

      <div className="w-full">
        <header className="flex justify-between items-end mb-4 border-b-[4px] border-black pb-2">
          <div>
            <h1 className="text-4xl font-black uppercase italic leading-none">{cursoAtivo.professor}</h1>
            <p className="text-[10px] font-black mt-2 uppercase text-slate-600">Oficina: {cursoAtivo.oficina} | Horário: {cursoAtivo.horario}</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-black uppercase italic text-blue-600 leading-none">{mesesNomes[mes]}</p>
            <p className="text-[10px] font-black mt-1 uppercase">Casa da Cultura 2026</p>
          </div>
        </header>

        <table className="w-full border-collapse border-2 border-black">
          <thead>
            <tr className="bg-slate-100 text-[10px] font-black uppercase">
              <th className="border-2 border-black p-1 w-8">Nº</th>
              <th className="border-2 border-black p-1 text-left pl-2 w-[300px]">Nome do Aluno</th>
              {datasAulas.map(dt => <th key={dt} className="border-2 border-black p-1 w-14">{dt}</th>)}
              <th className="border-2 border-black p-1 w-12 print:hidden bg-slate-200">FALTAS</th>
            </tr>
          </thead>
          <tbody>
            {alunosLocais.map((aluno, i) => {
              const numFaltas = Object.values(presencas[i] || {}).filter(v => v === "F").length
              return (
                <tr key={i} className="h-9 print:h-8 border-b border-black">
                  <td className="border-x-2 border-black text-center font-black text-[11px] text-slate-400 bg-slate-50">{i + 1}</td>
                  <td className="border-r-2 border-black px-2 font-bold uppercase text-[11px]">
                    <input 
                      type="text"
                      defaultValue={aluno.nome}
                      onBlur={(e) => salvarNomeAluno(i, e.target.value)}
                      className="w-full bg-transparent outline-none border-none focus:ring-0 uppercase"
                      placeholder="NOME..."
                    />
                  </td>
                  {datasAulas.map(dt => (
                    <td 
                      key={dt} 
                      onClick={() => togglePresenca(i, dt)}
                      className="border-r-2 border-black text-center font-black text-lg cursor-pointer hover:bg-yellow-50 select-none min-w-[50px]"
                    >
                      {presencas[i]?.[dt] || ""}
                    </td>
                  ))}
                  <td className={`text-center print:hidden border-l-2 border-black font-black text-xs ${numFaltas >= 3 ? 'bg-red-600 text-white animate-pulse' : 'text-slate-400 bg-slate-50'}`}>
                    {aluno.nome ? numFaltas : ""}
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