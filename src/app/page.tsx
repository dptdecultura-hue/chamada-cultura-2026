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
  const [todosAlunosEvasao, setTodosAlunosEvasao] = useState<any[]>([])

  const mesesNomes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]

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
      const alunoId = p.aluno_id;
      if(alunoId) {
        if(!gridPre[alunoId]) gridPre[alunoId] = {};
        gridPre[alunoId][p.data_aula] = p.status;
      }
    });
    setPresencas(gridPre);
  }

  const salvarAlunoNoBanco = async (index: number) => {
    const aluno = alunosLocais[index];
    if (!aluno?.nome || aluno.nome.trim() === "") return null;

    const payload = { 
      turma_id: idAtivo, 
      nome: aluno.nome.trim().toUpperCase(), 
      telefone: aluno.telefone || "", 
      posicao: index 
    };

    if (aluno.id) {
      await supabase.from('alunos').update(payload).eq('id', aluno.id);
      return aluno.id;
    } else {
      const { data: novo, error } = await supabase.from('alunos').insert(payload).select();
      if (novo && novo[0]) {
        const n = [...alunosLocais];
        n[index].id = novo[0].id;
        setAlunosLocais(n);
        fetchTurmas();
        return novo[0].id;
      }
    }
    return null;
  };

  const alternarPresenca = async (index: number, dataAula: string) => {
    let aId = alunosLocais[index].id;
    
    // Se não tem ID, salva o aluno primeiro
    if (!aId) {
      aId = await salvarAlunoNoBanco(index);
    }

    if (!aId) return;

    const atual = presencas[aId]?.[dataAula] || "";
    let novoStatus = (atual === "") ? "P" : (atual === "P") ? "F" : (atual === "F") ? "J" : "";
    
    // Atualização Visual Imediata
    setPresencas((prev: any) => ({
      ...prev,
      [aId]: { ...(prev[aId] || {}), [dataAula]: novoStatus }
    }));

    // Gravação no Banco
    if (novoStatus === "") {
      await supabase.from('frequencia').delete().match({ aluno_id: aId, data_aula: dataAula, mes: mes });
    } else {
      const { error } = await supabase.from('frequencia').upsert({ 
        aluno_id: aId, 
        turma_id: idAtivo,
        data_aula: dataAula, 
        mes: mes,
        status: novoStatus 
      });
      if (error) console.error("Erro ao salvar frequência:", error);
    }
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

  // --- RENDERS ---
  if (loading) return <div className="h-screen flex items-center justify-center font-black text-2xl uppercase italic">ATUALIZANDO SISTEMA...</div>;

  if (tela === 'menu') return (
    <div className="min-h-screen p-8 bg-[#F8FAFC] italic font-black uppercase text-center">
      <h1 className="text-4xl font-black mb-12 border-l-8 border-black pl-6 italic inline-block tracking-tighter">CASA DA CULTURA <span className="text-blue-600">2026</span></h1>
      <div className="mb-12">
        <button onClick={() => { setLoading(true); setTela('evasao'); fetchTurmas(); carregarRelatorioEvasao(); }} className="bg-red-600 text-white p-6 border-4 border-black shadow-[8px_8px_0px_#000] hover:translate-y-[-4px] transition-all text-xl w-full md:w-auto px-12">⚠️ CENTRAL DE EVASÃO</button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {[...new Set(turmas.map(t => t.professor))].sort().map(p => (
          <button key={p} onClick={() => {setProfSel(p); setTela('lista');}} className="border-4 border-black bg-white p-8 text-sm flex flex-col items-center shadow-[6px_6px_0px_#000] hover:translate-y-[-2px] transition-all">
            {p}
            <span className="text-[10px] text-blue-600 mt-2 font-bold italic">{turmas.filter(t => t.professor === p).reduce((acc, t) => acc + (contagemAlunos[t.id] || 0), 0)} ALUNOS</span>
          </button>
        ))}
      </div>
    </div>
  );

  async function carregarRelatorioEvasao() {
    const { data: alData } = await supabase.from('alunos').select('*, turmas(professor, oficina)');
    const { data: preData } = await supabase.from('frequencia').select('*').eq('mes', mes).eq('status', 'F');
    const faltasPorAluno: any = {};
    preData?.forEach(p => { faltasPorAluno[p.aluno_id] = (faltasPorAluno[p.aluno_id] || 0) + 1; });
    const emRisco = alData?.filter(a => (faltasPorAluno[a.id] || 0) >= 3).map(a => ({
      ...a, qtdFaltas: faltasPorAluno[a.id], professor: a.turmas?.professor, oficina: a.turmas?.oficina
    })) || [];
    setTodosAlunosEvasao(emRisco.sort((a, b) => b.qtdFaltas - a.qtdFaltas));
    setLoading(false);
  }

  if (tela === 'evasao') return (
    <div className="min-h-screen p-8 bg-white italic font-black uppercase max-w-6xl mx-auto border-x-4 border-black">
      <button onClick={() => setTela('menu')} className="text-xs mb-8 border-2 border-black px-4 py-2 font-bold bg-gray-100 italic">← VOLTAR</button>
      <h2 className="text-5xl mb-10 border-b-8 border-red-600 pb-2 font-black">CONTROLE DE EVASÃO</h2>
      <div className="space-y-4">
        {todosAlunosEvasao.map(al => (
          <div key={al.id} className="border-4 border-black p-6 flex justify-between items-center shadow-[6px_6px_0px_#000] bg-red-50">
            <div><span className="text-2xl block leading-none">{al.nome}</span><span className="text-[10px] bg-black text-white px-2 py-1 italic">{al.oficina}</span><span className="ml-4 text-red-600 text-sm underline italic font-black">{al.qtdFaltas} FALTAS</span></div>
            <a href={`https://wa.me/55${al.telefone?.replace(/\D/g,'')}?text=Olá ${al.nome}, Casa da Cultura aqui!`} target="_blank" className="bg-green-500 text-white px-6 py-3 border-4 border-black shadow-[4px_4px_0px_#000] text-xs font-black">WHATSAPP</a>
          </div>
        ))}
      </div>
    </div>
  );

  if (tela === 'lista') {
    const turmasDoProf = turmas.filter(t => t.professor === profSel);
    return (
      <div className="min-h-screen p-8 max-w-6xl mx-auto italic font-black uppercase">
        <button onClick={() => setTela('menu')} className="text-xs mb-8 border-2 border-black px-2 py-1 font-bold italic bg-gray-50">← VOLTAR</button>
        <h2 className="text-6xl mb-12 border-b-8 border-black pb-4 tracking-tighter">{profSel}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {[1, 2].map(d => (
            <div key={d}>
              <h3 className={`p-3 mb-6 text-center border-4 border-black ${d===1?'bg-blue-600':'bg-red-600'} text-white shadow-[4px_4px_0px_#000]`}>{d===1?'SEGUNDA E QUARTA':'TERÇA E QUINTA'}</h3>
              <div className="space-y-4">
                {turmasDoProf.filter(t => String(t.dias).includes(String(d))).map(c => (
                  <div key={c.id} onClick={() => {setIdAtivo(c.id); setTela('chamada');}} className="bg-white border-4 border-black p-4 cursor-pointer shadow-[6px_6px_0px_#000] flex justify-between items-center hover:translate-y-[-2px] transition-all">
                    <div><span className="text-2xl block leading-none">{c.horario}</span><span className="text-[10px] text-gray-400 font-bold italic">{c.oficina}</span></div>
                    <div className="text-right font-black"><span className="text-lg">{contagemAlunos[c.id] || 0} ALUNOS</span></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const cursoAtivo = turmas.find(c => c.id === idAtivo);
  const datasAulas = cursoAtivo ? getDatasDoMes(cursoAtivo.dias) : [];

  return (
    <div className="min-h-screen italic font-black uppercase bg-white">
      <style>{`@media print { .no-print { display: none !important; } .folha-container { border: none !important; box-shadow: none !important; width: 100% !important; max-width: 100% !important; } }`}</style>
      <nav className="no-print bg-white border-b-4 border-black p-4 sticky top-0 z-50 flex justify-between items-center px-8 shadow-md">
        <button onClick={()=>setTela('lista')} className="text-xs border-4 border-black px-4 py-2 font-bold bg-white italic">← VOLTAR</button>
        <div className="flex gap-4">
          <button onClick={() => setAlunosLocais([...alunosLocais, {nome:"", telefone:"", posicao:alunosLocais.length, id:null}])} className="bg-blue-600 text-white px-4 py-2 text-[10px] border-4 border-black shadow-[4px_4px_0px_#000] font-black italic">NOVO ALUNO +</button>
          <select value={mes} onChange={e => setMes(Number(e.target.value))} className="border-4 border-black p-1 text-xs font-black italic">{mesesNomes.map((m,i)=><option key={i} value={i}>{m}</option>)}</select>
          <button onClick={()=>window.print()} className="bg-black text-white px-6 py-2 text-[10px] border-4 border-black font-black italic">IMPRIMIR</button>
        </div>
      </nav>

      <div className="folha-container max-w-[1300px] mx-auto p-10 mt-6 border-4 border-black shadow-2xl bg-white mb-20">
        <header className="flex justify-between items-end mb-8 border-b-8 border-black pb-4 uppercase italic">
          <div><h1 className="text-6xl tracking-tighter mb-2 font-black leading-none">{cursoAtivo?.professor}</h1><div className="flex gap-3 font-black text-lg"><span>{cursoAtivo?.oficina}</span><span className="bg-black text-white px-2 py-0.5 text-xs">{cursoAtivo?.horario}</span></div></div>
          <div className="text-right font-black italic uppercase"><span className="text-5xl block leading-none">{mesesNomes[mes]}</span><span className="text-[10px] text-gray-400 italic font-bold tracking-tighter">CASA DA CULTURA 2026</span></div>
        </header>

        <table className="w-full border-collapse border-4 border-black italic font-black uppercase">
          <thead>
            <tr className="bg-gray-100 font-black">
              <th className="border-2 border-black w-10 text-[10px]">Nº</th>
              <th className="border-2 border-black p-2 text-left min-w-[300px]">NOME DO ALUNO</th>
              <th className="border-2 border-black p-2 text-left w-40 no-print">TEL</th>
              {datasAulas.map(dt => <th key={dt} className="border-2 border-black w-14 text-[9px]">{dt}</th>)}
              <th className="border-2 border-black w-12 text-[9px] no-print">FALTAS</th>
              <th className="border-2 border-black w-10 no-print"></th>
            </tr>
          </thead>
          <tbody>
            {alunosLocais.map((aluno, i) => {
              const faltas = Object.values(presencas[aluno.id] || {}).filter(v => v === "F").length;
              return (
                <tr key={aluno.id || `temp-${i}`}>
                  <td className="border-2 border-black text-center text-[10px] font-black italic">{i+1}</td>
                  <td className="border-2 border-black px-2">
                    <input className={`w-full bg-transparent outline-none font-black text-sm uppercase italic ${faltas >= 3 ? 'text-red-600 underline' : 'text-black'}`} 
                           value={aluno.nome || ""} 
                           onChange={(e) => { const n = [...alunosLocais]; n[i].nome = e.target.value.toUpperCase(); setAlunosLocais(n); }} 
                           onBlur={() => salvarAlunoNoBanco(i)} 
                           placeholder="DIGITE O NOME..." />
                  </td>
                  <td className="border-2 border-black px-2 no-print">
                    <input className="w-full bg-transparent outline-none text-[10px] font-black italic" 
                           value={aluno.telefone || ""} 
                           onChange={(e) => { const n = [...alunosLocais]; n[i].telefone = e.target.value; setAlunosLocais(n); }} 
                           onBlur={() => salvarAlunoNoBanco(i)} 
                           placeholder="TEL..." />
                  </td>
                  {datasAulas.map(dt => (
                    <td key={dt} onClick={() => alternarPresenca(i, dt)} 
                        className={`border-2 border-black text-center cursor-pointer text-xl font-black select-none 
                        ${presencas[aluno.id]?.[dt] === 'P' ? 'bg-green-100 text-green-700' : 
                          presencas[aluno.id]?.[dt] === 'F' ? 'bg-red-100 text-red-700' : 
                          presencas[aluno.id]?.[dt] === 'J' ? 'bg-blue-100 text-blue-700' : ''}`}>
                      {presencas[aluno.id]?.[dt]}
                    </td>
                  ))}
                  <td className="border-2 border-black text-center no-print font-black text-lg">{faltas}</td>
                  <td className="border-2 border-black text-center no-print">
                    <button onClick={() => { if(confirm("EXCLUIR?")) { 
                      supabase.from('frequencia').delete().eq('aluno_id', aluno.id).then(() => {
                        supabase.from('alunos').delete().eq('id', aluno.id).then(() => fetchDados());
                      });
                    }}} className="text-gray-200 hover:text-red-600 font-bold text-[10px]">X</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

