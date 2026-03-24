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

  const [usarLogoPrefeitura, setUsarLogoPrefeitura] = useState(true)
  const [logoPrefeituraCustom, setLogoPrefeituraCustom] = useState<string | null>(null)
  const [alturaPrefeitura, setAlturaPrefeitura] = useState(48)

  const [usarLogoCultura, setUsarLogoCultura] = useState(true)
  const [logoCulturaCustom, setLogoCulturaCustom] = useState<string | null>(null)
  const [alturaCultura, setAlturaCultura] = useState(48)

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
    const final = " um ótimo mês — ";
    if (o.includes("PERCUSSÃO") || o.includes("BATERIA")) return `${base}Percussão${final}que o ritmo continue sendo sua energia diária e que cada aula seja tão vibrante quanto o som dos tambores.`;
    if (o.includes("VIOLINO")) return `${base}Violino${final}que a música siga afinando os dias e trazendo inspiração em cada acorde.`;
    if (o.includes("PIANO") || o.includes("TECLADO")) return `${base}Piano${final}que as melodias tornem seus dias mais leves e cheios de harmonia.`;
    if (o.includes("VOCAL") || o.includes("CORO") || o.includes("CANTO")) return `${base}Técnica Vocal e Coro${final}que sua voz continue ecoando incentivo, alegria e paixão pela música.`;
    if (o.includes("FLAUTA")) return `${base}Flauta${final}que o sopro da música renove suas energias e traga leveza à rotina.`;
    if (o.includes("VIOLÃO")) return `${base}Violão${final}que cada acorde continue espalhando inspiração e boas vibrações.`;
    if (o.includes("MUSICALIZAÇÃO")) return `${base}Musicalização${final}que a alegria da descoberta musical siga iluminando cada aula.`;
    return "A unidade da Casa da Cultura do Jardim Europa deseja a todos um ótimo mês — que a arte continue transformando vidas.";
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
    aData?.forEach((a: any) => { contagem[a.turma_id] = (contagem[a.turma_id] || 0) + 1; });
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
    preData?.forEach((p: any) => {
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

  const lidarComUploadImagem = (e: React.ChangeEvent<HTMLInputElement>, tipo: 'prefeitura' | 'cultura') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (tipo === 'prefeitura') setLogoPrefeituraCustom(reader.result as string);
      else setLogoCulturaCustom(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-bold text-2xl uppercase text-black bg-white">CARREGANDO...</div>;

  const ativosSet = new Set(todasPresencas.filter((f: any) => f.status === 'P').map((f: any) => f.aluno_id));
  const mulheres = todosAlunos.filter((a: any) => detectarGenero(a.nome) === 'F').length;
  const homens = todosAlunos.filter((a: any) => detectarGenero(a.nome) === 'M').length;

  if (tela === 'menu') {
    const listaProfessores = [...new Set(turmas.map((t: any) => t.oficina.toUpperCase().includes("PIANO") ? `MICHEL (PIANO)` : t.professor))].sort();
    return (
      <div className="min-h-screen p-8 bg-[#F8FAFC] font-sans font-bold uppercase text-center text-black">
        <h1 className="text-4xl font-black mb-8 border-l-8 border-black pl-6 inline-block tracking-tighter">CASA DA CULTURA <span className="text-blue-600">2026</span></h1>
        
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
                <span className="text-[10px] text-blue-600 mt-2 font-bold">{totalAlunos} ALUNOS</span>
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
      <div className="min-h-screen p-8 max-w-6xl mx-auto font-sans font-bold uppercase text-black">
        <button onClick={() => setTela('menu')} className="text-xs mb-8 border-2 border-black px-2 py-1 bg-gray-50 uppercase">← VOLTAR</button>
        <h2 className="text-6xl mb-12 border-b-8 border-black pb-4 tracking-tighter font-black">{filtroOficina === "PIANO" ? "MICHEL (PIANO)" : profSel}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {[1, 2, 3, 4, 5].map(d => {
            const turmasDoDia = turmasDoProf.filter((t: any) => String(t.dias).includes(String(d)));
            if (turmasDoDia.length === 0) return null;

            return (
              <div key={d}>
                <h3 className="p-3 mb-6 text-center border-4 border-black bg-black text-white font-black">{d === 1 ? 'SEGUNDA' : d === 2 ? 'TERÇA' : d === 3 ? 'QUARTA' : d === 4 ? 'QUINTA' : 'SEXTA'}</h3>
                <div className="space-y-4">
                  {turmasDoDia.map((c: any) => {
                    const n = contagemAlunos[c.id] || 0;
                    const limit = obterLimiteOficina(c.oficina);
                    return (
                      <div key={c.id} onClick={() => {setIdAtivo(c.id); setTela('chamada');}} className={`bg-white border-4 p-4 cursor-pointer shadow-[6px_6px_0px_#000] flex justify-between items-center hover:translate-y-[-2px] transition-all border-black`}>
                        <div><span className="text-2xl block leading-none font-black">{c.horario}</span><span className="text-[10px] text-gray-400 font-bold">{c.oficina}</span></div>
                        <div className="text-right font-black"><span className="text-lg">{n} / {limit}</span></div>
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
    <div className="min-h-screen font-sans bg-white text-black uppercase">
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

      {/* PAINEL ADMINISTRATIVO (NÃO IMPRIME) */}
      <nav className="no-print bg-gray-100 border-b-4 border-black p-4 sticky top-0 z-50 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <button onClick={()=>{setTela('lista'); fetchTurmas();}} className="text-xs border-4 border-black px-4 py-2 bg-white font-black uppercase">← VOLTAR</button>
          <div className="flex gap-4">
            <button onClick={() => setAlunosLocais([...alunosLocais, {nome:"", telefone:"", posicao:alunosLocais.length, id:null}])} className="bg-blue-600 text-white px-4 py-2 text-[10px] border-4 border-black shadow-[4px_4px_0px_#000] font-bold">NOVO ALUNO +</button>
            <select value={mes} onChange={e => setMes(Number(e.target.value))} className="border-4 border-black p-1 text-xs font-bold">{mesesNomes.map((m,i)=><option key={i} value={i}>{m}</option>)}</select>
            <button onClick={()=>window.print()} className="bg-black text-white px-6 py-2 text-[10px] border-4 border-black font-bold">IMPRIMIR FOLHA</button>
          </div>
        </div>

        {/* PAINEL DE LOGOS — upload opcional para substituir o texto padrão */}
        <div className="bg-white border-2 border-gray-300 p-3 flex flex-wrap gap-6 items-center text-xs font-sans normal-case">
          <div className="flex flex-col gap-1">
            <label className="font-bold flex items-center gap-1">
              <input type="checkbox" checked={usarLogoPrefeitura} onChange={e => setUsarLogoPrefeitura(e.target.checked)} />
              Substituir logo Prefeitura por imagem
            </label>
            <input type="file" accept="image/*" disabled={!usarLogoPrefeitura} onChange={e => lidarComUploadImagem(e, 'prefeitura')} className="text-[10px]" />
            {usarLogoPrefeitura && logoPrefeituraCustom && (
              <div className="flex items-center gap-1">
                <span className="text-[10px]">Altura (px):</span>
                <input type="range" min="20" max="100" value={alturaPrefeitura} onChange={e => setAlturaPrefeitura(Number(e.target.value))} />
                <span className="text-[10px]">{alturaPrefeitura}px</span>
              </div>
            )}
          </div>

          <div className="h-10 w-[1px] bg-gray-300"></div>

          <div className="flex flex-col gap-1">
            <label className="font-bold flex items-center gap-1">
              <input type="checkbox" checked={usarLogoCultura} onChange={e => setUsarLogoCultura(e.target.checked)} />
              Substituir logo Casa da Cultura por imagem
            </label>
            <input type="file" accept="image/*" disabled={!usarLogoCultura} onChange={e => lidarComUploadImagem(e, 'cultura')} className="text-[10px]" />
            {usarLogoCultura && logoCulturaCustom && (
              <div className="flex items-center gap-1">
                <span className="text-[10px]">Altura (px):</span>
                <input type="range" min="20" max="100" value={alturaCultura} onChange={e => setAlturaCultura(Number(e.target.value))} />
                <span className="text-[10px]">{alturaCultura}px</span>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="folha-container max-w-[1200px] mx-auto p-12 mt-4 bg-white mb-10 shadow-xl">

        {/* =============================================
            CABEÇALHO OFICIAL — idêntico ao modelo PDF
            Padrão: texto estilizado. 
            Upload de imagem substitui o texto se fornecido.
        ============================================= */}
        <div className="border border-black mb-1 flex items-stretch bg-white" style={{ minHeight: '110px' }}>

          {/* COLUNA ESQUERDA — Logo Prefeitura */}
          <div className="flex items-center justify-center px-6 py-3" style={{ minWidth: '200px' }}>
            {usarLogoPrefeitura && logoPrefeituraCustom ? (
              <img
                src={logoPrefeituraCustom}
                alt="Logo Prefeitura"
                style={{ height: `${alturaPrefeitura}px` }}
                className="w-auto object-contain"
              />
            ) : (
              /* Texto estilizado que imita o logo da Prefeitura de Teixeira de Freitas */
              <div className="flex items-center gap-3">
                {/* Ícone quadrado azul simulando o símbolo da prefeitura */}
                <div style={{ width: 48, height: 48, background: '#1B4F8C', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <div style={{ width: 28, height: 28, border: '3px solid white', borderRadius: 2 }} />
                </div>
                <div className="flex flex-col leading-none">
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#555', letterSpacing: '0.12em', textTransform: 'uppercase' }}>PREFEITURA DE</span>
                  <span style={{ fontSize: 22, fontWeight: 900, color: '#1B4F8C', lineHeight: 1, letterSpacing: '-0.03em', textTransform: 'uppercase' }}>TEIXEIRA</span>
                  <span style={{ fontSize: 22, fontWeight: 900, color: '#1B4F8C', lineHeight: 1, letterSpacing: '-0.03em', textTransform: 'uppercase' }}>DE FREITAS</span>
                </div>
              </div>
            )}
          </div>

          {/* DIVISOR */}
          <div style={{ width: 1, background: '#ccc', margin: '12px 0' }} />

          {/* COLUNA CENTRO — Secretaria */}
          <div className="flex flex-col items-center justify-center px-6 py-3 flex-1">
            <span style={{ fontSize: 10, fontWeight: 700, color: '#666', letterSpacing: '0.1em', textTransform: 'uppercase', lineHeight: 1.2 }}>SECRETARIA DE</span>
            <span style={{ fontSize: 14, fontWeight: 900, color: '#222', letterSpacing: '0.05em', textTransform: 'uppercase', lineHeight: 1.2 }}>CULTURA E TURISMO</span>
          </div>

          {/* DIVISOR */}
          <div style={{ width: 1, background: '#ccc', margin: '12px 0' }} />

          {/* COLUNA DIREITA — Logo Casa da Cultura */}
          <div className="flex items-center justify-center px-6 py-3" style={{ minWidth: '200px' }}>
            {usarLogoCultura && logoCulturaCustom ? (
              <img
                src={logoCulturaCustom}
                alt="Logo Casa da Cultura"
                style={{ height: `${alturaCultura}px` }}
                className="w-auto object-contain"
              />
            ) : (
              /* Texto estilizado que imita o logo da Casa da Cultura */
              <div className="flex items-center gap-3">
                {/* Ícone colorido simulando o símbolo da Casa da Cultura */}
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                  <circle cx="24" cy="24" r="23" fill="#F0F4FF" stroke="#1B4F8C" strokeWidth="1.5"/>
                  {/* ponto central */}
                  <circle cx="24" cy="14" r="5" fill="#1B4F8C"/>
                  {/* arco inferior laranja */}
                  <path d="M10 34 Q24 20 38 34" stroke="#E85D04" strokeWidth="3" fill="none" strokeLinecap="round"/>
                  {/* ponto laranja */}
                  <circle cx="24" cy="26" r="2.5" fill="#E85D04"/>
                  {/* estrelinhas decorativas */}
                  <circle cx="14" cy="20" r="1.5" fill="#E85D04" opacity="0.7"/>
                  <circle cx="34" cy="20" r="1.5" fill="#1B4F8C" opacity="0.7"/>
                </svg>
                <div className="flex flex-col leading-none">
                  <span style={{ fontSize: 22, fontWeight: 900, color: '#222', lineHeight: 1, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>CASA DA</span>
                  <span style={{ fontSize: 22, fontWeight: 900, color: '#1B4F8C', lineHeight: 1, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>CULTURA</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#888', marginTop: 2, letterSpacing: '0.1em', textTransform: 'uppercase' }}>JARDIM EUROPA</span>
                </div>
              </div>
            )}
          </div>

        </div>
        {/* FIM DO CABEÇALHO */}

        {/* INFORMAÇÕES DO PROFESSOR */}
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
                return datas.map((dt, idx) => <th key={idx} className="border-r border-black w-10 text-[10px]">{dt}</th>);
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
                    return datas.map((dt, idx) => (
                      <td key={idx} onClick={() => alternarPresenca(i, dt)} 
                          className={`border-r border-black text-center cursor-pointer text-base font-bold select-none 
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

        {/* RODAPÉ */}
        <footer className="mt-8 flex flex-col gap-8 font-sans font-bold">
          <div className="flex justify-between items-center italic">
            <p className="text-[10px] font-bold max-w-[65%] border-l-4 border-black pl-4 leading-relaxed uppercase text-gray-500">
              {obterSaudacaoOficial(curso?.oficina)}
            </p>
            <div className="text-center">
              <div className="w-64 border-b border-black mb-1"></div>
              <p className="text-[10px] font-black uppercase text-gray-800">ASSINATURA DO PROFESSOR(A): {curso?.professor}</p>
            </div>
          </div>
          <div className="text-center text-[8px] text-gray-400 font-bold tracking-[0.4em] uppercase">
            FOLHA DE CONTROLE DE FREQUÊNCIA - SECRETARIA DE CULTURA 2026
          </div>
        </footer>
      </div>
    </div>
  );
}
