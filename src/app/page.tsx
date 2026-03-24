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

  if (loading) return <div className="h-screen flex items-center justify-center font-bold text-2xl uppercase text-black bg-white">CARREGANDO...</div>;

  if (tela === 'menu') {
    const listaProfessores = [...new Set(turmas.map((t: any) => t.oficina.toUpperCase().includes("PIANO") ? `MICHEL (PIANO)` : t.professor))].sort();
    return (
      <div className="min-h-screen p-8 bg-[#F8FAFC] font-sans font-bold uppercase text-center text-black">
        <h1 className="text-4xl font-black mb-8 border-l-8 border-black pl-6 inline-block tracking-tighter">CASA DA CULTURA <span className="text-blue-600">2026</span></h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {listaProfessores.map((p: any) => (
            <button key={p} onClick={() => {setProfSel(p.includes("PIANO") ? "MICHEL" : p); setFiltroOficina(p.includes("PIANO") ? "PIANO" : ""); setTela('lista');}} className="border-4 border-black bg-white p-8 text-sm flex flex-col items-center shadow-[6px_6px_0px_#000] hover:translate-y-[-2px] transition-all font-black">
              {p}
              <span className="text-[10px] text-blue-600 mt-2 font-bold">{contagemAlunos[p] || 0} ALUNOS</span>
            </button>
          ))}
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
                <h3 className={`p-3 mb-6 text-center border-4 border-black bg-black text-white font-black`}>{d === 1 ? 'SEGUNDA' : d === 2 ? 'TERÇA' : d === 3 ? 'QUARTA' : d === 4 ? 'QUINTA' : 'SEXTA'}</h3>
                <div className="space-y-4">
                  {turmasDoDia.map((c: any) => (
                    <div key={c.id} onClick={() => {setIdAtivo(c.id); setTela('chamada');}} className="bg-white border-4 p-4 cursor-pointer shadow-[6px_6px_0px_#000] flex justify-between items-center border-black">
                      <div><span className="text-2xl font-black">{c.horario}</span><br/><span className="text-[10px] text-gray-500">{c.oficina}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    );
  }

  const curso = turmas.find((t: any) => t.id === idAtivo);
  const diasTexto = String(curso?.dias).includes('2') ? "Terça e Quinta" : "Segunda e Quarta";

  // Prepara as 25 linhas obrigatórias do PDF
  const linhasTabela = Array.from({ length: 25 }, (_, idx) => {
    return alunosLocais.find((a) => a.posicao === idx) || { nome: "", id: null, posicao: idx };
  });

  return (
    <div className="min-h-screen font-sans bg-white text-black">
      <style jsx global>{`
        @media print {
          @page { size: A4 portrait; margin: 10mm 15mm; }
          .no-print { display: none !important; }
          body { background: white !important; margin: 0 !important; padding: 0 !important; }
          .folha-container { width: 100% !important; margin: 0 !important; padding: 0 !important; border: none !important; box-shadow: none !important; }
          table { width: 100% !important; border-collapse: collapse !important; font-size: 10px !important; }
          th, td { border: 1px solid black !important; padding: 4px !important; }
          input { font-size: 10px !important; }
        }
      `}</style>

      <nav className="no-print bg-white border-b-4 border-black p-4 sticky top-0 z-50 flex justify-between items-center px-8 shadow-md">
        <button onClick={()=>{setTela('lista'); fetchTurmas();}} className="text-xs border-2 border-black px-4 py-1 font-bold uppercase">← VOLTAR</button>
        <div className="flex gap-4">
          <select value={mes} onChange={e => setMes(Number(e.target.value))} className="border-2 border-black px-2 text-xs font-bold">{mesesNomes.map((m,i)=><option key={i} value={i}>{m}</option>)}</select>
          <button onClick={()=>window.print()} className="bg-black text-white px-6 py-1 text-xs border-2 border-black font-bold">IMPRIMIR FOLHA</button>
        </div>
      </nav>

      <div className="folha-container max-w-[1050px] mx-auto p-12 bg-white mb-10 text-[11px] uppercase">
        
        {/* TÍTULO SUPERIOR EXATO DO PDF */}
        <div className="border border-black text-center py-1 font-bold tracking-wider mb-0 text-[12px] bg-gray-50">
          MODELO DE FREQUÊNCIA - ALUNOS
        </div>

        {/* CABEÇALHO INTEGRADO (LOGOS) REFEITO IGUAL À IMAGEM */}
        <div className="border border-t-0 border-black p-4 flex justify-between items-center h-[110px] mb-0 bg-white">
          <div className="h-full flex items-center gap-4">
            {/* Logo da Prefeitura. Se quebrar na Vercel, o CSS mantém as letras bonitas em texto */}
            <div className="relative h-14 w-[300px] flex items-center">
              <img 
                src="/logo-prefeitura.png" 
                alt="Prefeitura de Teixeira de Freitas" 
                className="h-12 w-auto object-contain object-left"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  const parent = (e.target as HTMLElement).parentElement;
                  if (parent) {
                    parent.innerHTML = `
                      <div class="flex flex-col font-sans">
                        <span class="text-[10px] font-bold text-gray-500">PREFEITURA DE</span>
                        <span class="text-3xl font-black text-blue-900 tracking-tighter">TEIXEIRA</span>
                        <span class="text-[10px] font-bold text-gray-500">DE FREITAS</span>
                      </div>
                    `;
                  }
                }}
              />
            </div>

            <div className="h-14 w-[1px] bg-gray-400 mx-1"></div>

            <div className="flex flex-col justify-center font-sans">
              <span className="text-[11px] font-bold text-gray-600 leading-none mb-1">SECRETARIA DE</span>
              <span className="text-sm font-black text-gray-800 leading-none tracking-tight">CULTURA E TURISMO</span>
            </div>
          </div>

          <div className="flex items-center gap-2 h-full">
            {/* Ícone vetorizado simplificado da Casa de Cultura */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="h-12 w-auto">
              <circle cx="45" cy="50" r="20" fill="#F59E0B" opacity="0.3"/>
              <circle cx="55" cy="40" r="18" fill="#EF4444" opacity="0.4"/>
              <circle cx="35" cy="60" r="15" fill="#3B82F6" opacity="0.4"/>
              <text x="50" y="60" textAnchor="middle" fill="#1E3A8A" fontSize="26" fontWeight="900" fontFamily="sans-serif">C</text>
            </svg>
            <div className="flex flex-col text-right justify-center">
              <span className="text-xl font-black text-gray-800 leading-none">CASA DA</span>
              <span className="text-xl font-black text-blue-600 leading-none">CULTURA</span>
            </div>
          </div>
        </div>

        {/* TABELA DE DADOS DA TURMA (EXATAMENTE COMO O PDF) */}
        <table className="w-full border-collapse mb-0 font-sans text-[11px]">
          <tbody>
            <tr>
              <td className="border border-black p-2 w-1/2 font-bold">Oficineiro (a)/ Professor (a): <span className="font-normal">{curso?.professor || ''}</span></td>
              <td className="border border-black p-2 w-1/2 font-bold">Curso: <span className="font-normal">{curso?.oficina || ''}</span></td>
            </tr>
            <tr>
              <td className="border border-black p-2 font-bold">Dias da Semana: <span className="font-normal">{diasTexto}</span></td>
              <td className="border border-black p-2 font-bold">Horário: <span className="font-normal">{curso?.horario || ''}</span></td>
            </tr>
            <tr>
              <td colSpan={2} className="border border-black p-2 text-center font-bold tracking-wide bg-gray-50">Casa de Cultura - Bela Vista (Sede)</td>
            </tr>
          </tbody>
        </table>

        {/* TABELA DE CHAMADA (CONTINUA ATÉ A LINHA 25) */}
        <table className="w-full border-collapse text-center text-[11px] font-sans">
          <thead>
            <tr className="bg-gray-100 h-8">
              <th className="border border-black w-14 font-bold">Ordem</th>
              <th className="border border-black p-2 text-left min-w-[300px] font-bold">Nomes</th>
              {/* Gera 9 colunas de dias padrão conforme o PDF do Mês */}
              {(() => {
                const diasAlvo = String(curso?.dias).split('').map(Number);
                const datas: any[] = [];
                const ultimoDia = new Date(2026, mes + 1, 0).getDate();
                for (let d = 1; d <= ultimoDia; d++) {
                  const dataProd = new Date(2026, mes, d);
                  if (diasAlvo.includes(dataProd.getDay())) datas.push(d < 10 ? `0${d}` : d);
                }
                while(datas.length < 8) datas.push('__');
                return datas.slice(0, 8).map((dt, idx) => <th key={idx} className="border border-black w-10 text-[10px] font-bold">{dt}</th>);
              })()}
            </tr>
          </thead>
          <tbody>
            {linhasTabela.map((linha, idx) => {
              return (
                <tr key={idx} className="h-7">
                  <td className="border border-black text-center text-xs">{idx + 1}</td>
                  <td className="border border-black px-2 text-left">
                    <input 
                      className="w-full bg-transparent outline-none font-bold text-[11px] uppercase text-gray-800"
                      value={linha.nome || ""}
                      placeholder={linha.id ? "" : "_________________________________________________"}
                      onChange={(e) => {
                        const novoNome = e.target.value.toUpperCase();
                        const novaLista = [...alunosLocais];
                        const indexLocal = novaLista.findIndex(a => a.posicao === idx);
                        if (indexLocal >= 0) {
                          novaLista[indexLocal].nome = novoNome;
                        } else {
                          novaLista.push({ nome: novoNome, id: null, posicao: idx });
                        }
                        setAlunosLocais(novaLista);
                      }}
                      onBlur={() => salvarAlunoNoBanco(idx)}
                    />
                  </td>
                  {/* Gera os 8 boxes de chamada para a linha */}
                  {Array.from({ length: 8 }).map((_, colIdx) => {
                    const dataAula = `dia-${colIdx}`; // Para persistência local do front
                    return (
                      <td 
                        key={colIdx} 
                        onClick={() => alternarPresenca(idx, dataAula)}
                        className={`border border-black cursor-pointer text-sm font-bold select-none h-7
                          ${presencas[linha.id]?.[dataAula] === 'P' ? 'bg-green-100 text-green-700' : 
                            presencas[linha.id]?.[dataAula] === 'F' ? 'bg-red-100 text-red-700' : 
                            presencas[linha.id]?.[dataAula] === 'J' ? 'bg-blue-100 text-blue-700' : ''}`}
                      >
                        {presencas[linha.id]?.[dataAula] || ''}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* ASSINATURAS DO RODAPÉ RETIRADAS DO PDF */}
        <footer className="mt-8 grid grid-cols-2 gap-12 font-sans font-bold text-[10px] text-gray-800">
          <div className="flex flex-col items-center">
            <div className="w-64 border-b border-black mb-1"></div>
            <p className="uppercase">Coordenador(a) Pedagógico(a)</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-64 border-b border-black mb-1"></div>
            <p className="uppercase">Professor(a)</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

