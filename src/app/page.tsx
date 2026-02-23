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
      const key = p.aluno_id || p.aluno_posicao; 
      if(!gridPre[key]) gridPre[key] = {};
      gridPre[key][p.data_aula] = p.status;
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
        telefone: aluno.telefone || "",
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

  const excluirAluno = async (id: any, index: number) => {
    if (!id) {
      const n = [...alunosLocais];
      n.splice(index, 1);
      setAlunosLocais(n);
      return;
    }
    if (confirm("EXCLUIR ALUNO DEFINITIVAMENTE?")) {
      await supabase.from('frequencia').delete().eq('aluno_id', id);
      await supabase.from('alunos').delete().eq('id', id);
      const n = [...alunosLocais];
      n.splice(index, 1);
      setAlunosLocais(n);
      fetchTurmas();
    }
  };

  const alternarPresenca = async (aluno: any, dataAula: string, index: number) => {
    if (!aluno.id) return;
    const atual = presencas[aluno.id]?.[dataAula] || "";
    let novoStatus = (atual === "") ? "P" : (atual === "P") ? "F" : "";
    setPresencas((prev: any) => ({ ...prev, [aluno.id]: { ...(prev[aluno.id] || {}), [dataAula]: novoStatus } }));
    if (novoStatus === "") {
      await supabase.from('frequencia').delete().match({ turma_id: idAtivo, mes, aluno_id: aluno.id, data_aula: dataAula });
    } else {
      await supabase.from('frequencia').upsert({ turma_id: idAtivo, mes, aluno_id: aluno.id, aluno_posicao: index, data_aula: dataAula, status: novoStatus });
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-2xl animate-pulse italic uppercase tracking-tighter">Carregando...</div>;

  if (tela === 'menu') return (
    <div className="min-h-screen p-8 bg-[#F8FAFC] italic font-black uppercase">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-black mb-12 border-l-8 border-black pl-6 italic">Casa da Cultura <span className="text-blue-600">2026</span></h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[...new Set(turmas.map(t => t.professor))].sort().map(p => (
            <button key={p} onClick={() => {setProfSel(p); setTela('lista');}} className="border-4 border-black bg-white p-8 text-sm flex flex-col items-center shadow-[6px_6px_0px_#000] hover:translate-y-[-2px] transition-all">
              {p}
              <span className="text-[10px] text-blue-600 mt-2 font-bold italic">{turmas.filter(t => t.professor === p).reduce((acc, t) => acc + (contagemAlunos[t.id] || 0), 0)} ALUNOS</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (tela === 'lista') {
    const turmasDoProf = turmas.filter(t => t.professor === profSel);
    const renderCard = (c: any) => {
      const n = contagemAlunos[c.id] || 0;
      const limit = obterLimiteOficina(c.oficina);
      const estaLotada = n === limit;
      const estaExcedida = n > limit;

      return (
        <div 
          key={c.id} 
          onClick={() => {setIdAtivo(c.id); setTela('chamada');}} 
          className={`border-4 border-black p-4 cursor-pointer hover:scale-[1.02] transition-all flex justify-between items-center shadow-[6px_6px_0px_#000] 
            ${estaExcedida ? 'bg-red-500 text-white' : estaLotada ? 'bg-yellow-400 text-black' : 'bg-white text-black'}`}
        >
          <div className="flex flex-col text-left">
            <span className="text-2xl italic tracking-tighter leading-none">{c.horario}</span>
            <span className={`text-[10px] mt-1 font-bold ${estaExcedida ? 'text-white' : 'text-gray-500'}`}>{c.oficina}</span>
          </div>
          <div className="text-right flex flex-col items-end">
            <span className="text-lg font-black">{n} / {limit}</span>
            {estaLotada && !estaExcedida && <span className="text-[8px] font-black italic">LOTADA</span>}
            {estaExcedida && <span className="text-[8px] font-black italic">EXCEDIDA</span>}
          </div>
        </div>
      );
    };

    return (
      <div className="min-h-screen p-8 max-w-6xl mx-auto italic font-black uppercase">
        <button onClick={() => setTela('menu')} className="text-xs mb-8 border-2 border-black px-2 py-1">← Voltar</button>
        <h2 className="text-6xl mb-12 border-b-8 border-black pb-4 tracking-tighter">{profSel}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <h3 className="bg-blue-600 text-white p-3 mb-6 text-center border-4 border-black shadow-[6px_6px_0px_#000]">Segunda e Quarta</h3>
            <div className="space-y-4">{turmasDoProf.filter(t => String(t.dias).includes('1')).map(renderCard)}</div>
          </div>
          <div>
            <h3 className="bg-red-600 text-white p-3 mb-6 text-center border-4 border-black shadow-[6px_6px_0px_#000]">Terça e Quinta</h3>
            <div className="space-y-4">{turmasDoProf.filter(t => String(t.dias).includes('2')).map(renderCard)}</div>
          </div>
        </div>
      </div>
    );
  }

  const cursoAtivo = turmas.find(c => c.id === idAtivo);
  const getDatas = () => {
    const dias = String(cursoAtivo?.dias).replace(/[^0-9,]/g, '').split(',').map(Number);
    const res = [];
    const ultimo = new Date(2026, mes + 1, 0).getDate();
    for (let d = 1; d <= ultimo; d++) {
      const date = new Date(2026, mes, d);
      if (dias.includes(date.getDay())) res.push(`${d < 10 ? '0'+d : d}/${mes+1 < 10 ? '0'+(mes+1) : mes+1}`);
    }
    return res.slice(0, 10);
  };
  const datasAulas = getDatas();

  return (
    <div className="min-h-screen italic font-black uppercase bg-[#F1F5F9]">
      <style>{`
        @media print { 
          @page { size: A4 landscape; margin: 5mm; }
          html, body { background: #fff !important; margin: 0 !important; padding: 0 !important; }
          nav, .no-print, button { display: none !important; }
          .folha-container { 
            position: absolute; top: 0; left: 0; width: 100% !important; 
            max-width: none !important; margin: 0 !important; padding: 5mm !important;
            border: none !important; box-shadow: none !important; background: #fff !important;
          }
          table { width: 100% !important; table-layout: fixed; border: 2px solid black !important; }
          th, td { border: 1px solid black !important; padding: 2px !important; font-size: 10px !important; }
          .bg-green-100 { background-color: #f0fdf4 !important; -webkit-print-color-adjust: exact; }
          .bg-red-100 { background-color: #fef2f2 !important; -webkit-print-color-adjust: exact; }
        }
      `}</style>

      <nav className="no-print bg-white border-b-4 border-black p-4 sticky top-0 z-50 flex justify-between items-center px-8 shadow-md">
        <button onClick={()=>setTela('lista')} className="text-xs border-4 border-black px-4 py-2">← Voltar</button>
        <div className="flex gap-4">
          <button onClick={() => setAlunosLocais([...alunosLocais, {nome:"", telefone:"", posicao:alunosLocais.length, id:null}])} className="bg-blue-600 text-white px-4 py-2 text-[10px] border-4 border-black">Novo Aluno +</button>
          <select value={mes} onChange={e => setMes(Number(e.target.value))} className="border-4 border-black p-1 text-xs font-black">
            {mesesNomes.map((m,i)=><option key={i} value={i}>{m}</option>)}
          </select>
          <button onClick={()=>window.print()} className="bg-black text-white px-6 py-2 text-[10px] border-4 border-black shadow-[4px_4px_0px_#ccc]">Imprimir</button>
        </div>
      </nav>

      <div className="folha-container max-w-[1300px] mx-auto bg-white p-10 mt-6 border-4 border-black shadow-2xl mb-10">
        <header className="flex justify-between items-end mb-6 border-b-8 border-black pb-4">
          <div>
            <h1 className="text-5xl tracking-tighter leading-none mb-1">{cursoAtivo?.professor}</h1>
            <span className="text-sm font-bold">{cursoAtivo?.oficina} | {cursoAtivo?.horario}</span>
          </div>
          <div className="text-right">
             <span className="text-4xl block leading-none">{mesesNomes[mes]}</span>
             <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Casa da Cultura 2026</span>
          </div>
        </header>

        <table className="w-full border-collapse border-[3px] border-black">
          <thead>
            <tr className="bg-gray-100 uppercase">
              <th className="border-2 border-black w-8 p-1 text-[9px]">Nº</th>
              <th className="border-2 border-black p-1 text-left text-[11px]">Aluno</th>
              <th className="border-2 border-black p-1 text-left w-36 no-print">Contato</th>
              {datasAulas.map(dt => <th key={dt} className="border-2 border-black w-12 text-[8px]">{dt}</th>)}
              <th className="border-2 border-black w-12 text-[8px] no-print">Faltas</th>
              <th className="border-2 border-black w-10 no-print bg-red-50 text-red-600 text-[8px]">DEL</th>
            </tr>
          </thead>
          <tbody>
            {alunosLocais.map((aluno, i) => {
              const faltas = Object.values(presencas[aluno.id] || {}).filter(v => v === "F").length;
              return (
                <tr key={aluno.id || i} className="h-9">
                  <td className="border-2 border-black text-center text-[9px] text-gray-400 font-bold">{i+1}</td>
                  <td className="border-2 border-black px-2">
                    <input className={`w-full bg-transparent outline-none font-black text-[11px] ${faltas >= 3 ? 'text-red-600' : ''}`} value={aluno.nome || ""} onChange={e=>{const n=[...alunosLocais]; n[i].nome=e.target.value.toUpperCase(); setAlunosLocais(n);}} onBlur={()=>salvarAlunoNoBanco(i, aluno.id)} />
                  </td>
                  <td className="border-2 border-black px-2 no-print bg-blue-50/20">
                    <input className="w-full bg-transparent text-[9px]" value={aluno.telefone || ""} onChange={e=>{const n=[...alunosLocais]; n[i].telefone=e.target.value; setAlunosLocais(n);}} onBlur={()=>salvarAlunoNoBanco(i, aluno.id)} />
                  </td>
                  {datasAulas.map(dt => (
                    <td key={dt} onClick={() => alternarPresenca(aluno, dt, i)} className={`border-2 border-black text-center cursor-pointer text-lg font-black ${presencas[aluno.id]?.[dt] === 'P' ? 'bg-green-100' : presencas[aluno.id]?.[dt] === 'F' ? 'bg-red-100' : ''}`}>
                      {presencas[aluno.id]?.[dt]}
                    </td>
                  ))}
                  <td className="border-2 border-black text-center no-print font-black text-xs">{faltas || ""}</td>
                  <td className="border-2 border-black text-center no-print bg-gray-50">
                    <button onClick={() => excluirAluno(aluno.id, i)} className="w-full h-full text-red-400 hover:bg-red-600 hover:text-white transition-colors">×</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        
        <footer className="mt-8 flex justify-between items-end">
           <div className="flex flex-col gap-1 text-left">
             <p className="text-[8px] text-gray-500 font-bold tracking-widest">LEGENDA: (P) PRESENÇA | (F) FALTA | (J) JUSTIFICADO</p>
             <p className="text-[7px] text-gray-300 italic">Gerado automaticamente - Sistema Casa da Cultura 2026</p>
           </div>
           <div className="flex flex-col items-center">
             <div className="w-64 border-t-2 border-black pt-1"></div>
             <p className="text-[9px] font-black uppercase">Assinatura do Professor</p>
           </div>
        </footer>
      </div>
    </div>
  )
}
