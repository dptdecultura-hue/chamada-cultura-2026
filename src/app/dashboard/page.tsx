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

  // TELA 1: MENU DE PROFESSORES
  if (tela === 'menu') return (
    <div className="min-h-screen p-8 bg-[#F8FAFC]">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-black mb-12 border-l-8 border-black pl-6 uppercase italic">Casa da Cultura <span className="text-blue-600">2026</span></h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[...new Set(turmas.map(t => t.professor))].sort().map(p => {
            const totalProf = turmas.filter(t => t.professor === p).reduce((acc, t) => acc + (contagemAlunos[t.id] || 0), 0);
            return (
              <button key={p} onClick={() => {setProfSel(p); setTela('lista');}} className="border-2 border-black bg-white p-8 font-black text-sm uppercase flex flex-col items-center shadow-[4px_4px_0px_#000] hover:translate-y-[-2px] transition-all">
                {p}
                <span className="text-[10px] text-blue-600 mt-2 font-bold italic">{totalProf} ALUNOS</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  // TELA 2: LISTA DE TURMAS DO PROFESSOR
  if (tela === 'lista') {
    const turmasDoProf = turmas.filter(t => t.professor === profSel);
    const segQua = turmasDoProf.filter(t => String(t.dias).includes('1'));
    const terQui = turmasDoProf.filter(t => String(t.dias).includes('2'));
    
    const renderCard = (c: any) => {
      const n = contagemAlunos[c.id] || 0;
      const limit = obterLimiteOficina(c.oficina);
      const lotado = n >= limit;
      return (
        <div key={c.id} onClick={() => {setIdAtivo(c.id); setTela('chamada');}} className={`relative bg-white border-2 p-4 cursor-pointer hover:scale-[1.02] transition-all flex justify-between items-center ${lotado ? 'border-yellow-500 bg-yellow-50' : 'border-black shadow-[4px_4px_0px_#000]'}`}>
          {lotado && <span className="absolute -top-3 -right-3 bg-yellow-400 border-2 border-black px-2 py-0.5 text-[10px] font-black">LOTADO</span>}
          <div className="flex flex-col">
            <span className="font-black text-2xl italic tracking-tighter">{c.horario}</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase">{c.oficina}</span>
          </div>
          <div className="text-right">
            <span className="text-lg font-black">{n} / {limit}</span>
            <p className="text-[8px] text-gray-400 font-bold uppercase">Vagas</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen p-8 max-w-6xl mx-auto italic font-black uppercase">
        <button onClick={() => setTela('menu')} className="text-xs mb-8 hover:underline">← Voltar</button>
        <h2 className="text-6xl mb-12 border-b-8 border-black pb-4 tracking-tighter">{profSel}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <h3 className="bg-blue-600 text-white p-2 mb-6 text-center shadow-[4px_4px_0px_#000]">Segunda e Quarta</h3>
            <div className="space-y-4">{segQua.map(renderCard)}</div>
          </div>
          <div>
            <h3 className="bg-red-600 text-white p-2 mb-6 text-center shadow-[4px_4px_0px_#000]">Terça e Quinta</h3>
            <div className="space-y-4">{terQui.map(renderCard)}</div>
          </div>
        </div>
      </div>
    );
  }

  // TELA 3: A CHAMADA EM SI
  const cursoAtivo = turmas.find(c => c.id === idAtivo);
  const datasAulas = cursoAtivo ? getDatasDoMes(cursoAtivo.dias) : [];
  const diasTxt = cursoAtivo?.dias?.includes('1') ? "SEGUNDA E QUARTA" : "TERÇA E QUINTA";

  return (
    <div className="min-h-screen italic font-black uppercase">
      <nav className="no-print bg-white border-b-4 border-black p-4 sticky top-0 z-50 flex justify-between items-center px-8">
        <button onClick={()=>setTela('lista')} className="text-xs border-2 border-black px-4 py-1">← Voltar</button>
        <div className="flex gap-4">
          <button onClick={() => setAlunosLocais([...alunosLocais, {nome:"", posicao:alunosLocais.length, id:null}])} className="bg-blue-600 text-white px-4 py-2 text-[10px] shadow-[3px_3px_0px_#000]">Novo Aluno +</button>
          <select value={mes} onChange={e => setMes(Number(e.target.value))} className="border-2 border-black p-1 text-xs">
            {mesesNomes.map((m,i)=><option key={i} value={i}>{m}</option>)}
          </select>
          <button onClick={()=>window.print()} className="bg-black text-white px-4 py-2 text-[10px]">Imprimir</button>
        </div>
      </nav>

      <div className="max-w-[1100px] mx-auto bg-white p-10 mt-10 shadow-xl border-t-8 border-black">
        <header className="flex justify-between items-end mb-6 border-b-8 border-black pb-4">
          <div>
            <h1 className="text-6xl tracking-tighter leading-none">{cursoAtivo?.professor}</h1>
            <p className="text-sm mt-2">
              {cursoAtivo?.oficina} — {cursoAtivo?.horario} 
              <span className="bg-black text-white px-2 py-0.5 text-[10px] ml-2">{diasTxt}</span>
            </p>
          </div>
          <span className="text-5xl tracking-tighter">{mesesNomes[mes]}</span>
        </header>

        <table className="w-full border-collapse border-2 border-black">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black w-10 p-2 text-[10px]">Nº</th>
              <th className="border border-black p-2 text-left">Aluno</th>
              {datasAulas.map(dt => <th key={dt} className="border border-black w-12 text-[9px]">{dt}</th>)}
              <th className="border border-black w-12 text-[9px]">Faltas</th>
            </tr>
          </thead>
          <tbody>
            {alunosLocais.map((aluno, i) => {
              const faltas = Object.values(presencas[i] || {}).filter(v => v === "F").length;
              return (
                <tr key={i} className="h-10">
                  <td className="border border-black text-center text-xs text-gray-400">{i+1}</td>
                  <td className="border border-black px-2">
                    <input 
                      className={`w-full bg-transparent outline-none font-bold ${faltas >= 3 ? 'text-red-600' : ''}`}
                      value={aluno.nome}
                      onChange={(e) => {
                        const n = [...alunosLocais];
                        n[i].nome = e.target.value.toUpperCase();
                        setAlunosLocais(n);
                      }}
                      onBlur={() => salvarAlunoNoBanco(i, aluno.id)}
                    />
                  </td>
                  {datasAulas.map(dt => (
                    <td key={dt} onClick={() => alternarPresenca(i, dt)} className={`border border-black text-center cursor-pointer text-xl ${presencas[i]?.[dt] === 'P' ? 'bg-green-100' : presencas[i]?.[dt] === 'F' ? 'bg-red-100' : ''}`}>
                      {presencas[i]?.[dt]}
                    </td>
                  ))}
                  <td className={`border border-black text-center ${faltas >= 3 ? 'bg-red-600 text-white' : ''}`}>{faltas || ""}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <style jsx global>{` @media print { .no-print { display: none !important; } } `}</style>
    </div>
  )
}