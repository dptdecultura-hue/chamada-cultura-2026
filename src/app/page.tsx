'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function CasaDaCultura2026() {
  const [tela, setTela] = useState('menu')
  const [profSel, setProfSel] = useState("")
  const [oficinaSel, setOficinaSel] = useState("") // NOVO: Para separar por curso
  const [idAtivo, setIdAtivo] = useState<any>(null)
  const [mes, setMes] = useState(new Date().getMonth())
  const [turmas, setTurmas] = useState<any[]>([])
  const [alunosLocais, setAlunosLocais] = useState<any[]>([])
  const [presencas, setPresencas] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [contagemAlunos, setContagemAlunos] = useState<any>({})

  const mesesNomes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]

  const obterSaudacaoOficial = (oficina: string) => {
    const o = oficina?.toUpperCase() || "";
    const base = "A unidade da Casa da Cultura do Jardim Europa deseja ao professor de ";
    const final = " um ótimo mês de março — ";

    if (o.includes("PERCUSSÃO") || o.includes("BATERIA")) 
      return `${base}Percussão${final}que o ritmo continue sendo sua energia diária e que cada aula seja tão vibrante quanto o som dos tambores.`;
    if (o.includes("VIOLINO")) 
      return `${base}Violino${final}que a música siga afinando os dias e trazendo inspiração em cada acorde.`;
    if (o.includes("PIANO") || o.includes("TECLADO")) 
      return `${base}Piano${final}que as melodias tornem seus dias mais leves e cheios de harmonia.`;
    if (o.includes("VOCAL") || o.includes("CORO") || o.includes("CANTO")) 
      return `${base}Técnica Vocal e Coro${final}que sua voz continue ecoando incentivo, alegria e paixão pela música.`;
    if (o.includes("FLAUTA")) 
      return `${base}Flauta${final}que o sopro da música renove suas energias e traga leveza à rotina.`;
    if (o.includes("VIOLÃO")) 
      return `${base}Violão${final}que cada acorde continue espalhando inspiração e boas vibrações.`;
    if (o.includes("MUSICALIZAÇÃO")) 
      return `${base}Musicalização${final}que a alegria da descoberta musical siga iluminando cada aula.`;
    
    return "A unidade da Casa da Cultura do Jardim Europa deseja a todos um ótimo mês de março — que a arte continue transformando vidas.";
  };

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
        setContagemAlunos((prev:any) => ({...prev, [idAtivo]: (prev[idAtivo] || 0) + 1}));
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
    if (novoStatus === "") {
        await supabase.from('frequencia').delete().eq('aluno_id', aId).eq('data_aula', dataAula).eq('mes', mes);
    } else {
        await supabase.from('frequencia').upsert({ aluno_id: aId, turma_id: idAtivo, data_aula: dataAula, mes: mes, status: novoStatus });
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-2xl uppercase italic text-black bg-white">CARREGANDO...</div>;

  if (tela === 'menu') {
    // Agrupa por Professor e Oficina para separar Michel Piano de Michel Violão
    const categorias = [...new Set(turmas.map(t => `${t.professor}|${t.oficina}`))].sort();

    return (
      <div className="min-h-screen p-8 bg-[#F8FAFC] italic font-black uppercase text-center">
        <h1 className="text-4xl font-black mb-12 border-l-8 border-black pl-6 italic inline-block tracking-tighter">CASA DA CULTURA <span className="text-blue-600">2026</span></h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {categorias.map(cat => {
            const [p, o] = cat.split('|');
            const totalAlunos = turmas.filter(t => t.professor === p && t.oficina === o).reduce((acc, t) => acc + (contagemAlunos[t.id] || 0), 0);
            return (
              <button key={cat} onClick={() => {setProfSel(p); setOficinaSel(o); setTela('lista');}} className="border-4 border-black bg-white p-6 text-xs flex flex-col items-center shadow-[6px_6px_0px_#000] hover:translate-y-[-2px] transition-all">
                <span className="text-sm">{p}</span>
                <span className="text-[9px] bg-black text-white px-2 mt-1 mb-2">{o}</span>
                <span className="text-[10px] text-blue-600 font-bold italic">{totalAlunos} ALUNOS</span>
              </button>
            )
          })}
        </div>
      </div>
    );
  }

  if (tela === 'lista') {
    // Filtra tanto pelo professor quanto pela oficina selecionada
    const turmasDoProf = turmas.filter(t => t.professor === profSel && t.oficina === oficinaSel);
    return (
      <div className="min-h-screen p-8 max-w-6xl mx-auto italic font-black uppercase">
        <button onClick={() => setTela('menu')} className="text-xs mb-8 border-2 border-black px-2 py-1 font-bold italic bg-gray-50">← VOLTAR</button>
        <h2 className="text-5xl mb-2 tracking-tighter">{profSel}</h2>
        <h3 className="text-xl mb-12 text-blue-600 italic border-b-8 border-black pb-4">{oficinaSel}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {[1, 2].map(d => (
            <div key={d}>
              <h3 className={`p-3 mb-6 text-center border-4 border-black ${d===1?'bg-blue-600':'bg-red-600'} text-white shadow-[4px_4px_0px_#000]`}>{d===1?'SEGUNDA E QUARTA':'TERÇA E QUINTA'}</h3>
              <div className="space-y-4">
                {turmasDoProf.filter(t => String(t.dias).includes(String(d))).map(c => {
                  const n = contagemAlunos[c.id] || 0;
                  const limit = obterLimiteOficina(c.oficina);
                  const corBorda = n > limit ? 'border-red-600' : n === limit ? 'border-yellow-500' : 'border-black';
                  return (
                    <div key={c.id} onClick={() => {setIdAtivo(c.id); setTela('chamada');}} className={`bg-white border-4 p-4 cursor-pointer shadow-[6px_6px_0px_#000] flex justify-between items-center hover:translate-y-[-2px] transition-all ${corBorda}`}>
                      <div><span className="text-2xl block leading-none">{c.horario}</span></div>
                      <div className="text-right font-black italic"><span className="text-lg">{n} / {limit}</span></div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const curso = turmas.find(t => t.id === idAtivo);
  const diasTexto = String(curso?.dias).includes('2') ? "TERÇA E QUINTA" : "SEGUNDA E QUARTA";
  
  return (
    <div className="min-h-screen italic font-black uppercase bg-white">
      <title>CASA DA CULTURA 2026</title>
      <style jsx global>{`
        @media print {
          @page { size: auto; margin: 0mm; }
          .no-print { display: none !important; }
          body { background: white !important; margin: 0 !important; padding: 0 !important; -webkit-print-color-adjust: exact; }
          .folha-container { border: none !important; box-shadow: none !important; max-width: 100% !important; width: 100% !important; margin: 0 !important; padding: 12mm !important; }
          table { width: 100% !important; border-width: 2px !important; }
          th, td { border-width: 1px !important; }
        }
      `}</style>

      <nav className="no-print bg-white border-b-4 border-black p-4 sticky top-0 z-50 flex justify-between items-center px-8 shadow-md">
        <button onClick={()=>{setTela('lista'); fetchTurmas();}} className="text-xs border-4 border-black px-4 py-2 bg-white italic font-black">← VOLTAR</button>
        <div className="flex gap-4">
          <button onClick={() => setAlunosLocais([...alunosLocais, {nome:"", telefone:"", posicao:alunosLocais.length, id:null}])} className="bg-blue-600 text-white px-4 py-2 text-[10px] border-4 border-black shadow-[4px_4px_0px_#000] font-black italic">NOVO ALUNO +</button>
          <select value={mes} onChange={e => setMes(Number(e.target.value))} className="border-4 border-black p-1 text-xs italic font-black">{mesesNomes.map((m,i)=><option key={i} value={i}>{m}</option>)}</select>
          <button onClick={()=>window.print()} className="bg-black text-white px-6 py-2 text-[10px] border-4 border-black font-black italic">IMPRIMIR FOLHA</button>
        </div>
      </nav>

      <div className="folha-container max-w-[1300px] mx-auto p-10 mt-4 border-4 border-black bg-white mb-10 shadow-2xl">
        <header className="flex justify-between items-end mb-6 border-b-8 border-black pb-4 italic font-black">
          <div>
            <h1 className="text-5xl tracking-tighter mb-2 leading-none uppercase">{curso?.professor}</h1>
            <div className="flex gap-3 text-sm items-center">
                <span className="bg-black text-white px-3 py-1">{diasTexto}</span>
                <span className="border-2 border-black px-3 py-0.5">{curso?.oficina}</span>
                <span className="font-bold underline">{curso?.horario}</span>
            </div>
          </div>
          <div className="text-right uppercase">
            <span className="text-5xl block leading-none">{mesesNomes[mes]}</span>
            <span className="text-[9px] text-gray-500 font-bold tracking-widest text-center">CASA DA CULTURA 2026</span>
          </div>
        </header>

        <table className="w-full border-collapse border-4 border-black font-black uppercase">
          <thead>
            <tr className="bg-gray-100 italic">
              <th className="border-2 border-black w-8 text-[10px]">Nº</th>
              <th className="border-2 border-black p-2 text-left min-w-[280px]">NOME DO ALUNO</th>
              {(() => {
                const inputStr = String(curso?.dias);
                let diasAlvo = inputStr.includes('2') ? [2, 4] : [1, 3];
                const datas = [];
                const ultimoDia = new Date(2026, mes + 1, 0).getDate();
                for (let d = 1; d <= ultimoDia; d++) {
                  const dataProd = new Date(2026, mes, d);
                  if (diasAlvo.includes(dataProd.getDay())) datas.push(`${d < 10 ? '0'+d : d}/${mes+1 < 10 ? '0'+(mes+1) : mes+1}`);
                }
                return datas.map(dt => <th key={dt} className="border-2 border-black w-14 text-[9px]">{dt}</th>);
              })()}
              <th className="border-2 border-black w-12 text-[9px] no-print">FALTAS</th>
              <th className="border-2 border-black w-10 no-print"></th>
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
                    const inputStr = String(curso?.dias);
                    let diasAlvo = inputStr.includes('2') ? [2, 4] : [1, 3];
                    const datas = [];
                    const ultimoDia = new Date(2026, mes + 1, 0).getDate();
                    for (let d = 1; d <= ultimoDia; d++) {
                      const dataProd = new Date(2026, mes, d);
                      if (diasAlvo.includes(dataProd.getDay())) datas.push(`${d < 10 ? '0'+d : d}/${mes+1 < 10 ? '0'+(mes+1) : mes+1}`);
                    }
                    return datas.map(dt => (
                      <td key={dt} onClick={() => alternarPresenca(i, dt)} 
                          className={`border-2 border-black text-center cursor-pointer text-xl font-black select-none 
                          ${presencas[aluno.id]?.[dt] === 'P' ? 'bg-green-100 text-green-700' : 
                            presencas[aluno.id]?.[dt] === 'F' ? 'bg-red-100 text-red-700' : 
                            presencas[aluno.id]?.[dt] === 'J' ? 'bg-blue-100 text-blue-700' : ''}`}>
                        {presencas[aluno.id]?.[dt]}
                      </td>
                    ));
                  })()}
                  <td className="border-2 border-black text-center text-sm no-print">{f}</td>
                  <td className="border-2 border-black text-center no-print">
                    <button onClick={async () => { if(confirm("EXCLUIR?")) { await supabase.from('frequencia').delete().eq('aluno_id', aluno.id); await supabase.from('alunos').delete().eq('id', aluno.id); fetchDados(); }}} className="text-gray-200 hover:text-red-600 font-bold text-[10px]">X</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <footer className="mt-8 flex flex-col gap-8">
          <div className="flex justify-between items-center italic">
            <p className="text-[10px] font-black max-w-[65%] border-l-4 border-black pl-4 leading-relaxed">
              {obterSaudacaoOficial(curso?.oficina)}
            </p>
            <div className="text-center">
              <div className="w-64 border-b-2 border-black mb-1"></div>
              <p className="text-[9px] font-black tracking-tighter">ASSINATURA DO PROFESSOR(A): {curso?.professor}</p>
            </div>
          </div>
          <div className="text-center text-[7px] text-gray-400 font-bold tracking-[0.4em]">
            FOLHA DE CONTROLE DE FREQUÊNCIA - SECRETARIA DE CULTURA 2026
          </div>
        </footer>
      </div>
    </div>
  );
}