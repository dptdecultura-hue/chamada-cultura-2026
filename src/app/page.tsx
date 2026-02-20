'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function CasaDaCultura2026() {
  const [tela, setTela] = useState('menu')
  const [profSel, setProfSel] = useState("")
  const [idAtivo, setIdAtivo] = useState<any>(null)
  const [mes, setMes] = useState(new Date().getMonth())
  const [turmas, setTurmas] = useState<any[]>([])
  const [alunosLocais, setAlunosLocais] = useState<any[]>([])
  const [presencas, setPresencas] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [contagemAlunos, setContagemAlunos] = useState<any>({})

  const mesesNomes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]

  const obterLimiteOficina = (oficina: string) => {
    const o = oficina?.toUpperCase() || "";
    if (o.includes("FLAUTA DOCE")) return 10;
    if (o.includes("FLAUTA TRANSVERSAL") || o === "FLAUTA") return 1;
    if (o.includes("CANTO") || o.includes("CORAL")) return 15;
    if (o.includes("PIANO")) return 2;
    if (o.includes("VIOLONCELO") || o.includes("VIOLA")) return 3;
    if (o.includes("VIOLINO")) return 10;
    if (o.includes("VIOLÃO")) return 15;
    if (o.includes("BATERIA") || o.includes("PERCUSSÃO")) return 10;
    return 15;
  };

  useEffect(() => { fetchTurmas(); }, []);
  useEffect(() => { if (idAtivo) fetchDados(); }, [idAtivo, mes]);

  async function fetchTurmas() {
    const { data: tData } = await supabase.from('turmas').select('*');
    const { data: aData } = await supabase.from('alunos').select('turma_id');
    const contagem: any = {};
    aData?.forEach(a => { contagem[a.turma_id] = (contagem[a.turma_id] || 0) + 1; });
    setContagemAlunos(contagem);
    if (tData) setTurmas(tData.sort((a, b) => a.horario.localeCompare(b.horario)));
    setLoading(false);
  }

  async function fetchDados() {
    const { data: alData } = await supabase.from('alunos').select('*').eq('turma_id', idAtivo).order('posicao', { ascending: true });
    const { data: preData } = await supabase.from('frequencia').select('*').eq('turma_id', idAtivo).eq('mes', mes);
    if (alData) setAlunosLocais(alData);
    const gridPre: any = {};
    preData?.forEach(p => {
      if(!gridPre[p.aluno_posicao]) gridPre[p.aluno_posicao] = {};
      gridPre[p.aluno_posicao][p.data_aula] = p.status;
    });
    setPresencas(gridPre);
  }

  const salvarAlunoNoBanco = async (index: number, idReal: any) => {
    const aluno = alunosLocais[index];
    if (aluno?.nome?.trim() !== "") {
      const { data } = await supabase.from('alunos').upsert({ 
        id: idReal || undefined, 
        turma_id: idAtivo, 
        nome: aluno.nome.trim().toUpperCase(), 
        posicao: index 
      }).select();
      
      if (data && !idReal) {
        const n = [...alunosLocais];
        n[index].id = data[0].id;
        setAlunosLocais(n);
      }
      fetchTurmas();
    }
  };

  const getDatasDoMes = (diasSemanaInput: any) => {
    const datas = [];
    const diasLimpos = String(diasSemanaInput).replace(/[^0-9,]/g, '');
    const diasSemana = diasLimpos.split(',').map(Number);
    const ultimoDia = new Date(2026, mes + 1, 0).getDate();
    for (let d = 1; d <= ultimoDia; d++) {
      const dataProd = new Date(2026, mes, d);
      if (diasSemana.includes(dataProd.getDay())) {
        datas.push(`${d < 10 ? '0'+d : d}/${mes+1 < 10 ? '0'+(mes+1) : mes+1}`);
      }
    }
    return datas.slice(0, 10);
  };

  const alternarPresenca = async (alunoPos: number, dataAula: string) => {
    const atual = presencas[alunoPos]?.[dataAula] || "";
    let novoStatus = (atual === "") ? "P" : (atual === "P") ? "F" : "";
    setPresencas((prev: any) => ({ ...prev, [alunoPos]: { ...(prev[alunoPos] || {}), [dataAula]: novoStatus } }));
    
    if (novoStatus === "") {
      await supabase.from('frequencia').delete().match({ turma_id: idAtivo, mes, aluno_posicao: alunoPos, data_aula: dataAula });
    } else {
      await supabase.from('frequencia').upsert({ turma_id: idAtivo, mes, aluno_posicao: alunoPos, data_aula: dataAula, status: novoStatus });
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-2xl animate-pulse uppercase italic">Carregando...</div>;

  if (tela === 'menu') return (
    <div className="min-h-screen p-8 bg-[#F8FAFC] italic font-black uppercase">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-black mb-12 border-l-8 border-black pl-6 italic">Casa da Cultura <span className="text-blue-600">2026</span></h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[...new Set(turmas.map(t => t.professor))].sort().map(p => {
            const totalProf = turmas.filter(t => t.professor === p).reduce((acc, t) => acc + (contagemAlunos[t.id] || 0), 0);
            return (
              <button key={p} onClick={() => {setProfSel(p); setTela('lista');}} className="border-4 border-black bg-white p-8 text-sm flex flex-col items-center shadow-[6px_6px_0px_#000] hover:translate-y-[-2px] transition-all active:shadow-none active:translate-x-[2px]">
                {p}
                <span className="text-[10px] text-blue-600 mt-2 font-bold italic">{totalProf} ALUNOS</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  if (tela === 'lista') {
    const turmasDoProf = turmas.filter(t => t.professor === profSel);
    const segQua = turmasDoProf.filter(t => String(t.dias).includes('1'));
    const terQui = turmasDoProf.filter(t => String(t.dias).includes('2'));
    
    const renderCard = (c: any) => {
      const n = contagemAlunos[c.id] || 0;
      const limit = obterLimiteOficina(c.oficina);
      const lotado = n >= limit;
      return (
        <div key={c.id} onClick={() => {setIdAtivo(c.id); setTela('chamada');}} className={`relative bg-white border-4 p-4 cursor-pointer hover:scale-[1.02] transition-all flex justify-between items-center ${lotado ? 'border-yellow-500 bg-yellow-50 shadow-[6px_6px_0px_#eab308]' : 'border-black shadow-[6px_6px_0px_#000]'}`}>
          {lotado && <span className="absolute -top-3 -right-3 bg-yellow-400 border-2 border-black px-2 py-0.5 text-[10px]">LOTADO</span>}
          <div className="flex flex-col">
            <span className="text-2xl italic tracking-tighter leading-none">{c.horario}</span>
            <span className="text-[10px] text-gray-400 mt-1">{c.oficina}</span>
          </div>
          <div className="text-right">
            <span className="text-lg">{n} / {limit}</span>
            <p className="text-[8px] text-gray-400">Vagas</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen p-8 max-w-6xl mx-auto italic font-black uppercase">
        <button onClick={() => setTela('menu')} className="text-xs mb-8 border-2 border-black px-2 py-1 hover:bg-black hover:text-white transition-all">← Voltar</button>
        <h2 className="text-6xl mb-12 border-b-8 border-black pb-4 tracking-tighter">{profSel}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <h3 className="bg-blue-600 text-white p-3 mb-6 text-center border-4 border-black shadow-[6px_6px_0px_#000]">Segunda e Quarta</h3>
            <div className="space-y-4">{segQua.map(renderCard)}</div>
          </div>
          <div>
            <h3 className="bg-red-600 text-white p-3 mb-6 text-center border-4 border-black shadow-[6px_6px_0px_#000]">Terça e Quinta</h3>
            <div className="space-y-4">{terQui.map(renderCard)}</div>
          </div>
        </div>
      </div>
    );
  }

  const cursoAtivo = turmas.find(c => c.id === idAtivo);
  const datasAulas = cursoAtivo ? getDatasDoMes(cursoAtivo.dias) : [];
  const diasTxt = cursoAtivo?.dias?.includes('1') ? "SEGUNDA E QUARTA" : "TERÇA E QUINTA";

  return (
    <div className="min-h-screen italic font-black uppercase bg-white">
      <style>{`
        @media print { 
          .no-print { display: none !important; } 
          .folha-container { border: none !important; padding: 0 !important; margin: 0 !important; width: 100% !important; max-width: 100% !important; }
          table { border-width: 2px !important; }
        }
      `}</style>

      <nav className="no-print bg-white border-b-4 border-black p-4 sticky top-0 z-50 flex justify-between items-center px-8 shadow-md">
        <button onClick={()=>setTela('lista')} className="text-xs border-4 border-black px-4 py-2 hover:bg-black hover:text-white transition-all">← Voltar</button>
        <div className="flex gap-4">
          <button onClick={() => setAlunosLocais([...alunosLocais, {nome:"", posicao:alunosLocais.length, id:null}])} className="bg-blue-600 text-white px-4 py-2 text-[10px] border-4 border-black shadow-[4px_4px_0px_#000] active:shadow-none">Novo Aluno +</button>
          <select value={mes} onChange={e => setMes(Number(e.target.value))} className="border-4 border-black p-1 text-xs font-black">
            {mesesNomes.map((m,i)=><option key={i} value={i}>{m}</option>)}
          </select>
          <button onClick={()=>window.print()} className="bg-black text-white px-6 py-2 text-[10px] border-4 border-black shadow-[4px_4px_0px_#ccc] active:shadow-none">Imprimir</button>
        </div>
      </nav>

      <div className="folha-container max-w-[1100px] mx-auto bg-white p-10 mt-6 border-4 border-black">
        <header className="flex justify-between items-end mb-8 border-b-8 border-black pb-4">
          <div>
            <h1 className="text-6xl tracking-tighter leading-none mb-2">{cursoAtivo?.professor}</h1>
            <div className="flex gap-3 items-center">
              <span className="text-lg">{cursoAtivo?.oficina}</span>
              <span className="bg-black text-white px-3 py-1 text-xs">{cursoAtivo?.horario}</span>
              <span className="border-2 border-black px-2 py-1 text-[10px]">{diasTxt}</span>
            </div>
          </div>
          <div className="text-right">
             <span className="text-5xl block leading-none">{mesesNomes[mes]}</span>
             <span className="text-[10px] text-gray-400">CASA DA CULTURA 2026</span>
          </div>
        </header>

        <table className="w-full border-collapse border-4 border-black">
          <thead>
            <tr className="bg-gray-100">
              <th className="border-2 border-black w-10 p-2 text-[10px]">Nº</th>
              <th className="border-2 border-black p-2 text-left">Aluno</th>
              {datasAulas.map(dt => <th key={dt} className="border-2 border-black w-14 text-[9px]">{dt}</th>)}
              {/* COLUNA DE FALTAS COM NO-PRINT */}
              <th className="border-2 border-black w-14 text-[9px] no-print bg-yellow-50">Faltas</th>
            </tr>
          </thead>
          <tbody>
            {alunosLocais.map((aluno, i) => {
              const faltas = Object.values(presencas[i] || {}).filter(v => v === "F").length;
              return (
                <tr key={i} className="h-10">
                  <td className="border-2 border-black text-center text-xs text-gray-300">{i+1}</td>
                  <td className="border-2 border-black px-2">
                    <input 
                      className={`w-full bg-transparent outline-none font-black ${faltas >= 3 ? 'text-red-600' : ''}`}
                      value={aluno.nome}
                      onChange={(e) => {
                        const n = [...alunosLocais];
                        n[i].nome = e.target.value.toUpperCase();
                        setAlunosLocais(n);
                      }}
                      onBlur={() => salvarAlunoNoBanco(i, aluno.id)}
                      placeholder="..."
                    />
                  </td>
                  {datasAulas.map(dt => (
                    <td key={dt} onClick={() => alternarPresenca(i, dt)} className={`border-2 border-black text-center cursor-pointer text-xl font-black ${presencas[i]?.[dt] === 'P' ? 'bg-green-100' : presencas[i]?.[dt] === 'F' ? 'bg-red-100' : ''}`}>
                      {presencas[i]?.[dt]}
                    </td>
                  ))}
                  {/* CÉLULA DE FALTAS COM NO-PRINT */}
                  <td className={`border-2 border-black text-center no-print font-black ${faltas >= 3 ? 'bg-red-600 text-white' : 'bg-gray-50 text-gray-400'}`}>
                    {faltas || ""}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        
        <div className="mt-12 flex justify-between items-end">
           <p className="text-[9px] text-gray-400 font-bold tracking-widest">LEGENDA: (P) PRESENÇA | (F) FALTA | (J) JUSTIFICADO</p>
           <div className="w-64 border-t-4 border-black pt-2 text-center text-[10px] font-black">ASSINATURA DO PROFESSOR</div>
        </div>
      </div>
    </div>
  )
}