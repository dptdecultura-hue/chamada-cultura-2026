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

  const salvarAlunoNoBanco = async (index: number) => {
    const aluno = alunosLocais[index];
    if (!aluno?.nome || aluno.nome.trim() === "") return;

    // BLOQUEIO DE DUPLICIDADE: 
    // Tentamos encontrar se já existe um registro para esta turma e esta posição
    const { data: existente } = await supabase
      .from('alunos')
      .select('id')
      .eq('turma_id', idAtivo)
      .eq('posicao', index)
      .maybeSingle();

    const payload = {
      turma_id: idAtivo,
      nome: aluno.nome.trim().toUpperCase(),
      telefone: aluno.telefone || "",
      posicao: index
    };

    if (existente) {
      // Se já existe, atualizamos esse ID específico
      await supabase.from('alunos').update(payload).eq('id', existente.id);
    } else {
      // Se não existe, inserimos um novo
      const { data: novo } = await supabase.from('alunos').insert(payload).select();
      if (novo) {
        const n = [...alunosLocais];
        n[index].id = novo[0].id;
        setAlunosLocais(n);
      }
    }
    fetchTurmas(); // Atualiza contador global
  };

  const excluirAluno = async (index: number, idReal: any) => {
    if (!confirm("CONFIRMA A EXCLUSÃO DEFINITIVA?")) return;
    if (idReal) {
      await supabase.from('frequencia').delete().eq('aluno_posicao', index).eq('turma_id', idAtivo);
      await supabase.from('alunos').delete().eq('id', idReal);
    }
    const n = [...alunosLocais];
    n.splice(index, 1);
    const reordenados = n.map((al, idx) => ({ ...al, posicao: idx }));
    setAlunosLocais(reordenados);
    fetchTurmas();
  };

  const getDatasDoMes = (diasSemanaInput: any) => {
    const datas = [];
    const inputStr = String(diasSemanaInput);
    let diasAlvo = inputStr.includes('2') ? [2, 4] : [1, 3];
    const ultimoDia = new Date(2026, mes + 1, 0).getDate();
    for (let d = 1; d <= ultimoDia; d++) {
      const dataProd = new Date(2026, mes, d);
      if (diasAlvo.includes(dataProd.getDay())) {
        datas.push(`${d < 10 ? '0'+d : d}/${mes+1 < 10 ? '0'+(mes+1) : mes+1}`);
      }
    }
    return datas;
  };

  const alternarPresenca = async (alunoPos: number, dataAula: string) => {
    const atual = presencas[alunoPos]?.[dataAula] || "";
    let novoStatus = (atual === "") ? "P" : (atual === "P") ? "F" : (atual === "F") ? "J" : "";
    setPresencas((prev: any) => ({ ...prev, [alunoPos]: { ...(prev[alunoPos] || {}), [dataAula]: novoStatus } }));
    if (novoStatus === "") {
      await supabase.from('frequencia').delete().match({ turma_id: idAtivo, mes, aluno_posicao: alunoPos, data_aula: dataAula });
    } else {
      await supabase.from('frequencia').upsert({ turma_id: idAtivo, mes, aluno_posicao: alunoPos, data_aula: dataAula, status: novoStatus });
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-2xl animate-pulse italic">Sincronizando...</div>;

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
    return (
      <div className="min-h-screen p-8 max-w-6xl mx-auto italic font-black uppercase">
        <button onClick={() => setTela('menu')} className="text-xs mb-8 border-2 border-black px-2 py-1 font-bold">← Voltar</button>
        <h2 className="text-6xl mb-12 border-b-8 border-black pb-4 tracking-tighter">{profSel}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <h3 className="bg-blue-600 text-white p-3 mb-6 text-center border-4 border-black shadow-[6px_6px_0px_#000]">Segunda e Quarta</h3>
            <div className="space-y-4">
              {turmasDoProf.filter(t => String(t.dias).includes('1')).map(c => {
                const n = contagemAlunos[c.id] || 0;
                return (
                  <div key={c.id} onClick={() => {setIdAtivo(c.id); setTela('chamada');}} className="bg-white border-4 border-black p-4 cursor-pointer hover:scale-[1.02] transition-all flex justify-between items-center shadow-[6px_6px_0px_#000]">
                    <div className="flex flex-col"><span className="text-2xl italic leading-none">{c.horario}</span><span className="text-[10px] text-gray-400 mt-1">{c.oficina}</span></div>
                    <div className="text-right"><span className="text-lg">{n} / {obterLimiteOficina(c.oficina)}</span></div>
                  </div>
                )
              })}
            </div>
          </div>
          <div>
            <h3 className="bg-red-600 text-white p-3 mb-6 text-center border-4 border-black shadow-[6px_6px_0px_#000]">Terça e Quinta</h3>
            <div className="space-y-4">
              {turmasDoProf.filter(t => String(t.dias).includes('2')).map(c => {
                const n = contagemAlunos[c.id] || 0;
                return (
                  <div key={c.id} onClick={() => {setIdAtivo(c.id); setTela('chamada');}} className="bg-white border-4 border-black p-4 cursor-pointer hover:scale-[1.02] transition-all flex justify-between items-center shadow-[6px_6px_0px_#000]">
                    <div className="flex flex-col"><span className="text-2xl italic leading-none">{c.horario}</span><span className="text-[10px] text-gray-400 mt-1">{c.oficina}</span></div>
                    <div className="text-right"><span className="text-lg">{n} / {obterLimiteOficina(c.oficina)}</span></div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const cursoAtivo = turmas.find(c => c.id === idAtivo);
  const datasAulas = cursoAtivo ? getDatasDoMes(cursoAtivo.dias) : [];

  return (
    <div className="min-h-screen italic font-black uppercase bg-white">
      <style>{`
        @media print { 
          @page { size: landscape; margin: 10mm; }
          .no-print { display: none !important; } 
          .folha-container { border: none !important; padding: 0 !important; margin: 0 !important; width: 100% !important; max-width: 100% !important; box-shadow: none !important; }
          table { width: 100% !important; border: 2px solid black !important; }
          th, td { font-size: 10px !important; padding: 4px !important; border: 1px solid black !important; height: 30px !important; }
          .legenda-print { display: flex !important; justify-content: space-between; align-items: flex-end; margin-top: 30px; }
        }
        .legenda-print { display: none; }
      `}</style>

      <nav className="no-print bg-white border-b-4 border-black p-4 sticky top-0 z-50 flex justify-between items-center px-8">
        <button onClick={()=>setTela('lista')} className="text-xs border-4 border-black px-4 py-2 font-bold">← Voltar</button>
        <div className="flex gap-4">
          <button onClick={() => setAlunosLocais([...alunosLocais, {nome:"", telefone:"", posicao:alunosLocais.length, id:null}])} className="bg-blue-600 text-white px-4 py-2 text-[10px] border-4 border-black font-bold shadow-[4px_4px_0px_#000]">Adicionar Aluno +</button>
          <select value={mes} onChange={e => setMes(Number(e.target.value))} className="border-4 border-black p-1 text-xs font-bold">
            {mesesNomes.map((m,i)=><option key={i} value={i}>{m}</option>)}
          </select>
          <button onClick={()=>window.print()} className="bg-black text-white px-6 py-2 text-[10px] border-4 border-black font-bold">Imprimir</button>
        </div>
      </nav>

      <div className="folha-container max-w-[1300px] mx-auto bg-white p-10 mt-6 border-4 border-black shadow-2xl">
        <header className="flex justify-between items-end mb-8 border-b-8 border-black pb-4">
          <div>
            <h1 className="text-6xl tracking-tighter leading-none mb-2">{cursoAtivo?.professor}</h1>
            <div className="flex gap-3 items-center font-bold">
              <span className="text-lg">{cursoAtivo?.oficina}</span>
              <span className="bg-black text-white px-3 py-1 text-xs">{cursoAtivo?.horario}</span>
              <span className="border-2 border-black px-2 py-1 text-[10px]">{String(cursoAtivo?.dias).includes('2') ? "TERÇA E QUINTA" : "SEGUNDA E QUARTA"}</span>
            </div>
          </div>
          <div className="text-right">
             <span className="text-5xl block leading-none">{mesesNomes[mes]}</span>
             <span className="text-[10px] text-gray-400 font-black tracking-widest uppercase italic">Casa da Cultura</span>
          </div>
        </header>

        <table className="w-full border-collapse border-4 border-black">
          <thead>
            <tr className="bg-gray-100 font-bold">
              <th className="border-2 border-black w-10 p-2 text-[10px]">Nº</th>
              <th className="border-2 border-black p-2 text-left min-w-[280px]">Nome Completo</th>
              <th className="border-2 border-black p-2 text-left w-40 no-print">Telefone</th>
              {datasAulas.map(dt => <th key={dt} className="border-2 border-black w-14 text-[9px]">{dt}</th>)}
              <th className="border-2 border-black w-12 text-[9px] no-print">Faltas</th>
              <th className="border-2 border-black w-10 no-print"></th>
            </tr>
          </thead>
          <tbody>
            {alunosLocais.map((aluno, i) => {
              const faltas = Object.values(presencas[i] || {}).filter(v => v === "F").length;
              return (
                <tr key={i}>
                  <td className="border-2 border-black text-center text-[10px] font-bold">{i+1}</td>
                  <td className="border-2 border-black px-2">
                    <input className="w-full bg-transparent outline-none font-black text-sm" value={aluno.nome || ""} onChange={(e) => { const n = [...alunosLocais]; n[i].nome = e.target.value.toUpperCase(); setAlunosLocais(n); }} onBlur={() => salvarAlunoNoBanco(i)} />
                  </td>
                  <td className="border-2 border-black px-2 no-print">
                    <input className="w-full bg-transparent outline-none text-[10px]" value={aluno.telefone || ""} onChange={(e) => { const n = [...alunosLocais]; n[i].telefone = e.target.value; setAlunosLocais(n); }} onBlur={() => salvarAlunoNoBanco(i)} />
                  </td>
                  {datasAulas.map(dt => (
                    <td key={dt} onClick={() => alternarPresenca(i, dt)} className={`border-2 border-black text-center cursor-pointer text-xl font-black select-none ${presencas[i]?.[dt] === 'P' ? 'bg-green-50' : presencas[i]?.[dt] === 'F' ? 'bg-red-50' : presencas[i]?.[dt] === 'J' ? 'bg-blue-50' : ''}`}>
                      {presencas[i]?.[dt]}
                    </td>
                  ))}
                  <td className="border-2 border-black text-center no-print font-bold">{faltas}</td>
                  <td className="border-2 border-black text-center no-print">
                    <button onClick={() => excluirAluno(i, aluno.id)} className="text-gray-300 hover:text-red-600 font-bold text-[10px]">X</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className="legenda-print mt-10 flex justify-between items-end border-t-2 border-gray-100 pt-6">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            Legenda: (P) Presença | (F) Falta | (J) Justificado
          </div>
          <div className="flex flex-col items-center">
            <div className="w-72 border-b-2 border-black mb-2"></div>
            <span className="text-[10px] font-black uppercase italic">Assinatura do Professor</span>
          </div>
        </div>
      </div>
    </div>
  )
}
