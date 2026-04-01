'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// Constante da Logo (Substitua pela sua Base64 real se desejar)
const LOGO_PREFEITURA = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

export default function GestaoCultura2026() {
  const [tela, setTela] = useState('menu')
  const [idAtivo, setIdAtivo] = useState<any>(null)
  const [mes, setMes] = useState(new Date().getMonth())
  const [turmas, setTurmas] = useState<any[]>([])
  const [alunosLocais, setAlunosLocais] = useState<any[]>([])
  const [presencas, setPresencas] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [modoGestao, setModoGestao] = useState(false)

  const mesesNomes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]

  useEffect(() => { fetchTurmas() }, [])
  useEffect(() => { if (idAtivo) fetchDadosTurma() }, [idAtivo, mes])

  async function fetchTurmas() {
    setLoading(true)
    const { data } = await supabase.from('turmas').select('*').order('professor')
    if (data) setTurmas(data)
    setLoading(false)
  }

  async function fetchDadosTurma() {
    // Busca Alunos
    const { data: alus } = await supabase.from('alunos')
      .select('*')
      .eq('turma_id', idAtivo)
      .order('nome')
    setAlunosLocais(alus || [])

    // Busca Presenças do mês
    const { data: pres } = await supabase.from('frequencia')
      .select('*')
      .eq('turma_id', idAtivo)
    
    const mapa: any = {}
    pres?.forEach(p => {
      if (!mapa[p.aluno_id]) mapa[p.aluno_id] = {}
      mapa[p.aluno_id][p.data] = p.status
    })
    setPresencas(mapa)
  }

  const togglePresenca = async (alunoId: string, dataStr: string) => {
    const atual = presencas[alunoId]?.[dataStr] || ""
    const ciclos: any = { "": "P", "P": "F", "F": "J", "J": "" }
    const prox = ciclos[atual]

    const novaPres = { ...presencas }
    if (!novaPres[alunoId]) novaPres[alunoId] = {}
    novaPres[alunoId][dataStr] = prox
    setPresencas(novaPres)

    if (prox === "") {
      await supabase.from('frequencia').delete().match({ aluno_id: alunoId, data: dataStr })
    } else {
      await supabase.from('frequencia').upsert({
        aluno_id: alunoId,
        turma_id: idAtivo,
        data: dataStr,
        status: prox
      })
    }
  }

  const gerarDatasMes = () => {
    const curso = turmas.find(t => t.id === idAtivo);
    if (!curso) return [];
    const diasAlvo = String(curso.dias).includes('2') ? [2, 4] : [1, 3]; // 1,3 = Seg/Qua | 2,4 = Ter/Qui
    const datas = [];
    const ano = 2026;
    const ultimoDia = new Date(ano, mes + 1, 0).getDate();
    
    for (let d = 1; d <= ultimoDia; d++) {
      const dataObj = new Date(ano, mes, d);
      if (diasAlvo.includes(dataObj.getDay())) {
        datas.push(`${d.toString().padStart(2, '0')}/${(mes + 1).toString().padStart(2, '0')}`);
      }
    }
    return datas;
  }

  const obterSaudacao = (oficina: string) => {
    const frases: any = {
      "VIOLÃO": "Que as cordas do violão ecoem aprendizado e harmonia neste mês.",
      "PERCUSSÃO": "Ritmo e precisão: que o som dos tambores guie nossa jornada.",
      "TECLADO": "Cada tecla pressionada é um novo degrau no seu talento musical.",
      "FLAUTA": "Que a leveza do sopro traga melodia aos seus dias de estudo."
    }
    return frases[oficina?.toUpperCase()] || "Desejamos um excelente mês de muito aprendizado e arte!";
  }

  if (tela === 'menu') {
    return (
      <div className="p-8 bg-gray-100 min-h-screen font-sans">
        <h1 className="text-3xl font-black mb-8 border-b-4 border-black pb-2">SISTEMA DE CHAMADA 2026</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {turmas.map(t => (
            <button 
              key={t.id}
              onClick={() => { setIdAtivo(t.id); setTela('chamada'); }}
              className="bg-white border-4 border-black p-6 hover:bg-yellow-400 transition-all text-left shadow-[8px_8px_0px_#000]"
            >
              <p className="font-black text-xl uppercase">{t.professor}</p>
              <p className="text-sm font-bold opacity-70">{t.oficina} • {t.horario}</p>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const cursoAtivo = turmas.find(t => t.id === idAtivo)
  const datasCol = gerarDatasMes()

  return (
    <div className="min-h-screen bg-gray-200 py-10 print:p-0 print:bg-white">
      {/* NAVBAR NO-PRINT */}
      <nav className="no-print fixed top-0 w-full bg-white border-b-4 border-black p-4 z-50 flex justify-between px-10">
        <button onClick={() => setTela('menu')} className="font-black border-4 border-black px-4 py-1 hover:bg-black hover:text-white uppercase">Voltar</button>
        <div className="flex gap-4 items-center">
          <select value={mes} onChange={e => setMes(Number(e.target.value))} className="border-4 border-black p-1 font-black">
            {mesesNomes.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <button onClick={() => window.print()} className="bg-black text-white px-6 py-2 font-black uppercase">Imprimir</button>
        </div>
      </nav>

      {/* FOLHA DE CHAMADA MODELO 2.0 */}
      <div className="folha bg-white mx-auto shadow-2xl border border-gray-300 print:shadow-none print:border-none" style={{ width: '297mm', minHeight: '210mm', padding: '15mm' }}>
        
        {/* CABEÇALHO */}
        <header className="flex border-2 border-black h-32 mb-6">
          <div className="w-1/4 border-r-2 border-black flex items-center justify-center p-4">
             <img src={LOGO_PREFEITURA} alt="Logo" className="max-h-full" />
          </div>
          <div className="w-2/4 border-r-2 border-black p-4 flex flex-col justify-center italic">
            <h2 className="text-4xl font-black uppercase leading-none">{cursoAtivo?.professor}</h2>
            <p className="font-bold text-lg">{cursoAtivo?.oficina} — {cursoAtivo?.horario}</p>
          </div>
          <div className="w-1/4 p-4 flex flex-col justify-center text-right font-black">
            <span className="text-4xl uppercase">{mesesNomes[mes]}</span>
            <span className="text-xs tracking-tighter">CONTROLE DE FREQUÊNCIA 2026</span>
          </div>
        </header>

        {/* TABELA */}
        <table className="w-full border-collapse border-2 border-black font-sans uppercase">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black w-8 text-[10px]">Nº</th>
              <th className="border border-black p-2 text-left text-xs">Nome do Aluno</th>
              {datasCol.map(dt => (
                <th key={dt} className="border border-black w-10 text-[9px] py-2">{dt}</th>
              ))}
              <th className="border border-black w-12 text-[9px] no-print">Faltas</th>
            </tr>
          </thead>
          <tbody>
            {alunosLocais.map((aluno, idx) => {
              const faltas = Object.values(presencas[aluno.id] || {}).filter(v => v === "F").length;
              return (
                <tr key={aluno.id} className="h-8">
                  <td className="border border-black text-center text-[10px] font-bold">{idx + 1}</td>
                  <td className={`border border-black px-2 text-[11px] font-black ${faltas >= 3 ? 'text-red-600 underline decoration-2' : ''}`}>
                    {aluno.nome}
                  </td>
                  {datasCol.map(dt => {
                    const status = presencas[aluno.id]?.[dt] || "";
                    const cores: any = { "P": "bg-green-100", "F": "bg-red-100 text-red-600", "J": "bg-blue-100 text-blue-600" };
                    return (
                      <td 
                        key={dt} 
                        onClick={() => togglePresenca(aluno.id, dt)}
                        className={`border border-black text-center cursor-pointer font-black text-xs ${cores[status] || ""}`}
                      >
                        {status}
                      </td>
                    )
                  })}
                  <td className="border border-black text-center font-bold text-xs no-print">{faltas}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* RODAPÉ */}
        <footer className="mt-12 flex justify-between items-end px-4">
          <div className="w-1/3 text-center">
            <div className="border-b border-black mb-1"></div>
            <p className="text-[9px] font-black uppercase">Coordenação Pedagógica</p>
          </div>
          
          <div className="w-1/3 text-center px-4">
             <p className="text-[9px] italic text-gray-500 leading-tight">
               "{obterSaudacao(cursoAtivo?.oficina)}"
             </p>
          </div>

          <div className="w-1/3 text-center font-black">
            <div className="border-b border-black mb-1"></div>
            <p className="text-[9px] uppercase">Professor(a): {cursoAtivo?.professor}</p>
          </div>
        </footer>

      </div>
    </div>
  )
}
