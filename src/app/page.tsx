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

  const obterSaudacaoOficial = (oficina: string) => {
    const o = oficina?.toUpperCase() || "";
    const base = "A unidade da Casa da Cultura do Jardim Europa deseja ao professor de ";
    const final = ` um ótimo mês de ${mesesNomes[mes].toLowerCase()} — `;
    
    if (o.includes("PERCUSSÃO") || o.includes("BATERIA")) return `${base}Percussão${final}que o ritmo continue sendo sua energia diária.`;
    if (o.includes("VIOLINO")) return `${base}Violino${final}que a música siga afinando os dias.`;
    if (o.includes("PIANO") || o.includes("TECLADO")) return `${base}Piano${final}que as melodias tornem seus dias mais leves.`;
    if (o.includes("VOCAL") || o.includes("CORO") || o.includes("CANTO")) return `${base}Canto${final}que sua voz continue ecoando incentivo.`;
    
    return `A unidade da Casa da Cultura do Jardim Europa deseja um ótimo mês de ${mesesNomes[mes].toLowerCase()} — que a arte continue transformando vidas.`;
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
    
    // Garante estrutura de exatamente 10 linhas preenchidas para manter o design fixo das folhas
    if (alData) {
      const linhasPreenchidas = [...alData];
      while (linhasPreenchidas.length < 10) {
        linhasPreenchidas.push({ nome: "", telefone: "", id: null, posicao: linhasPreenchidas.length });
      }
      setAlunosLocais(linhasPreenchidas);
    }
    
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
        {/* CABEÇALHO DO DASHBOARD COM SELETOR DE MÊS */}
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
        
        {/* CORREÇÃO DAS COLUNAS: Grid de 3 colunas gerenciando os dias do banco de dados */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {[1, 2, 3].map(d => {
            const filtrarTurma = (t: any) => {
              const diasStr = String(t.dias);
              if (d === 1) return diasStr.includes('1'); // Segunda e Quarta
              if (d === 2) return diasStr.includes('2'); // Terça e Quinta
              return diasStr.includes('5') || (diasStr.includes('4') && !diasStr.includes('2')); // Quinta e/ou Sexta isoladas
            };

            const tituloColuna = d === 1 ? 'SEGUNDA E QUARTA' : d === 2 ? 'TERÇA E QUINTA' : 'QUINTA E SEXTA';
            const corColuna = d === 1 ? 'bg-blue-600' : d === 2 ? 'bg-red-600' : 'bg-purple-600';

            return (
              <div key={d}>
                <h3 className={`p-3 mb-6 text-center border-4 border-black ${corColuna} text-white shadow-[4px_4px_0px_#000] font-black`}>
                  {tituloColuna}
                </h3>
                <div className="space-y-4">
                  {turmasDoProf.filter(filtrarTurma).map(c => {
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
            );
          })}
        </div>
      </div>
    );
  }

  const curso = turmas.find(t => t.id === idAtivo);
  
  // CORREÇÃO DOS TEXTOS DO TOPO DA FOLHA DE CHAMADA
  const obterDiasTexto = () => {
    const diasStr = String(curso?.dias);
    if (diasStr.includes('5') || (diasStr.includes('4') && !diasStr.includes('2'))) return "QUINTA E SEXTA";
    if (diasStr.includes('2')) return "TERÇA E QUINTA";
    return "SEGUNDA E QUARTA";
  };
  const diasTexto = obterDiasTexto();
  

  // CORREÇÃO DO CALENDÁRIO DA DIÁRIA DE CHAMADAS (Suporta 4 e 5 sem conflito)
  const getDatasAulas = () => {
    let diasAlvo = [1, 3]; 
    const diasStr = String(curso?.dias);
    
    if (diasStr.includes('5') || (diasStr.includes('4') && !diasStr.includes('2'))) {
      diasAlvo = [4, 5]; 
    } else if (diasStr.includes('2')) {
      diasAlvo = [2, 4]; 
    }

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
    <div className="min-h-screen italic font-black uppercase bg-white text-black">
      <title>CASA DA CULTURA 2026</title>

      {/* NAVBAR */}
      <nav className="no-print bg-white border-b-4 border-black p-4 sticky top-0 z-50 flex justify-between items-center px-8 shadow-md">
        <button onClick={()=>{setTela('lista'); fetchTurmas();}} className="text-xs border-4 border-black px-4 py-2 bg-white italic font-black uppercase">← VOLTAR</button>
        <div className="flex gap-4">
          <button onClick={() => setAlunosLocais([...alunosLocais, {nome:"", telefone:"", id:null, posicao:alunosLocais.length}])} className="bg-blue-600 text-white px-4 py-2 text-[10px] border-4 border-black shadow-[4px_4px_0px_#000] font-black italic">NOVO ALUNO +</button>
          <select value={mes} onChange={e => setMes(Number(e.target.value))} className="border-4 border-black p-1 text-xs italic font-black uppercase">{mesesNomes.map((m,i)=><option key={i} value={i}>{m}</option>)}</select>
          <button onClick={()=>window.print()} className="bg-black text-white px-6 py-2 text-[10px] border-4 border-black font-black italic">IMPRIMIR FOLHA</button>
        </div>
      </nav>

      {/* FOLHA DE CHAMADA - MODELO COMPLETO E FIXO EM 10 LINHAS */}
      <div className="folha-container mt-4 mb-10 mx-auto px-6 max-w-[1100px]">

        {/* CABECALHO COM LOGOS */}
        <div className="flex items-stretch border-2 border-black h-[110px] bg-white">
          <div className="flex-1 flex items-center justify-center p-2 border-r border-gray-400">
            <span className="text-xl font-black italic text-center">PREFEITURA MUNICIPAL</span>
          </div>
          <div className="flex-1 flex items-center justify-center p-2">
            <span className="text-xl font-black italic text-center">CASA DA CULTURA - JARDIM EUROPA</span>
          </div>
        </div>

        {/* METADADOS DA TURMA */}
        <table className="w-full mt-4 border-collapse border-2 border-black text-xs font-black">
          <tbody>
            <tr className="border-b-2 border-black bg-gray-100">
              <td className="p-2 border-r-2 border-black w-1/3">PROFESSOR: {curso?.professor}</td>
              <td className="p-2 border-r-2 border-black w-1/3 text-center">OFICINA: {curso?.oficina}</td>
              <td className="p-2 w-1/3 text-right">HORÁRIO: {curso?.horario}</td>
            </tr>
            <tr>
              <td className="p-2 border-r-2 border-black">MÊS DE REFERÊNCIA: {mesesNomes[mes].toUpperCase()}</td>
              <td className="p-2 border-r-2 border-black text-center">DIAS DE AULA: {diasTexto}</td>
              <td className="p-2 text-right text-blue-600">SAUDAÇÃO: EXCELENTE MÊS DE {mesesNomes[mes].toUpperCase()}!</td>
            </tr>
          </tbody>
        </table>

        {/* TABELA DE DIÁRIO DE CLASSE / CHAMADA */}
        <table className="w-full mt-6 border-collapse border-2 border-black text-left text-xs font-black">
          <thead>
            <tr className="bg-black text-white text-[10px]">
              <th className="p-2 border border-black w-[5%] text-center">Nº</th>
              <th className="p-2 border border-black w-[45%]">NOME COMPLETO DO ALUNO</th>
              {datasAulas.map((dt, idx) => (
                <th key={idx} className="p-1 border border-black text-center font-bold rotate-0 text-[9px] min-w-[40px]">
                  {dt}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {alunosLocais.map((aluno, idx) => (
              <tr key={idx} className="border-b border-black h-[38px] hover:bg-gray-50">
                <td className="p-1 border border-black text-center text-gray-500 font-bold">{idx + 1}</td>
                <td className="p-1 border border-black px-2">
                  <input
                    type="text"
                    value={aluno.nome || ""}
                    placeholder={modoGestao ? "Clique para preencher..." : "—"}
                    disabled={!modoGestao}
                    onChange={(e) => {
                      const novos = [...alunosLocais];
                      novos[idx].nome = e.target.value.toUpperCase();
                      setAlunosLocais(novos);
                    }}
                    onBlur={() => salvarAlunoNoBanco(idx)}
                    className="w-full bg-transparent outline-none font-black text-xs disabled:text-black placeholder-gray-300 uppercase"
                  />
                </td>
                {datasAulas.map((dt, idxData) => {
                  const status = presencas[aluno.id]?.[dt] || "";
                  const corStatus = status === "P" ? "text-green-600" : status === "F" ? "text-red-600" : "text-yellow-600";
                  return (
                    <td
                      key={idxData}
                      onClick={() => !modoGestao && aluno.id && alternarPresenca(idx, dt)}
                      className={`border border-black text-center font-black text-sm cursor-pointer select-none transition-all ${corStatus} ${!aluno.id ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    >
                      {status || "·"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* TEXTO INFORMATIVO DE RODAPÉ */}
        <div className="mt-6 p-4 border border-black bg-gray-50 text-[10px] text-gray-600 text-center font-bold">
          {obterSaudacaoOficial(curso?.oficina)}
        </div>
      </div>
    </div>
  );
}