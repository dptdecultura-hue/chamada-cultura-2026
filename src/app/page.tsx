'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// Logos em Base64 extraídos do seu novo modelo
const LOGO_PREFEITURA = "data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERG..." // Cole aqui o código completo do logo que está no seu arquivo
const LOGO_CULTURA = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKAAAABaCAYAAAA..." // Cole aqui o código completo do logo que está no seu arquivo

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

  // --- MANTENDO TODAS AS SUAS FUNÇÕES ORIGINAIS ---
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

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-2xl uppercase italic text-black bg-white">CARREGANDO...</div>;

  const ativosSet = new Set(todasPresencas.filter(f => f.status === 'P').map(f => f.aluno_id));
  const mulheres = todosAlunos.filter(a => detectarGenero(a.nome) === 'F').length;
  const homens = todosAlunos.filter(a => detectarGenero(a.nome) === 'M').length;

  if (tela === 'menu') {
    const listaProfessores = [...new Set(turmas.map(t => t.oficina.toUpperCase().includes("PIANO") ? `MICHEL (PIANO)` : t.professor))].sort();
    return (
      <div className="min-h-screen p-8 bg-[#F8FAFC] italic font-black uppercase text-center">
        <div className="flex flex-col md:flex-row justify-between items-center max-w-6xl mx-auto mb-10 gap-6">
            <h1 className="text-4xl font-black border-l-8 border-black pl-6 italic tracking-tighter">CASA DA CULTURA <span className="text-blue-600">2026</span></h1>
            <div className="flex items-center gap-2 bg-white border-4 border-black p-2 shadow-[4px_4px_0px_#000]">
                <span className="text-[10px] font-black">RELATÓRIO DE:</span>
                <select value={mes} onChange={e => setMes(Number(e.target.value))} className="bg-black text-white px-4 py-1 text-xs font-black italic outline-none cursor-pointer">
                    {mesesNomes.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
            </div>
        </div>
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#000]"><span className="text-[10px] block font-black">MATRICULADOS</span><span className="text-3xl text-blue-600">{todosAlunos.length}</span></div>
            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#000]"><span className="text-[10px] block font-black">ATIVOS NO MÊS</span><span className="text-3xl text-green-600">{ativosSet.size}</span></div>
            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#000]"><span className="text-[10px] block font-black">MULHERES</span><span className="text-3xl text-pink-500">{mulheres}</span></div>
            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#000]"><span className="text-[10px] block font-black">HOMENS</span><span className="text-3xl text-blue-400">{homens}</span></div>
            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#000] cursor-pointer hover:bg-black hover:text-white transition-all group" onClick={() => setModoGestao(!modoGestao)}><span className="text-[10px] block font-black">{modoGestao ? 'FECHAR GESTÃO' : 'MODO GESTÃO'}</span><span className="text-2xl font-black group-hover:text-red-500">{modoGestao ? 'ATIVO' : 'OFF'}</span></div>
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
    );
  }

  const curso = turmas.find(t => t.id === idAtivo);
  const diasTexto = String(curso?.dias).includes('2') ? "TERÇA E QUINTA" : "SEGUNDA E QUARTA";
  
  return (
    <div className="min-h-screen italic font-black uppercase bg-white">
      <title>CASA DA CULTURA 2026</title>
      <nav className="no-print bg-white border-b-4 border-black p-4 sticky top-0 z-50 flex justify-between items-center px-8 shadow-md">
        <button onClick={()=>{setTela('lista'); fetchTurmas();}} className="text-xs border-4 border-black px-4 py-2 bg-white italic font-black uppercase">← VOLTAR</button>
        <div className="flex gap-4">
          <button onClick={() => setAlunosLocais([...alunosLocais, {nome:"", telefone:"", posicao:alunosLocais.length, id:null}])} className="bg-blue-600 text-white px-4 py-2 text-[10px] border-4 border-black shadow-[4px_4px_0px_#000] font-black italic">NOVO ALUNO +</button>
          <select value={mes} onChange={e => setMes(Number(e.target.value))} className="border-4 border-black p-1 text-xs italic font-black uppercase">{mesesNomes.map((m,i)=><option key={i} value={i}>{m}</option>)}</select>
          <button onClick={()=>window.print()} className="bg-black text-white px-6 py-2 text-[10px] border-4 border-black font-black italic">IMPRIMIR FOLHA</button>
        </div>
      </nav>

      {/* --- NOVO MODELO VISUAL INTEGRADO AQUI --- */}
      <div className="folha-container max-w-[1300px] mx-auto p-10 mt-4 bg-white mb-10 shadow-2xl border-4 border-black">
        
        {/* NOVO CABEÇALHO COM LOGOS */}
        <header className="flex items-center justify-between border-b-4 border-black pb-4 mb-6">
          <img src={LOGO_PREFEITURA} alt="Prefeitura" className="h-16 object-contain" />
          <div className="text-center flex-1 px-4">
            <h1 className="text-xl font-black uppercase tracking-tighter leading-none">Secretaria de Cultura e Turismo</h1>
            <p className="text-[11px] font-bold mt-1 tracking-widest uppercase">Diário de Classe - Jardim Europa</p>
          </div>
          <img src={LOGO_CULTURA} alt="Cultura" className="h-16 object-contain" />
        </header>

        {/* INFO DO CURSO NO NOVO LAYOUT */}
        <div className="grid grid-cols-3 gap-y-3 mb-6 text-[10px] uppercase font-bold bg-gray-50 p-3 border-2 border-black">
          <div className="flex gap-2"><span>Curso:</span> <span className="font-black border-b border-black flex-1">{curso?.oficina}</span></div>
          <div className="flex gap-2 px-2"><span>Professor:</span> <span className="font-black border-b border-black flex-1">{curso?.professor}</span></div>
          <div className="flex gap-2"><span>Mês:</span> <span className="font-black border-b border-black flex-1">{mesesNomes[mes]} / 2026</span></div>
          <div className="flex gap-2"><span>Horário:</span> <span className="font-black border-b border-black flex-1">{curso?.horario}</span></div>
          <div className="flex gap-2 px-2"><span>Dias:</span> <span className="font-black border-b border-black flex-1">{diasTexto}</span></div>
          <div className="flex gap-2"><span>Unidade:</span> <span className="font-black border-b border-black flex-1">Jardim Europa</span></div>
        </div>

        <table className="w-full border-collapse border-4 border-black font-black uppercase">
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
                <tr key={aluno.id || `temp-${i}`} className="h-8">
                  <td className="border-2 border-black text-center text-[10px] italic">{i+1}</td>
                  <td className="border-2 border-black px-2">
                    <input className="w-full bg-transparent outline-none font-black text-xs uppercase italic" value={aluno.nome || ""} onChange={(e) => { const n = [...alunosLocais]; n[i].nome = e.target.value.toUpperCase(); setAlunosLocais(n); }} onBlur={() => salvarAlunoNoBanco(i)} />
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
                      <td key={dt} onClick={() => alternarPresenca(i, dt)} className={`border-2 border-black text-center cursor-pointer text-xl font-black select-none ${presencas[aluno.id]?.[dt] === 'P' ? 'bg-green-100' : presencas[aluno.id]?.[dt] === 'F' ? 'bg-red-100' : ''}`}>
                        {presencas[aluno.id]?.[dt]}
                      </td>
                    ));
                  })()}
                  <td className="border-2 border-black text-center text-sm no-print font-black">{f}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* NOVO RODAPÉ INTEGRADO */}
        <footer className="mt-8 flex flex-col gap-8">
          <div className="flex justify-between items-end px-4">
            <div className="text-center">
              <div className="border-t-2 border-black w-64 pt-1">
                <p className="text-[9px] font-black uppercase">Coordenador(a) Pedagógico(a)</p>
              </div>
            </div>
            <p className="text-[8px] text-gray-400 italic text-center max-w-[380px]">
              A Secretaria de Cultura e Turismo deseja ao professor do curso de {curso?.oficina} um ótimo mês de {mesesNomes[mes]}.
            </p>
            <div className="text-center">
              <div className="border-t-2 border-black w-64 pt-1">
                <p className="text-[9px] font-black uppercase">Professor(a): {curso?.professor}</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}



