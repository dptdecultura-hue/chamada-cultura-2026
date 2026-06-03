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
  const [modoGestao, setModoGestao] = useState(false)

  const [todosAlunos, setTodosAlunos] = useState<any[]>([])
  const [todasPresencas, setTodasPresencas] = useState<any[]>([])

  const mesesNomes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]

  const detectarGenero = (nomeCompleto: string) => {
    if (!nomeCompleto) return null;
    const nome = nomeCompleto.trim().split(' ')[0].toUpperCase();
    const mascFixo = ["LUCA", "JOSHUA", "ALEXANDRE", "ANDRE", "FELIPE", "GUILHERME", "HENRIQUE", "MURILO", "OTAVIO", "SAMUEL", "GABRIEL", "RAFAEL", "DANIEL", "JEAN"];
    const femFixo = ["ALICE", "BEATRIZ", "ESTER", "IRIS", "NICOLE", "RAQUEL", "RUTE", "YASMIN", "EMANUELLE", "JOYCE"];
    if (mascFixo.includes(nome)) return 'M';
    if (femFixo.includes(nome)) return 'F';
    return nome.endsWith('A') ? 'F' : 'M';
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

  useEffect(() => { fetchTurmas(); fetchDadosGlobais(); }, [mes]);
  useEffect(() => { if (idAtivo) fetchDados(); }, [idAtivo, mes]);

  async function fetchTurmas() {
    const { data: tData } = await supabase.from('turmas').select('*');
    const { data: aData } = await supabase.from('alunos').select('turma_id');
    const contagem: any = {};
    aData?.forEach(a => { contagem[a.turma_id] = (contagem[a.turma_id] || 0) + 1; });
    setContagemAlunos(contagem);
    if (tData) setTurmas(tData.sort((a:any, b:any) => a.horario.localeCompare(b.horario)));
    setLoading(false);
  }

  async function fetchDadosGlobais() {
    const { data: alu } = await supabase.from('alunos').select('*');
    const { data: freq } = await supabase.from('frequencia').select('*').eq('mes', mes);
    if (alu) setTodosAlunos(alu);
    if (freq) setTodasPresencas(freq);
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
    const payload = { 
        turma_id: idAtivo, 
        nome: aluno.nome.trim().toUpperCase(), 
        telefone: aluno.telefone || "", 
        genero: detectarGenero(aluno.nome),
        posicao: index 
    };
    if (aluno.id) {
      await supabase.from('alunos').update(payload).eq('id', aluno.id);
      return aluno.id;
    } else {
      const { data: novo } = await supabase.from('alunos').insert(payload).select();
      if (novo && novo[0]) {
        const n = [...alunosLocais];
        n[index].id = novo[0].id;
        setAlunosLocais(n);
        fetchTurmas(); fetchDadosGlobais();
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
    fetchDadosGlobais();
  };

  const transferirAluno = async (alunoId: any, novaTurmaId: any) => {
    if (!novaTurmaId) return;
    const { error } = await supabase.from('alunos').update({ turma_id: novaTurmaId }).eq('id', alunoId);
    if (!error) {
        setAlunosLocais(alunosLocais.filter(a => a.id !== alunoId));
        fetchTurmas(); fetchDadosGlobais();
        alert("ALUNO TRANSFERIDO!");
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-2xl uppercase italic text-black bg-white">CARREGANDO...</div>;

  const ativosSet = new Set(todasPresencas.filter(f => f.status === 'P').map(f => f.aluno_id));
  const mulheres = todosAlunos.filter(a => detectarGenero(a.nome) === 'F').length;
  const homens = todosAlunos.filter(a => detectarGenero(a.nome) === 'M').length;

  if (tela === 'menu') {
    const listaProfessores = [...new Set(turmas.map(t => t.oficina.toUpperCase().includes("PIANO") ? `MICHEL (PIANO)` : t.professor))].sort();
    return (
      <div className="min-h-screen p-8 bg-[#F8FAFC] italic font-black uppercase text-center">
        <div className="flex flex-col md:flex-row justify-between items-center max-w-6xl mx-auto mb-10 gap-6">
            <h1 className="text-4xl font-black border-l-8 border-black pl-6 italic tracking-tighter">
                CASA DA CULTURA <span className="text-blue-600">2026</span>
            </h1>
            <div className="flex items-center gap-2 bg-white border-4 border-black p-2 shadow-[4px_4px_0px_#000]">
                <span className="text-[10px] font-black">RELATÓRIO DE:</span>
                <select 
                    value={mes} 
                    onChange={e => setMes(Number(e.target.value))} 
                    className="bg-black text-white px-4 py-1 text-xs font-black italic outline-none cursor-pointer"
                >
                    {mesesNomes.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
            </div>
        </div>
        
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#000]">
                <span className="text-[10px] block font-black">MATRICULADOS</span>
                <span className="text-3xl text-blue-600">{todosAlunos.length}</span>
            </div>
            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#000]">
                <span className="text-[10px] block font-black text-green-600">ATIVOS ({mesesNomes[mes].substring(0,3)})</span>
                <span className="text-3xl text-green-600">{ativosSet.size}</span>
            </div>
            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#000]">
                <span className="text-[10px] block font-black">MULHERES</span>
                <span className="text-3xl text-pink-500">{mulheres}</span>
            </div>
            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#000]">
                <span className="text-[10px] block font-black">HOMENS</span>
                <span className="text-3xl text-blue-400">{homens}</span>
            </div>
            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#000] cursor-pointer hover:bg-black hover:text-white transition-all group" onClick={() => setModoGestao(!modoGestao)}>
                <span className="text-[10px] block font-black">{modoGestao ? 'FECHAR GESTÃO' : 'MODO GESTÃO'}</span>
                <span className="text-2xl font-black group-hover:text-red-500">{modoGestao ? 'ATIVO' : 'OFF'}</span>
            </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {listaProfessores.map(p => {
            const isPiano = p === "MICHEL (PIANO)";
            const totalAlunos = turmas.filter(t => isPiano ? (t.professor === "MICHEL" && t.oficina.toUpperCase().includes("PIANO")) : (t.professor === p && !t.oficina.toUpperCase().includes("PIANO"))).reduce((acc, t) => acc + (contagemAlunos[t.id] || 0), 0);
            return (
              <button key={p} onClick={() => {setProfSel(isPiano ? "MICHEL" : p); setFiltroOficina(isPiano ? "PIANO" : ""); setTela('lista');}} className="border-4 border-black bg-white p-8 text-sm flex flex-col items-center shadow-[6px_6px_0px_#000] hover:translate-y-[-2px] transition-all font-black">
                {p}
                <span className="text-[10px] text-blue-600 mt-2 font-bold italic">{totalAlunos} ALUNOS</span>
              </button>
            )
          })}
        </div>
      </div>
    );
  }
  
  if (tela === 'lista') {
    const turmasDoProf = turmas.filter(t => filtroOficina === "PIANO" ? (t.professor === profSel && t.oficina.toUpperCase().includes("PIANO")) : (t.professor === profSel && !t.oficina.toUpperCase().includes("PIANO")));
    return (
      <div className="min-h-screen p-8 max-w-6xl mx-auto italic font-black uppercase">
        <button onClick={() => setTela('menu')} className="text-xs mb-8 border-2 border-black px-2 py-1 font-bold italic bg-gray-50 uppercase">← VOLTAR</button>
        <h2 className="text-6xl mb-12 border-b-8 border-black pb-4 tracking-tighter uppercase font-black">{filtroOficina === "PIANO" ? "MICHEL (PIANO)" : profSel}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {[1, 2].map(d => (
            <div key={d}>
              <h3 className={`p-3 mb-6 text-center border-4 border-black ${d===1?'bg-blue-600':'bg-red-600'} text-white shadow-[4px_4px_0px_#000] font-black`}>{d===1?'SEGUNDA E QUARTA':'TERÇA E QUINTA'}</h3>
              <div className="space-y-4">
                {turmasDoProf.filter(t => String(t.dias).includes(String(d))).map(c => {
                  const n = contagemAlunos[c.id] || 0;
                  const limit = obterLimiteOficina(c.oficina);
                  return (
                    <div key={c.id} onClick={() => {setIdAtivo(c.id); setTela('chamada');}} className={`bg-white border-4 p-4 cursor-pointer shadow-[6px_6px_0px_#000] flex justify-between items-center hover:translate-y-[-2px] transition-all border-black`}>
                      <div><span className="text-2xl block leading-none font-black">{c.horario}</span><span className="text-[10px] text-gray-400 font-bold italic">{c.oficina}</span></div>
                      <div className="text-right font-black italic"><span className="text-lg">{n} / {limit}</span></div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const curso = turmas.find(t => t.id === idAtivo);
  const diasTexto = String(curso?.dias).includes('2') ? "TERÇA E QUINTA" : "SEGUNDA E QUARTA";

  // Calcula as datas das aulas do mês
  const getDatasAulas = () => {
    const diasAlvo = String(curso?.dias).includes('2') ? [2, 4] : [1, 3];
    const datas: string[] = [];
    const ultimoDia = new Date(2026, mes + 1, 0).getDate();
    for (let d = 1; d <= ultimoDia; d++) {
      const dataProd = new Date(2026, mes, d);
      if (diasAlvo.includes(dataProd.getDay())) {
        datas.push(`${d < 10 ? '0'+d : d}/${mes+1 < 10 ? '0'+(mes+1) : mes+1}`);
      }
    }
    return datas;
  };
  const datasAulas = getDatasAulas();

  return (
    <div className="min-h-screen italic font-black uppercase bg-white">
      <title>CASA DA CULTURA 2026</title>

      {/* NAVBAR - apenas na tela, não imprime */}
      <nav className="no-print bg-white border-b-4 border-black p-4 sticky top-0 z-50 flex justify-between items-center px-8 shadow-md">
        <button onClick={()=>{setTela('lista'); fetchTurmas();}} className="text-xs border-4 border-black px-4 py-2 bg-white italic font-black uppercase">← VOLTAR</button>
        <div className="flex gap-4">
          <button onClick={() => setAlunosLocais([...alunosLocais, {nome:"", telefone:"", posicao:alunosLocais.length, id:null}])} className="bg-blue-600 text-white px-4 py-2 text-[10px] border-4 border-black shadow-[4px_4px_0px_#000] font-black italic">NOVO ALUNO +</button>
          <select value={mes} onChange={e => setMes(Number(e.target.value))} className="border-4 border-black p-1 text-xs italic font-black uppercase">{mesesNomes.map((m,i)=><option key={i} value={i}>{m}</option>)}</select>
          <button onClick={()=>window.print()} className="bg-black text-white px-6 py-2 text-[10px] border-4 border-black font-black italic">IMPRIMIR FOLHA</button>
        </div>
      </nav>

      {/* =============================================
          FOLHA DE CHAMADA - MODELO 2.0
          ============================================= */}
      <div className="folha-container mt-4 mb-10" style={{maxWidth:"1100px", margin:"16px auto 40px auto", padding:"0 24px"}}>

        {/* CABEÇALHO INSTITUCIONAL */}
        <div style={{display:"block", marginBottom:"0px", border:"1px solid #4a90d9"}}>
          <img
            src="data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCABmAsoDASIAAhEBAxEB/8QAHQABAQACAgMBAAAAAAAAAAAAAAYFBwQIAgMJAf/EAFEQAAAFAwAFCAcCCwUFCAMAAAABAgMEBQYRBxIhMVYTFRhBkpTT1AgUIlFhcYEyNhYjQnV2kaGxtLXRF1JidLIkN1VywSczNWNzgpWj4eLw/8QAGgEBAAIDAQAAAAAAAAAAAAAAAAEFAgMEBv/EADIRAAIBAwMCBAQFBQEBAAAAAAABAgMEERIhMQVBEyJRYQZxgZEUMqGxwRYj0eHwFUL/2gAMAwEAAhEDEQA/AOza7olu1iq06mW5cFU5rkpiyH2HISG+UNlt7Bcq6hR+y6jbjG0efPte4HujvFN8wPHR/wDea/8A9Ikfy2CK8ASXPte4HujvFN8wHPte4HujvFN8wK0ABJc+17ge6O8U3zAc+17ge6O8U3zArQAElz7XuB7o7xTfMBz7XuB7o7xTfMCtAASXPte4HujvFN8wHPte4HujvFN8wK0ABJc+17ge6O8U3zAc+17ge6O8U3zArQAElz7XuB7o7xTfMBz7XuB7o7xTfMCtAASXPte4HujvFN8wHPte4HujvFN8wK0ABJc+17ge6O8U3zAc+17ge6O8U3zArQAElz7XuB7o7xTfMBz7XuB7o7xTfMCtAASXPte4HujvFN8wHPte4HujvFN8wK0ABJc+17ge6O8U3zAc+17ge6O8U3zArQAElz7XuB7o7xTfMBz7XuB7o7xTfMCtAASXPte4HujvFN8wHPte4HujvFN