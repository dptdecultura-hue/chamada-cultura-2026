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
  
  const [todosAlunos, setTodosAlunos] = useState<any[]>([])
  const [todasPresencas, setTodasPresencas] = useState<any[]>([])

  const mesesNomes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]

  useEffect(() => { fetchTurmas(); fetchDadosGlobais(); }, [mes]);
  useEffect(() => { if (idAtivo) fetchDadosTurma(); }, [idAtivo, mes]);

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

  const salvarAlunoNoBanco = async (index: number) => {
    const aluno = alunosLocais[index];
    if (!aluno?.nome || aluno.nome.trim() === "") return null;
    const payload = { 
        turma_id: idAtivo, 
        nome: aluno.nome.trim().toUpperCase(), 
        telefone: aluno.telefone || "", 
        genero: aluno.genero || "",
        posicao: index 
    };
    if (aluno.id) {
      await supabase.from('alunos').update(payload).eq('id', aluno.id);
    } else {
      const { data: novo } = await supabase.from('alunos').insert(payload).select();
      if (novo?.[0]) {
        const n = [...alunosLocais]; n[index].id = novo[0].id; setAlunosLocais(n);
      }
    }
    fetchDadosGlobais();
    fetchTurmas();
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
    fetchDadosGlobais();
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-2xl uppercase italic bg-white tracking-widest animate-pulse">CARREGANDO...</div>;

  // --- LÓGICA DE ESTATÍSTICAS ---
  const totalMatriculados = todosAlunos.length;
  const alunosComPresenca = new Set(todasPresencas.filter(f => f.status === 'P').map(f => f.aluno_id));
  const totalAtivos = alunosComPresenca.size;
  const totalMulheres = todosAlunos.filter(a => a.genero === 'F').length;
  const totalHomens = todosAlunos.filter(a => a.genero === 'M').length;

  // --- TELA: MENU ---
  if (tela === 'menu') {
    const listaProfessores = [...new Set(turmas.map(t => t.oficina.toUpperCase().includes("PIANO") ? `MICHEL (PIANO)` : t.professor))].sort();
    return (
      <div className="min-h-screen p-8 bg-[#F8FAFC] italic font-black uppercase text-center">
        <h1 className="text-4xl font-black mb-8 border-l-8 border-black pl-6 italic inline-block tracking-tighter">CASA DA CULTURA <span className="text-blue-600">2026</span></h1>
        
        {/* Painel de Censo */}
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#000]">
                <span className="text-[10px] block">MATRICULADOS</span>
                <span className="text-3xl text-blue-600">{totalMatriculados}</span>
            </div>
            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#000]">
                <span className="text-[10px] block">ATIVOS (P)</span>
                <span className="text-3xl text-green-600">{totalAtivos}</span>
            </div>
            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#000]">
                <span className="text-[10px] block">MULHERES</span>
                <span className="text-3xl text-pink-500">{totalMulheres}</span>
            </div>
            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#000]">
                <span className="text-[10px] block">HOMENS</span>
                <span className="text-3xl text-blue-400">{totalHomens}</span>
            </div>
        </div>

        <div className="mb-10">
          <button onClick={() => setTela('busca')} className="bg-red-600 text-white px-8 py-4 border-4 border-black shadow-[6px_6px_0px_#000] hover:translate-y-[-2px] transition-all text-lg animate-pulse">
            🔍 LISTA DE BUSCA ATIVA (FALTOSOS)
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {listaProfessores.map(p => {
            const isPiano = p === "MICHEL (PIANO)";
            const turmasDeste = turmas.filter(t => isPiano ? (t.professor === "MICHEL" && t.oficina.toUpperCase().includes("PIANO")) : (t.professor === p && !t.oficina.toUpperCase().includes("PIANO")));
            const totalM = turmasDeste.reduce((acc, t) => acc + (contagemAlunos[t.id] || 0), 0);
            return (
              <button key={p} onClick={() => { setProfSel(isPiano ? "MICHEL" : p); setFiltroOficina(isPiano ? "PIANO" : ""); setTela('lista'); }} className="border-4 border-black bg-white p-8 flex flex-col items-center shadow-[6px_6px_0px_#000] hover:translate-y-[-2px] transition-all">
                <span className="text-sm">{p}</span>
                <span className="text-[10px] text-blue-600 mt-2 font-bold">{totalM} ALUNOS</span>
              </button>
            )
          })}
        </div>
      </div>
    );
  }

  // --- TELA: BUSCA ATIVA (Igual anterior) ---
  if (tela === 'busca') {
    const alunosFaltosos = todosAlunos.map(a => {
      const faltas = todasPresencas.filter(f => f.aluno_id === a.id && f.status === 'F').length;
      const turma = turmas.find(t => t.id === a.turma_id);
      return { ...a, faltas, turma };
    }).filter(a => a.faltas >= 3)
      .sort((a, b) => (a.turma?.oficina || "").localeCompare(b.turma?.oficina || ""));

    return (
      <div className="min-h-screen p-8 bg-white italic font-black uppercase">
        <nav className="no-print flex justify-between items-center mb-8 border-b-4 border-black pb-4">
           <button onClick={() => setTela('menu')} className="border-4 border-black px-4 py-2">← VOLTAR AO MENU</button>
           <button onClick={() => window.print()} className="bg-black text-white px-8 py-2 border-4 border-black">IMPRIMIR RELATÓRIO</button>
        </nav>
        <h2 className="text-5xl mb-2 tracking-tighter uppercase">Relatório de Busca Ativa</h2>
        <table className="w-full border-collapse border-4 border-black">
          <thead>
            <tr className="bg-black text-white text-[10px]">
              <th className="p-3 text-left border-r border-white">CURSO</th>
              <th className="p-3 text-left border-r border-white">ALUNO</th>
              <th className="p-3 text-center border-r border-white">FALTAS</th>
              <th className="p-3 text-left">CONTATO</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {alunosFaltosos.map((a, i) => (
              <tr key={i} className="border-b-2 border-black">
                <td className="p-3 border-r-2 border-black font-bold">{a.turma?.oficina} - {a.turma?.horario}</td>
                <td className="p-3 border-r-2 border-black text-sm">{a.nome}</td>
                <td className="p-3 border-r-2 border-black text-center text-red-600 text-lg">{a.faltas}</td>
                <td className="p-3 font-bold text-blue-800">{a.telefone || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // --- TELA: LISTA TURMAS ---
  if (tela === 'lista') {
    const turmasDoProf = turmas.filter(t => filtroOficina === "PIANO" ? (t.professor === profSel && t.oficina.toUpperCase().includes("PIANO")) : (t.professor === profSel && !t.oficina.toUpperCase().includes("PIANO")));
    return (
      <div className="min-h-screen p-8 max-w-6xl mx-auto italic font-black uppercase text-center">
        <button onClick={() => setTela('menu')} className="text-xs mb-8 border-2 border-black px-2 py-1 bg-gray-50 font-black">← VOLTAR</button>
        <h2 className="text-6xl mb-12 border-b-8 border-black pb-4 tracking-tighter">{profSel}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {[1, 2].map(d => (
            <div key={d}>
              <h3 className={`p-3 mb-6 border-4 border-black ${d===1?'bg-blue-600':'bg-red-600'} text-white shadow-[4px_4px_0px_#000]`}>{d===1?'SEGUNDA E QUARTA':'TERÇA E QUINTA'}</h3>
              <div className="space-y-4">
                {turmasDoProf.filter(t => String(t.dias).includes(String(d))).map(c => {
                   const matriculados = contagemAlunos[c.id] || 0;
                   const ativos = todasPresencas.filter(f => f.turma_id === c.id && f.status === 'P').map(f => f.aluno_id).length;
                   return (
                    <div key={c.id} onClick={() => {setIdAtivo(c.id); setTela('chamada');}} className="bg-white border-4 border-black p-4 cursor-pointer shadow-[6px_6px_0px_#000] flex justify-between items-center transition-all hover:translate-y-[-2px]">
                      <div className="text-left"><span className="text-2xl block leading-none">{c.horario}</span><span className="text-[10px] text-gray-400 font-bold italic">{c.oficina}</span></div>
                      <div className="text-right font-black italic text-[10px]">
                        <span className="block">MAT: {matriculados}</span>
                        <span className="text-green-600">ATIVOS: {ativos}</span>
                      </div>
                    </div>
                )})}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- TELA: CHAMADA ---
  const curso = turmas.find(t => t.id === idAtivo);
  return (
    <div className="min-h-screen italic font-black uppercase bg-white">
      <nav className="no-print bg-white border-b-4 border-black p-4 flex justify-between items-center px-8 sticky top-0 z-50 shadow-md">
        <button onClick={()=>setTela('lista')} className="border-4 border-black px-4 py-2 font-black italic">← VOLTAR</button>
        <div className="flex gap-4">
          <button onClick={() => setAlunosLocais([...alunosLocais, {nome:"", telefone:"", genero:"", posicao:alunosLocais.length, id:null}])} className="bg-blue-600 text-white px-4 py-2 text-[10px] border-4 border-black">NOVO ALUNO +</button>
          <button onClick={()=>window.print()} className="bg-black text-white px-6 py-2 text-[10px] border-4 border-black">IMPRIMIR PAUTA</button>
        </div>
      </nav>

      <div className="max-w-[1300px] mx-auto p-10 border-4 border-black bg-white mb-10 mt-4">
        <h1 className="text-4xl mb-6 uppercase">{curso?.professor} - {curso?.oficina} ({curso?.horario})</h1>
        <table className="w-full border-collapse border-4 border-black">
          <thead>
            <tr className="bg-gray-100 italic text-[10px]">
              <th className="border-2 border-black w-8">Nº</th>
              <th className="border-2 border-black p-2 text-left">NOME</th>
              <th className="border-2 border-black w-16 no-print">SEXO</th>
              <th className="border-2 border-black p-2 text-left w-32 no-print">TELEFONE</th>
              {(() => {
                const diasAlvo = String(curso?.dias).includes('2') ? [2, 4] : [1, 3];
                const datas = [];
                const ultimoDia = new Date(2026, mes + 1, 0).getDate();
                for (let d = 1; d <= ultimoDia; d++) {
                  const dataProd = new Date(2026, mes, d);
                  if (diasAlvo.includes(dataProd.getDay())) datas.push(`${d}/${mes+1}`);
                }
                return datas.map(dt => <th key={dt} className="border-2 border-black w-10 text-[9px]">{dt}</th>);
              })()}
            </tr>
          </thead>
          <tbody>
            {alunosLocais.map((aluno, i) => (
              <tr key={aluno.id || `temp-${i}`}>
                <td className="border-2 border-black text-center text-[10px] italic">{i+1}</td>
                <td className="border-2 border-black px-2">
                  <input className="w-full bg-transparent outline-none font-black text-xs uppercase italic" value={aluno.nome || ""} onChange={(e) => { const n = [...alunosLocais]; n[i].nome = e.target.value.toUpperCase(); setAlunosLocais(n); }} onBlur={() => salvarAlunoNoBanco(i)} />
                </td>
                <td className="border-2 border-black text-center no-print">
                    <select className="bg-transparent text-[10px] font-black outline-none cursor-pointer" value={aluno.genero || ""} onChange={(e) => { const n = [...alunosLocais]; n[i].genero = e.target.value; setAlunosLocais(n); salvarAlunoNoBanco(i); }}>
                        <option value="">-</option>
                        <option value="M">M</option>
                        <option value="F">F</option>
                    </select>
                </td>
                <td className="border-2 border-black px-2 no-print">
                  <input className="w-full bg-transparent outline-none font-black text-[10px] text-blue-800" value={aluno.telefone || ""} onChange={(e) => { const n = [...alunosLocais]; n[i].telefone = e.target.value; setAlunosLocais(n); }} onBlur={() => salvarAlunoNoBanco(i)} />
                </td>
                {(() => {
                    const diasAlvo = String(curso?.dias).includes('2') ? [2, 4] : [1, 3];
                    const datas = [];
                    const ultimoDia = new Date(2026, mes + 1, 0).getDate();
                    for (let d = 1; d <= ultimoDia; d++) {
                      const dataProd = new Date(2026, mes, d);
                      if (diasAlvo.includes(dataProd.getDay())) datas.push(`${d}/${mes+1}`);
                    }
                    return datas.map(dt => (
                      <td key={dt} onClick={() => alternarPresenca(i, dt)} className={`border-2 border-black text-center cursor-pointer text-lg font-black ${presencas[aluno.id]?.[dt] === 'P' ? 'bg-green-100 text-green-700' : presencas[aluno.id]?.[dt] === 'F' ? 'bg-red-100 text-red-700' : ''}`}>
                        {presencas[aluno.id]?.[dt]}
                      </td>
                    ));
                  })()}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

