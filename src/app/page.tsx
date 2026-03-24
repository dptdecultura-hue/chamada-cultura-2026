'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function CasaDaCultura2026() {
  const [tela, setTela] = useState<'menu' | 'lista' | 'chamada'>('menu')
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
    const final = " um ótimo mês de março — ";
    if (o.includes("PERCUSSÃO") || o.includes("BATERIA")) return `${base}Percussão${final}que o ritmo continue sendo sua energia diária e que cada aula seja tão vibrante quanto o som dos tambores.`;
    if (o.includes("VIOLINO")) return `${base}Violino${final}que a música siga afinando os dias e trazendo inspiração em cada acorde.`;
    if (o.includes("PIANO") || o.includes("TECLADO")) return `${base}Piano${final}que as melodias tornem seus dias mais leves e cheios de harmonia.`;
    if (o.includes("VOCAL") || o.includes("CORO") || o.includes("CANTO")) return `${base}Técnica Vocal e Coro${final}que sua voz continue ecoando incentivo, alegria e paixão pela música.`;
    if (o.includes("FLAUTA")) return `${base}Flauta${final}que o sopro da música renove suas energias e traga leveza à rotina.`;
    if (o.includes("VIOLÃO")) return `${base}Violão${final}que cada acorde continue espalhando inspiração e boas vibrações.`;
    if (o.includes("MUSICALIZAÇÃO")) return `${base}Musicalização${final}que a alegria da descoberta musical siga iluminando cada aula.`;
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

  useEffect(() => { fetchTurmas(); fetchDadosGlobais(); }, [mes]);
  useEffect(() => { if (idAtivo) fetchDados(); }, [idAtivo, mes]);

  async function fetchTurmas() {
    const { data: tData } = await supabase.from('turmas').select('*');
    const { data: aData } = await supabase.from('alunos').select('turma_id');
    const contagem: any = {};
    aData?.forEach(a => { contagem[a.turma_id] = (contagem[a.turma_id] || 0) + 1; });
    setContagemAlunos(contagem);
    if (tData) setTurmas(tData.sort((a: any, b: any) => a.horario.localeCompare(b.horario)));
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

  const transferirAluno = async (alunoId: any, novaTurmaId: any) => {
    if (!novaTurmaId) return;
    const { error } = await supabase.from('alunos').update({ turma_id: novaTurmaId }).eq('id', alunoId);
    if (!error) {
        setAlunosLocais(alunosLocais.filter(a => a.id !== alunoId));
        fetchTurmas(); fetchDadosGlobais();
        alert("ALUNO TRANSFERIDO!");
    }
  };

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
    const listaProfessores = [...new Set(turmas.map((t: any) => t.oficina.toUpperCase().includes("PIANO") ? `MICHEL (PIANO)` : t.professor))].sort();
    return (
      <div className="min-h-screen p-8 bg-[#F8FAFC] italic font-black uppercase text-center">
        <h1 className="text-4xl font-black mb-8 border-l-8 border-black pl-6 italic inline-block tracking-tighter">CASA DA CULTURA <span className="text-blue-600">2026</span></h1>
        
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#000]">
                <span className="text-[10px] block font-black">MATRICULADOS</span>
                <span className="text-3xl text-blue-600">{todosAlunos.length}</span>
            </div>
            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#000]">
                <span className="text-[10px] block font-black">ATIVOS NO MÊS</span>
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
          {listaProfessores.map((p: any) => {
            const isPiano = p === "MICHEL (PIANO)";
            const totalAlunos = turmas.filter((t: any) => isPiano ? (t.professor === "MICHEL" && t.oficina.toUpperCase().includes("PIANO")) : (t.professor === p && !t.oficina.toUpperCase().includes("PIANO"))).reduce((acc: any, t: any) => acc + (contagemAlunos[t.id] || 0), 0);
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
    const turmasDoProf = turmas.filter((t: any) => filtroOficina === "PIANO" ? (t.professor === profSel && t.oficina.toUpperCase().includes("PIANO")) : (t.professor === profSel && !t.oficina.toUpperCase().includes("PIANO")));
    return (
      <div className="min-h-screen p-8 max-w-6xl mx-auto italic font-black uppercase">
        <button onClick={() => setTela('menu')} className="text-xs mb-8 border-2 border-black px-2 py-1 font-bold italic bg-gray-50 uppercase">← VOLTAR</button>
        <h2 className="text-6xl mb-12 border-b-8 border-black pb-4 tracking-tighter uppercase font-black">{filtroOficina === "PIANO" ? "MICHEL (PIANO)" : profSel}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {[1, 2, 3, 4, 5].map(d => {
            const turmasDoDia = turmasDoProf.filter((t: any) => String(t.dias).includes(String(d)));
            if (turmasDoDia.length === 0) return null;

            const nomeDia = d === 1 ? 'SEGUNDA' : d === 2 ? 'TERÇA' : d === 3 ? 'QUARTA' : d === 4 ? 'QUINTA' : 'SEXTA';
            const corDia = d === 1 ? 'bg-blue-600' : d === 2 ? 'bg-red-600' : d === 3 ? 'bg-green-600' : d === 4 ? 'bg-yellow-500' : 'bg-purple-600';

            return (
              <div key={d}>
                <h3 className={`p-3 mb-6 text-center border-4 border-black ${corDia} text-white shadow-[4px_4px_0px_#000] font-black`}>{nomeDia}</h3>
                <div className="space-y-4">
                  {turmasDoDia.map((c: any) => {
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
            )
          })}
        </div>
      </div>
    );
  }

  const curso = turmas.find((t: any) => t.id === idAtivo);
  const diasTexto = String(curso?.dias).includes('1') ? "SEGUNDA-FEIRA" : 
                    String(curso?.dias).includes('2') ? "TERÇA-FEIRA" : 
                    String(curso?.dias).includes('3') ? "QUARTA-FEIRA" : 
                    String(curso?.dias).includes('4') ? "QUINTA-FEIRA" : 
                    String(curso?.dias).includes('5') ? "SEXTA-FEIRA" : "DIAS VARIADOS";
  
  return (
    <div className="min-h-screen italic font-black uppercase bg-white">
      <title>CASA DA CULTURA 2026</title>
      <style jsx global>{`
        @media print {
          @page { size: auto; margin: 0mm; }
          .no-print { display: none !important; }
          body { background: white !important; margin: 0 !important; padding: 0 !important; -webkit-print-color-adjust: exact; }
          .folha-container { border: none !important; box-shadow: none !important; max-width: 100% !important; width: 100% !important; margin: 0 !important; padding: 12mm !important; }
          table { width: 100% !important; border-collapse: collapse !important; }
          th, td { border: 1px solid black !important; }
        }
      `}</style>

      <nav className="no-print bg-white border-b-4 border-black p-4 sticky top-0 z-50 flex justify-between items-center px-8 shadow-md">
        <button onClick={()=>{setTela('lista'); fetchTurmas();}} className="text-xs border-4 border-black px-4 py-2 bg-white italic font-black uppercase">← VOLTAR</button>
        <div className="flex gap-4">
          <button onClick={() => setAlunosLocais([...alunosLocais, {nome:"", telefone:"", posicao:alunosLocais.length, id:null}])} className="bg-blue-600 text-white px-4 py-2 text-[10px] border-4 border-black shadow-[4px_4px_0px_#000] font-black italic">NOVO ALUNO +</button>
          <select value={mes} onChange={e => setMes(Number(e.target.value))} className="border-4 border-black p-1 text-xs italic font-black uppercase">{mesesNomes.map((m,i)=><option key={i} value={i}>{m}</option>)}</select>
          <button onClick={()=>window.print()} className="bg-black text-white px-6 py-2 text-[10px] border-4 border-black font-black italic">IMPRIMIR FOLHA</button>
        </div>
      </nav>

      <div className="folha-container max-w-[1200px] mx-auto p-12 mt-4 border border-gray-300 bg-white mb-10 shadow-xl">
        
        {/* CABEÇALHO TABELADO ESTILO PAPEL DO PEDAGÓGICO */}
        <table className="w-full border-collapse font-sans mb-4">
          <tbody>
            <tr className="border border-black">
              {/* Logo Prefeitura à esquerda */}
              <td className="p-4 border-r border-black w-1/3">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black tracking-tight text-gray-700 leading-none">PREFEITURA DE</span>
                  <span className="text-2xl font-black tracking-tighter text-blue-900 leading-none">TEIXEIRA</span>
                  <span className="text-[10px] font-black tracking-tight text-gray-700 leading-none">DE FREITAS</span>
                </div>
              </td>
              
              {/* Secretaria no meio */}
              <td className="p-4 border-r border-black w-1/3 text-center">
                <span className="text-[10px] font-bold text-gray-700 block mb-1">SECRETARIA DE</span>
                <span className="text-xs font-black text-gray-900 block tracking-tight">CULTURA E TURISMO</span>
              </td>

              {/* Logo Casa da Cultura à direita */}
              <td className="p-4 w-1/3 text-right">
                <span className="text-xl font-black text-gray-800 tracking-tight block leading-none">CASA DA</span>
                <span className="text-xl font-black text-blue-600 tracking-tight block leading-none">CULTURA</span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* INFORMAÇÕES DO PROFESSOR (TELA AZUL CLARA DIVIDIDA IGUAL À IMAGEM) */}
        <table className="w-full border-collapse font-sans text-xs font-bold mb-1">
          <tbody>
            <tr className="border border-black bg-[#DCE6F1]">
              <td className="p-2 border-r border-black w-1/2">
                OFICINEIRO (A) / PROFESSOR (A): <span className="font-black text-gray-900">{curso?.professor}</span>
              </td>
              <td className="p-2 w-1/2">
                CURSO: <span className="font-black text-gray-900">{curso?.oficina}</span>
              </td>
            </tr>
            <tr className="border border-black bg-[#DCE6F1]">
              <td className="p-2 border-r border-black w-1/2">
                DIAS DA SEMANA: <span className="font-black text-gray-900">{diasTexto}</span>
              </td>
              <td className="p-2 w-1/2">
                HORÁRIO: <span className="font-black text-gray-900">{curso?.horario}</span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* TABELA DE CHAMADA COM DIAS DO MÊS */}
        <table className="w-full border-collapse font-sans text-xs font-bold">
          <thead>
            <tr className="bg-[#B8CCE4] text-center border border-black h-8">
              <th className="border-r border-black w-10" rowSpan={2}>Nº</th>
              <th className="border-r border-black p-2 text-left min-w-[300px]" rowSpan={2}>NOME DO ALUNO</th>
              {(() => {
                const diasAlvo = String(curso?.dias).split('').map(Number);
                const datas = [];
                const ultimoDia = new Date(2026, mes + 1, 0).getDate();
                for (let d = 1; d <= ultimoDia; d++) {
                  const dataProd = new Date(2026, mes, d);
                  if (diasAlvo.includes(dataProd.getDay())) datas.push(d);
                }
                return <th className="border-r border-black h-5" colSpan={datas.length}>{mesesNomes[mes]}</th>;
              })()}
              <th className="border-r border-black w-12 no-print" rowSpan={2}>FALTAS</th>
              <th className="w-10 no-print" rowSpan={2}>X</th>
            </tr>
            <tr className="bg-[#DCE6F1] text-center border border-black h-8">
              {(() => {
                const diasAlvo = String(curso?.dias).split('').map(Number);
                const datas: any[] = [];
                const ultimoDia = new Date(2026, mes + 1, 0).getDate();
                for (let d = 1; d <= ultimoDia; d++) {
                  const dataProd = new Date(2026, mes, d);
                  if (diasAlvo.includes(dataProd.getDay())) datas.push(d < 10 ? `0${d}` : d);
                }
                return datas.map(dt => <th key={dt} className="border-r border-black w-10 text-[10px]">{dt}</th>);
              })()}
            </tr>
          </thead>
          <tbody>
            {alunosLocais.map((aluno, i) => {
              const f = Object.values(presencas[aluno.id] || {}).filter(v => v === "F").length;
              return (
                <tr key={aluno.id || `temp-${i}`} className="border border-black h-8">
                  <td className="border-r border-black text-center text-xs">{i+1}</td>
                  <td className="border-r border-black px-2">
                    <input className={`w-full bg-transparent outline-none font-bold text-xs uppercase ${f >= 3 ? 'text-red-600 underline' : 'text-gray-800'}`} 
                           value={aluno.nome || ""} 
                           onChange={(e) => { const n = [...alunosLocais]; n[i].nome = e.target.value.toUpperCase(); setAlunosLocais(n); }} 
                           onBlur={() => salvarAlunoNoBanco(i)} />
                  </td>
                  {(() => {
                    const diasAlvo = String(curso?.dias).split('').map(Number);
                    const datas: any[] = [];
                    const ultimoDia = new Date(2026, mes + 1, 0).getDate();
                    for (let d = 1; d <= ultimoDia; d++) {
                      const dataProd = new Date(2026, mes, d);
                      if (diasAlvo.includes(dataProd.getDay())) datas.push(d < 10 ? `0${d}` : d);
                    }
                    return datas.map(dt => (
                      <td key={dt} onClick={() => alternarPresenca(i, dt)} 
                          className={`border-r border-black text-center cursor-pointer text-base font-black select-none 
                          ${presencas[aluno.id]?.[dt] === 'P' ? 'bg-green-100 text-green-700' : 
                            presencas[aluno.id]?.[dt] === 'F' ? 'bg-red-100 text-red-700' : 
                            presencas[aluno.id]?.[dt] === 'J' ? 'bg-blue-100 text-blue-700' : ''}`}>
                        {presencas[aluno.id]?.[dt]}
                      </td>
                    ));
                  })()}
                  <td className="border-r border-black text-center text-sm no-print">{f}</td>
                  <td className="text-center no-print">
                    <button onClick={async () => { if(confirm("EXCLUIR?")) { await supabase.from('frequencia').delete().eq('aluno_id', aluno.id); await supabase.from('alunos').delete().eq('id', aluno.id); fetchDados(); fetchDadosGlobais(); }}} className="text-gray-300 hover:text-red-600 font-bold text-xs">X</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* RODAPÉ DO PEDAGÓGICO */}
        <footer className="mt-8 flex flex-col gap-8 font-sans font-bold">
          <div className="flex justify-between items-center italic">
            <p className="text-[10px] font-bold max-w-[65%] border-l-4 border-black pl-4 leading-relaxed uppercase text-gray-600">
              {obterSaudacaoOficial(curso?.oficina)}
            </p>
            <div className="text-center">
              <div className="w-64 border-b border-black mb-1"></div>
              <p className="text-[9px] font-black uppercase text-gray-800">ASSINATURA DO PROFESSOR(A): {curso?.professor}</p>
            </div>
          </div>
          <div className="text-center text-[7px] text-gray-400 font-bold tracking-[0.4em] uppercase">
            FOLHA DE CONTROLE DE FREQUÊNCIA - SECRETARIA DE CULTURA 2026
          </div>
        </footer>
      </div>
    </div>
  );
}
