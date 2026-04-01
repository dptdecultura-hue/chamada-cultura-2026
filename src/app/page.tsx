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
            src="data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCABmAsoDASIAAhEBAxEB/8QAHQABAQACAgMBAAAAAAAAAAAAAAYFBwQIAgMJAf/EAFEQAAAFAwAFCAcCCwUFCAMAAAABAgMEBQYRBxIhMVYTFRhBkpTT1AgUIlFhcYEyNhYjQnV2kaGxtLXRF1JidLIkN1VywSczNWNzgpWj4eLw/8QAGgEBAAIDAQAAAAAAAAAAAAAAAAEFAgMEBv/EADIRAAIBAwMCBAQFBQEBAAAAAAABAgMEERIhMQVBEyJRYQZxgZEUMqGxwRYj0eHwFUL/2gAMAwEAAhEDEQA/AOza7olu1iq06mW5cFU5rkpiyH2HISG+UNlt7Bcq6hR+y6jbjG0efPte4HujvFN8wPHR/wDea/8A9Ikfy2CK8ASXPte4HujvFN8wHPte4HujvFN8wK0ABJc+17ge6O8U3zAc+17ge6O8U3zArQAElz7XuB7o7xTfMBz7XuB7o7xTfMCtAASXPte4HujvFN8wHPte4HujvFN8wK0ABJc+17ge6O8U3zAc+17ge6O8U3zArQAElz7XuB7o7xTfMBz7XuB7o7xTfMCtAASXPte4HujvFN8wHPte4HujvFN8wK0ABJc+17ge6O8U3zAc+17ge6O8U3zArQAElz7XuB7o7xTfMBz7XuB7o7xTfMCtAASXPte4HujvFN8wHPte4HujvFN8wK0ABJc+17ge6O8U3zAc+17ge6O8U3zArQAElz7XuB7o7xTfMBz7XuB7o7xTfMCtAASXPte4HujvFN8wHPte4HujvFN8wK0ABJc+17ge6O8U3zAc+17ge6O8U3zArQAElz7XuB7o7xTfMBz7XuB7o7xTfMCtAASXPte4HujvFN8wHPte4HujvFN8wK0ABJc+17ge6O8U3zAc+17ge6O8U3zArQAElz7XuB7o7xTfMBz7XuB7o7xTfMCtAASXPte4HujvFN8wHPte4HujvFN8wK0ABJc+17ge6O8U3zAc+17ge6O8U3zArQAElz7XuB7o7xTfMBz7XuB7o7xTfMCtAASXPte4HujvFN8wHPte4HujvFN8wK0ABJc+17ge6O8U3zAc+17ge6O8U3zArQAElz7XuB7o7xTfMBz7XuB7o7xTfMCtAASXPte4HujvFN8wHPte4HujvFN8wK0ABJc+17ge6O8U3zAc+17ge6O8U3zArQAElz7XuB7o7xTfMBz7XuB7o7xTfMCtAASXPte4HujvFN8wHPte4HujvFN8wK0ABJc+17ge6O8U3zAc+17ge6O8U3zArQAElz7XuB7o7xTfMBz7XuB7o7xTfMCtAASXPte4HujvFN8wHPte4HujvFN8wK0ABJc+17ge6O8U3zAc+17ge6O8U3zArQAElz7XuB7o7xTfMBz7XuB7o7xTfMCtAASXPte4HujvFN8wHPte4HujvFN8wK0ABJc+17ge6O8U3zAc+17ge6O8U3zArQAElz7XuB7o7xTfMBz7XuB7o7xTfMCtAASXPte4HujvFN8wHPte4HujvFN8wK0ABJc+17ge6O8U3zAc+17ge6O8U3zArQAElz7X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"
            alt="Cabeçalho Casa da Cultura"
            style={{display:"block", width:"100%", height:"auto", maxHeight:"100px", objectFit:"fill"}}
          />
        </div>

        {/* TABELA DE INFORMAÇÕES DA TURMA */}
        <table className="w-full border-collapse mb-0" style={{borderSpacing: 0}}>
          <tbody>
            <tr>
              <td className="border border-[#4a90d9] bg-[#d6e8f7] px-3 py-1 font-black text-[11px] uppercase w-1/2">
                Oficineiro (a)/ Professor (a): <span className="font-normal">{curso?.professor}</span>
              </td>
              <td className="border border-[#4a90d9] bg-[#d6e8f7] px-3 py-1 font-black text-[11px] uppercase w-1/2">
                Curso: <span className="font-normal">{curso?.oficina}</span>
              </td>
            </tr>
            <tr>
              <td className="border border-[#4a90d9] bg-[#d6e8f7] px-3 py-1 font-black text-[11px] uppercase">
                Dias da Semana: <span className="font-normal">{diasTexto.charAt(0) + diasTexto.slice(1).toLowerCase()}</span>
              </td>
              <td className="border border-[#4a90d9] bg-[#d6e8f7] px-3 py-1 font-black text-[11px] uppercase">
                Horário: <span className="font-normal">{curso?.horario}</span>
              </td>
            </tr>
            <tr>
              <td className="border border-[#4a90d9] bg-[#d6e8f7] px-3 py-1 font-black text-[11px] uppercase">
                Casa de Cultura - Bela Vista (Sede)
              </td>
              <td className="border border-[#4a90d9] bg-[#d6e8f7] px-3 py-1 font-black text-[12px] uppercase text-center tracking-widest">
                {mesesNomes[mes].toUpperCase()}
              </td>
            </tr>
          </tbody>
        </table>

        {/* TABELA DE CHAMADA */}
        <table className="w-full border-collapse" style={{borderSpacing: 0}}>
          <thead>
            <tr className="bg-[#4a90d9] text-white">
              <th className="border border-[#4a90d9] px-2 py-1 text-[10px] font-black uppercase w-12 text-center">Ordem</th>
              <th className="border border-[#4a90d9] px-2 py-1 text-[10px] font-black uppercase text-left">Nomes</th>
              {datasAulas.map(dt => (
                <th key={dt} className="border border-[#4a90d9] px-1 py-1 text-[10px] font-black text-center w-10">
                  {dt.split('/')[0]}
                </th>
              ))}
              {modoGestao && <th className="border border-[#4a90d9] px-1 py-1 text-[9px] font-black no-print w-20">MOVER</th>}
              <th className="border border-[#4a90d9] px-1 py-1 text-[9px] font-black no-print w-12 text-center">FALTAS</th>
              <th className="border border-[#4a90d9] px-1 py-1 w-8 no-print"></th>
            </tr>
          </thead>
          <tbody>
            {alunosLocais.map((aluno, i) => {
              const f = Object.values(presencas[aluno.id] || {}).filter(v => v === "F").length;
              return (
                <tr key={aluno.id || `temp-${i}`} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f0f7ff]'}>
                  <td className="border border-[#4a90d9] text-center text-[10px] font-black">{i+1}</td>
                  <td className="border border-[#4a90d9] px-2 py-0.5">
                    <input
                      className={`w-full bg-transparent outline-none font-black text-xs uppercase italic ${f >= 3 ? 'text-red-600 underline' : 'text-black'}`}
                      value={aluno.nome || ""}
                      onChange={(e) => { const n = [...alunosLocais]; n[i].nome = e.target.value.toUpperCase(); setAlunosLocais(n); }}
                      onBlur={() => salvarAlunoNoBanco(i)}
                    />
                  </td>
                  {datasAulas.map(dt => (
                    <td
                      key={dt}
                      onClick={() => alternarPresenca(i, dt)}
                      className={`border border-[#4a90d9] text-center cursor-pointer text-base font-black select-none
                        ${presencas[aluno.id]?.[dt] === 'P' ? 'bg-green-100 text-green-700' :
                          presencas[aluno.id]?.[dt] === 'F' ? 'bg-red-100 text-red-700' :
                          presencas[aluno.id]?.[dt] === 'J' ? 'bg-blue-100 text-blue-700' : ''}`}
                    >
                      {presencas[aluno.id]?.[dt]}
                    </td>
                  ))}
                  {modoGestao && (
                    <td className="border border-[#4a90d9] px-1 no-print">
                      <select className="w-full text-[8px] font-black uppercase bg-gray-50 border-none outline-none" onChange={(e) => transferirAluno(aluno.id, e.target.value)}>
                        <option value="">FILA:</option>
                        {turmas.filter(t => t.professor === curso?.professor && t.id !== idAtivo).map(t => (
                          <option key={t.id} value={t.id}>{t.horario} ({t.oficina})</option>
                        ))}
                      </select>
                    </td>
                  )}
                  <td className="border border-[#4a90d9] text-center text-sm no-print font-black">{f}</td>
                  <td className="border border-[#4a90d9] text-center no-print">
                    <button onClick={async () => { if(confirm("EXCLUIR?")) { await supabase.from('frequencia').delete().eq('aluno_id', aluno.id); await supabase.from('alunos').delete().eq('id', aluno.id); fetchDados(); fetchDadosGlobais(); }}} className="text-gray-200 hover:text-red-600 font-bold text-[10px]">X</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* RODAPÉ COM ASSINATURAS */}
        <div className="mt-10 flex justify-between items-end px-4">
          <div className="text-center">
            <div className="w-64 border-b-2 border-black mb-1"></div>
            <p className="text-[9px] font-black tracking-tighter uppercase">Assinatura do Professor(a): {curso?.professor}</p>
          </div>
          <div className="text-center">
            <div className="w-64 border-b-2 border-black mb-1"></div>
            <p className="text-[9px] font-black tracking-tighter uppercase">Assinatura do Coordenador(a) Pedagógico(a)</p>
          </div>
        </div>
      </div>

      {/* CSS DE IMPRESSÃO */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          nav { display: none !important; }
          body { background: white; margin: 0; }
          .folha-container {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 10mm !important;
          }
        }
      `}</style>
    </div>
  );
}

