'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function CasaDaCultura2026() {
  const [tela, setTela] = useState('menu')
  const [profSel, setProfSel] = useState("")
  const [filtroOficina, setFiltroOficina] = useState("")
  const [idAtivo, setIdAtivo] = useState<any>(null)
  const [mes, setMes] = useState(new Date().getMonth())
  const [turmas, setTurmas] = useState<any[]>([])
  const [alunosLocais, setAlunosLocais] = useState<any[]>([])
  const [presencas, setPresencas] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [contagemAlunos, setContagemAlunos] = useState<any>({})
  
  // Estados para a Busca Ativa
  const [todosAlunos, setTodosAlunos] = useState<any[]>([])
  const [todasPresencas, setTodasPresencas] = useState<any[]>([])

  const mesesNomes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]

  // 1. CARREGAMENTO INICIAL
  useEffect(() => { 
    fetchTurmas(); 
    fetchDadosGlobais(); 
  }, [mes]);

  useEffect(() => { 
    if (idAtivo) fetchDadosTurma(); 
  }, [idAtivo, mes]);

  async function fetchTurmas() {
    const { data: tData } = await supabase.from('turmas').select('*');
    const { data: aData } = await supabase.from('alunos').select('turma_id');
    const contagem: any = {};
    aData?.forEach(a => { contagem[a.turma_id] = (contagem[a.turma_id] || 0) + 1; });
    setContagemAlunos(contagem);
    if (tData) setTurmas(tData.sort((a, b) => a.horario.localeCompare(b.horario)));
    setLoading(false);
  }

  async function fetchDadosGlobais() {
    const { data: alu } = await supabase.from('alunos').select('*');
    const { data: freq } = await supabase.from('frequencia').select('*').eq('mes', mes);
    if (alu) setTodosAlunos(alu);
    if (freq) setTodasPresencas(freq);
  }

  async function fetchDadosTurma() {
    const { data: alData } = await supabase.from('alunos').select('*').eq('turma_id', idAtivo).order('posicao', { ascending: true });
    const { data: preData } = await supabase.from('frequencia').select('*').eq('turma_id', idAtivo).eq('mes', mes);
    if (alData) setAlunosLocais(alData);
    const gridPre: any = {};
    preData?.forEach(p => {
      if(p.aluno_id) {
        if(!gridPre[p.aluno_id]) gridPre[p.aluno_id] = {};
        gridPre[p.aluno_id][p.data_aula] = p.status;
      }
    });
    setPresencas(gridPre);
  }

  // 2. FUNÇÕES DE APOIO (PRESERVADAS)
  const obterSaudacaoOficial = (oficina: string) => {
    const o = oficina?.toUpperCase() || "";
    const base = "A unidade da Casa da Cultura do Jardim Europa deseja ao professor de ";
    const final = " um ótimo mês de março — ";
    if (o.includes("PERCUSSÃO") || o.includes("BATERIA")) return `${base}Percussão${final}que o ritmo continue sendo sua energia diária.`;
    if (o.includes("VIOLINO")) return `${base}Violino${final}que a música siga afinando os dias.`;
    if (o.includes("PIANO") || o.includes("TECLADO")) return `${base}Piano${final}que as melodias tornem seus dias mais leves.`;
    if (o.includes("VOCAL") || o.includes("CORO") || o.includes("CANTO")) return `${base}Técnica Vocal e Coro${final}que sua voz continue ecoando incentivo.`;
    if (o.includes("FLAUTA")) return `${base}Flauta${final}que o sopro da música renove suas energias.`;
    if (o.includes("VIOLÃO")) return `${base}Violão${final}que cada acorde continue espalhando inspiração.`;
    return "A unidade da Casa da Cultura do Jardim Europa deseja um ótimo mês a todos.";
  };

  const salvarAlunoNoBanco = async (index: number) => {
    const aluno = alunosLocais[index];
    if (!aluno?.nome || aluno.nome.trim() === "") return null;
    const payload = { turma_id: idAtivo, nome: aluno.nome.trim().toUpperCase(), telefone: aluno.telefone || "", posicao: index };
    if (aluno.id) {
      await supabase.from('alunos').update(payload).eq('id', aluno.id);
      return aluno.id;
    } else {
      const { data: novo } = await supabase.from('alunos').insert(payload).select();
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
    if (!aId) aId = await salvarAlunoNoBanco(index);
    if (!aId) return;
    const atual = presencas[aId]?.[dataAula] || "";
    let novoStatus = (atual === "") ? "P" : (atual === "P") ? "F" : (atual === "F") ? "J" : "";
    setPresencas((p: any) => ({ ...p, [aId]: { ...(p[aId] || {}), [dataAula]: novoStatus } }));
    if (novoStatus === "") await supabase.from('frequencia').delete().eq('aluno_id', aId).eq('data_aula', dataAula).eq('mes', mes);
    else await supabase.from('frequencia').upsert({ aluno_id: aId, turma_id: idAtivo, data_aula: dataAula, mes: mes, status: novoStatus });
    fetchDadosGlobais(); // Atualiza a busca ativa em tempo real
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-2xl uppercase italic bg-white">CARREGANDO...</div>;

  // --- TELA 1: MENU PRINCIPAL ---
  if (tela === 'menu') {
    const listaProfessores = [...new Set(turmas.map(t => t.oficina.toUpperCase().includes("PIANO") ? `MICHEL (PIANO)` : t.professor))].sort();
    return (
      <div className="min-h-screen p-8 bg-[#F8FAFC] italic font-black uppercase text-center">
        <h1 className="text-4xl font-black mb-8 border-l-8 border-black pl-6 italic inline-block tracking-tighter">CASA DA CULTURA <span className="text-blue-600">2026</span></h1>
        
        <div className="mb-10">
          <button onClick={() => setTela('busca')} className="bg-red-600 text-white px-8 py-4 border-4 border-black shadow-[6px_6px_0px_#000] hover:translate-y-[-2px] transition-all text-lg animate-pulse">
            🔍 LISTA DE BUSCA ATIVA (FALTOSOS)
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {listaProfessores.map(p => (
            <button key={p} onClick={() => { 
              const isPiano = p === "MICHEL (PIANO)";
              setProfSel(isPiano ? "MICHEL" : p); 
              setFiltroOficina(isPiano ? "PIANO" : ""); 
              setTela('lista'); 
            }} className="border-4 border-black bg-white p-8 flex flex-col items-center shadow-[6px_6px_0px_#000] hover:translate-y-[-2px] transition-all">
              {p}
              <span className="text-[10px] text-blue-600 mt-2">TURMAS DISPONÍVEIS</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // --- TELA 2: BUSCA ATIVA ---
  if (tela === 'busca') {
    const alunosFaltosos = todosAlunos.map(a => {
      const faltas = todasPresencas.filter(f => f.aluno_id === a.id && f.status === 'F').length;
      const turma = turmas.find(t => t.id === a.turma_id);
      return { ...a, faltas, turma };
    }).filter(a => a.faltas >= 3)
      .sort((a, b) => {
        const cursoA = a.turma?.oficina || "";
        const cursoB = b.turma?.oficina || "";
        if (cursoA !== cursoB) return cursoA.localeCompare(cursoB);
        const horarioA = a.turma?.horario || "";
        const horarioB = b.turma?.horario || "";
        return horarioA.localeCompare(horarioB);
      });

    return (
      <div className="min-h-screen p-8 bg-white italic font-black uppercase">
        <nav className="no-print flex justify-between items-center mb-8 border-b-4 border-black pb-4">
           <button onClick={() => setTela('menu')} className="border-4 border-black px-4 py-2 bg-gray-100 hover:bg-black hover:text-white transition-colors">← VOLTAR AO MENU</button>
           <button onClick={() => window.print()} className="bg-black text-white px-8 py-2 border-4 border-black">IMPRIMIR RELATÓRIO</button>
        </nav>
        
        <h2 className="text-5xl mb-2 tracking-tighter">RELATÓRIO DE BUSCA ATIVA</h2>
        <p className="mb-8 text-red-600 border-l-4 border-red-600 pl-3">MÊS DE {mesesNomes[mes].toUpperCase()} - ALUNOS COM 3 OU MAIS FALTAS</p>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border-4 border-black">
            <thead>
              <tr className="bg-black text-white text-[10px]">
                <th className="p-3 text-left border-r border-white">OFICINA / CURSO</th>
                <th className="p-3 text-left border-r border-white">DIA</th>
                <th className="p-3 text-left border-r border-white">HORÁRIO</th>
                <th className="p-3 text-left border-r border-white">NOME DO ALUNO</th>
                <th className="p-3 text-center border-r border-white">FALTAS</th>
                <th className="p-3 text-left">TELEFONE DE CONTATO</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {alunosFaltosos.length > 0 ? alunosFaltosos.map((a, i) => (
                <tr key={i} className="border-b-2 border-black hover:bg-red-50">
                  <td className="p-3 border-r-2 border-black font-bold">{a.turma?.oficina}</td>
                  <td className="p-3 border-r-2 border-black">{String(a.turma?.dias).includes('2') ? "TER/QUI" : "SEG/QUA"}</td>
                  <td className="p-3 border-r-2 border-black">{a.turma?.horario}</td>
                  <td className="p-3 border-r-2 border-black text-sm">{a.nome}</td>
                  <td className="p-3 border-r-2 border-black text-center text-red-600 text-lg">{a.faltas}</td>
                  <td className="p-3">{a.telefone || "SEM TELEFONE"}</td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="p-10 text-center text-gray-400">NENHUM ALUNO COM EXCESSO DE FALTAS NESTE MÊS.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // --- TELA 3: LISTA DE TURMAS (PROFESSOR) ---
  if (tela === 'lista') {
    const turmasDoProf = turmas.filter(t => filtroOficina === "PIANO" ? (t.professor === profSel && t.oficina.toUpperCase().includes("PIANO")) : (t.professor === profSel && !t.oficina.toUpperCase().includes("PIANO")));
    return (
      <div className="min-h-screen p-8 max-w-6xl mx-auto italic font-black uppercase">
        <button onClick={() => setTela('menu')} className="text-xs mb-8 border-2 border-black px-2 py-1 bg-gray-50">← VOLTAR</button>
        <h2 className="text-6xl mb-12 border-b-8 border-black pb-4 tracking-tighter">{filtroOficina === "PIANO" ? "MICHEL (PIANO)" : profSel}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {[1, 2].map(d => (
            <div key={d}>
              <h3 className={`p-3 mb-6 text-center border-4 border-black ${d===1?'bg-blue-600':'bg-red-600'} text-white shadow-[4px_4px_0px_#000]`}>{d===1?'SEGUNDA E QUARTA':'TERÇA E QUINTA'}</h3>
              <div className="space-y-4">
                {turmasDoProf.filter(t => String(t.dias).includes(String(d))).map(c => (
                  <div key={c.id} onClick={() => {setIdAtivo(c.id); setTela('chamada');}} className="bg-white border-4 p-4 cursor-pointer shadow-[6px_6px_0px_#000] flex justify-between items-center hover:translate-y-[-2px] transition-all">
                    <div><span className="text-2xl block leading-none">{c.horario}</span><span className="text-[10px] text-gray-400 font-bold italic">{c.oficina}</span></div>
                    <div className="text-right font-black italic"><span className="text-lg">{contagemAlunos[c.id] || 0} ALUNOS</span></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- TELA 4: CHAMADA (ESTILO ORIGINAL PRESERVADO) ---
  const curso = turmas.find(t => t.id === idAtivo);
  const diasTexto = String(curso?.dias).includes('2') ? "TERÇA E QUINTA" : "SEGUNDA E QUARTA";

  return (
    <div className="min-h-screen italic font-black uppercase bg-white">
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          .folha-container { border: none !important; box-shadow: none !important; max-width: 100% !important; padding: 12mm !important; margin: 0 !important; }
          table { width: 100% !important; border-width: 2px !important; }
          body { background: white !important; -webkit-print-color-adjust: exact; }
        }
      `}</style>
      <nav className="no-print bg-white border-b-4 border-black p-4 sticky top-0 z-50 flex justify-between items-center px-8 shadow-md">
        <button onClick={()=>setTela('lista')} className="text-xs border-4 border-black px-4 py-2 italic font-black">← VOLTAR</button>
        <div className="flex gap-4">
          <button onClick={() => setAlunosLocais([...alunosLocais, {nome:"", telefone:"", posicao:alunosLocais.length, id:null}])} className="bg-blue-600 text-white px-4 py-2 text-[10px] border-4 border-black shadow-[4px_4px_0px_#000]">NOVO ALUNO +</button>
          <select value={mes} onChange={e => setMes(Number(e.target.value))} className="border-4 border-black p-1 text-xs">{mesesNomes.map((m,i)=><option key={i} value={i}>{m}</option>)}</select>
          <button onClick={()=>window.print()} className="bg-black text-white px-6 py-2 text-[10px] border-4 border-black">IMPRIMIR FOLHA</button>
        </div>
      </nav>

      <div className="folha-container max-w-[1300px] mx-auto p-10 mt-4 border-4 border-black bg-white shadow-2xl mb-10">
        <header className="flex justify-between items-end mb-6 border-b-8 border-black pb-4">
          <div>
            <h1 className="text-5xl tracking-tighter mb-2 leading-none uppercase">{curso?.professor}</h1>
            <div className="flex gap-3 text-sm items-center">
                <span className="bg-black text-white px-3 py-1">{diasTexto}</span>
                <span className="border-2 border-black px-3 py-0.5">{curso?.oficina}</span>
                <span className="font-bold underline">{curso?.horario}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-5xl block leading-none">{mesesNomes[mes]}</span>
            <span className="text-[9px] text-gray-500 font-bold tracking-widest text-center">CASA DA CULTURA 2026</span>
          </div>
        </header>

        <table className="w-full border-collapse border-4 border-black">
          <thead>
            <tr className="bg-gray-100 italic">
              <th className="border-2 border-black w-8 text-[10px]">Nº</th>
              <th className="border-2 border-black p-2 text-left min-w-[280px]">NOME DO ALUNO</th>
              {(() => {
                const diasAlvo = String(curso?.dias).includes('2') ? [2, 4] : [1, 3];
                const datas = [];
                const ultimoDia = new Date(2026, mes + 1, 0).getDate();
                for (let d = 1; d <= ultimoDia; d++) {
                  const dataProd = new Date(2026, mes, d);
                  if (diasAlvo.includes(dataProd.getDay())) datas.push(`${d < 10 ? '0'+d : d}/${mes+1 < 10 ? '0'+(mes+1) : mes+1}`);
                }
                return datas.map(dt => <th key={dt} className="border-2 border-black w-14 text-[9px]">{dt}</th>);
              })()}
              <th className="border-2 border-black w-12 text-[9px] no-print">FALTAS</th>
            </tr>
          </thead>
          <tbody>
            {alunosLocais.map((aluno, i) => {
              const f = Object.values(presencas[aluno.id] || {}).filter(v => v === "F").length;
              return (
                <tr key={aluno.id || `temp-${i}`}>
                  <td className="border-2 border-black text-center text-[10px] italic">{i+1}</td>
                  <td className="border-2 border-black px-2">
                    <input className={`w-full bg-transparent outline-none font-black text-xs uppercase italic ${f >= 3 ? 'text-red-600 underline' : 'text-black'}`} 
                           value={aluno.nome || ""} 
                           onChange={(e) => { const n = [...alunosLocais]; n[i].nome = e.target.value.toUpperCase(); setAlunosLocais(n); }} 
                           onBlur={() => salvarAlunoNoBanco(i)} />
                  </td>
                  {(() => {
                    const diasAlvo = String(curso?.dias).includes('2') ? [2, 4] : [1, 3];
                    const datas = [];
                    const ultimoDia = new Date(2026, mes + 1, 0).getDate();
                    for (let d = 1; d <= ultimoDia; d++) {
                      const dataProd = new Date(2026, mes, d);
                      if (diasAlvo.includes(dataProd.getDay())) datas.push(`${d < 10 ? '0'+d : d}/${mes+1 < 10 ? '0'+(mes+1) : mes+1}`);
                    }
                    return datas.map(dt => (
                      <td key={dt} onClick={() => alternarPresenca(i, dt)} 
                          className={`border-2 border-black text-center cursor-pointer text-xl font-black 
                          ${presencas[aluno.id]?.[dt] === 'P' ? 'bg-green-100 text-green-700' : 
                            presencas[aluno.id]?.[dt] === 'F' ? 'bg-red-100 text-red-700' : 
                            presencas[aluno.id]?.[dt] === 'J' ? 'bg-blue-100 text-blue-700' : ''}`}>
                        {presencas[aluno.id]?.[dt]}
                      </td>
                    ));
                  })()}
                  <td className="border-2 border-black text-center text-sm no-print font-bold text-red-600">{f}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <footer className="mt-10 flex justify-between items-center">
            <p className="text-[10px] max-w-[60%] border-l-4 border-black pl-4">{obterSaudacaoOficial(curso?.oficina || "")}</p>
            <div className="text-center">
              <div className="w-64 border-b-2 border-black mb-1"></div>
              <p className="text-[9px]">ASSINATURA DO PROFESSOR: {curso?.professor}</p>
            </div>
        </footer>
      </div>
    </div>
  );
}

