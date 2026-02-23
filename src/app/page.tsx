'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function CasaDaCultura2026() {
  const [tela, setTela] = useState('menu')
  const [profSel, setProfSel] = useState("")
  const [idAtivo, setIdAtivo] = useState<any>(null)
  const [mes, setMes] = useState(new Date().getMonth())
  const [turmas, setTurmas] = useState<any[]>([])
  const [alunosLocais, setAlunosLocais] = useState<any[]>([])
  const [presencas, setPresencas] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [contagemAlunos, setContagemAlunos] = useState<any>({})
  const [modoRelatorio, setModoRelatorio] = useState(false)

  const mesesNomes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]

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
      if(!gridPre[p.aluno_posicao]) gridPre[p.aluno_posicao] = {};
      gridPre[p.aluno_posicao][p.data_aula] = p.status;
    });
    setPresencas(gridPre);
  }

  const salvarAlunoNoBanco = async (index: number, idReal: any) => {
    const aluno = alunosLocais[index];
    if (aluno?.nome?.trim() !== "") {
      await supabase.from('alunos').upsert({ 
        id: idReal || undefined, 
        turma_id: idAtivo, 
        nome: aluno.nome.trim().toUpperCase(), 
        telefone: aluno.telefone || "",
        busca_ativa: aluno.busca_ativa || "",
        posicao: index 
      });
      fetchTurmas();
    }
  };

  const alternarPresenca = async (alunoPos: number, dataAula: string) => {
    const atual = presencas[alunoPos]?.[dataAula] || "";
    let novoStatus = (atual === "") ? "P" : (atual === "P") ? "F" : "";
    setPresencas((prev: any) => ({ ...prev, [alunoPos]: { ...(prev[alunoPos] || {}), [dataAula]: novoStatus } }));
    if (novoStatus === "") {
      await supabase.from('frequencia').delete().match({ turma_id: idAtivo, mes, aluno_posicao: alunoPos, data_aula: dataAula });
    } else {
      await supabase.from('frequencia').upsert({ turma_id: idAtivo, mes, aluno_posicao: alunoPos, data_aula: dataAula, status: novoStatus });
    }
  };

  const getDatasDoMes = (diasSemanaInput: any) => {
    const datas = [];
    const diasLimpos = String(diasSemanaInput).replace(/[^0-9,]/g, '');
    const diasSemana = diasLimpos.split(',').map(Number);
    const ultimoDia = new Date(2026, mes + 1, 0).getDate();
    for (let d = 1; d <= ultimoDia; d++) {
      const dataProd = new Date(2026, mes, d);
      if (diasSemana.includes(dataProd.getDay())) {
        datas.push(`${d < 10 ? '0'+d : d}/${mes+1 < 10 ? '0'+(mes+1) : mes+1}`);
      }
    }
    return datas.slice(0, 10);
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-2xl animate-pulse uppercase italic">Carregando...</div>;

  if (tela === 'menu') return (
    <div className="min-h-screen p-8 bg-[#F8FAFC] italic font-black uppercase">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-black mb-12 border-l-8 border-black pl-6 italic">Casa da Cultura <span className="text-blue-600">2026</span></h1>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[...new Set(turmas.map(t => t.professor))].sort().map(p => (
            <button key={p} onClick={() => {setProfSel(p); setTela('lista');}} className="border-4 border-black bg-white p-8 text-sm flex flex-col items-center shadow-[6px_6px_0px_#000] hover:translate-y-[-2px] transition-all">
              {p}
              <span className="text-[10px] text-blue-600 mt-2 font-bold italic">{turmas.filter(t => t.professor === p).reduce((acc, t) => acc + (contagemAlunos[t.id] || 0), 0)} ALUNOS</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (tela === 'lista') {
    const turmasDoProf = turmas.filter(t => t.professor === profSel);
    return (
      <div className="min-h-screen p-8 max-w-6xl mx-auto italic font-black uppercase">
        <button onClick={() => setTela('menu')} className="text-xs mb-8 border-2 border-black px-2 py-1 hover:bg-black hover:text-white transition-all">← Voltar</button>
        <h2 className="text-6xl mb-12 border-b-8 border-black pb-4 tracking-tighter">{profSel}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {['1,3', '2,4'].map((dias, idx) => (
            <div key={dias}>
              <h3 className={`text-white p-3 mb-6 text-center border-4 border-black shadow-[6px_6px_0px_#000] ${idx === 0 ? 'bg-blue-600' : 'bg-red-600'}`}>
                {idx === 0 ? 'Segunda e Quarta' : 'Terça e Quinta'}
              </h3>
              <div className="space-y-4">
                {turmasDoProf.filter(t => String(t.dias).includes(idx === 0 ? '1' : '2')).map(c => (
                  <div key={c.id} onClick={() => {setIdAtivo(c.id); setTela('chamada');}} className="bg-white border-4 p-4 cursor-pointer hover:scale-[1.02] transition-all flex justify-between items-center border-black shadow-[6px_6px_0px_#000]">
                    <div className="flex flex-col">
                      <span className="text-2xl italic tracking-tighter leading-none">{c.horario}</span>
                      <span className="text-[10px] text-gray-400 mt-1">{c.oficina}</span>
                    </div>
                    <span className="text-lg">{contagemAlunos[c.id] || 0} Vagas</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const cursoAtivo = turmas.find(c => c.id === idAtivo);
  const datasAulas = cursoAtivo ? getDatasDoMes(cursoAtivo.dias) : [];
  const diasTxt = String(cursoAtivo?.dias).includes('1') ? "SEGUNDA E QUARTA" : "TERÇA E QUINTA";

  return (
    <div className="min-h-screen italic font-black uppercase bg-white">
      <style>{`
        @media print { 
          .no-print { display: none !important; } 
          .folha-container { border: none !important; padding: 0 !important; width: 100% !important; max-width: 100% !important; }
          .relatorio-print { display: table-cell !important; }
        }
      `}</style>

      <nav className="no-print bg-white border-b-4 border-black p-4 sticky top-0 z-50 flex justify-between items-center px-8 shadow-md">
        <button onClick={()=>{setTela('lista'); setModoRelatorio(false)}} className="text-xs border-4 border-black px-4 py-2 hover:bg-black hover:text-white transition-all">← Voltar</button>
        <div className="flex gap-4">
          <button onClick={() => setModoRelatorio(!modoRelatorio)} className={`px-4 py-2 text-[10px] border-4 border-black shadow-[4px_4px_0px_#000] ${modoRelatorio ? 'bg-yellow-400' : 'bg-white'}`}>
            {modoRelatorio ? 'Ver Ficha de Aula' : 'Modo Busca Ativa'}
          </button>
          <button onClick={()=>window.print()} className="bg-black text-white px-6 py-2 text-[10px] border-4 border-black shadow-[4px_4px_0px_#ccc]">Gerar PDF</button>
        </div>
      </nav>

      <div className="folha-container max-w-[1300px] mx-auto bg-white p-10 mt-6 border-4 border-black">
        <header className="flex justify-between items-end mb-8 border-b-8 border-black pb-4">
          <div>
            <h1 className="text-5xl tracking-tighter mb-2">{cursoAtivo?.professor}</h1>
            <div className="flex gap-3 text-xs">
              <span>{cursoAtivo?.oficina}</span> | <span>{cursoAtivo?.horario}</span> | <span>{diasTxt}</span>
            </div>
          </div>
          <div className="text-right">
             <span className="text-4xl block">{modoRelatorio ? 'RELATÓRIO DE BUSCA ATIVA' : mesesNomes[mes]}</span>
          </div>
        </header>

        <table className="w-full border-collapse border-4 border-black">
          <thead>
            <tr className="bg-gray-100 text-[10px]">
              <th className="border-2 border-black w-10 p-2">Nº</th>
              <th className="border-2 border-black p-2 text-left">Aluno</th>
              {!modoRelatorio && <th className="border-2 border-black w-32 no-print bg-blue-50">Contato ADM</th>}
              <th className={`border-2 border-black p-2 text-left ${modoRelatorio ? 'w-auto' : 'w-48 no-print'} bg-yellow-50`}>Registro de Busca Ativa</th>
              {!modoRelatorio && datasAulas.map(dt => <th key={dt} className="border-2 border-black w-14">{dt}</th>)}
            </tr>
          </thead>
          <tbody>
            {alunosLocais.map((aluno, i) => {
              const faltas = Object.values(presencas[i] || {}).filter(v => v === "F").length;
              return (
                <tr key={i} className="h-10 text-xs">
                  <td className="border-2 border-black text-center text-gray-400">{i+1}</td>
                  <td className="border-2 border-black px-2 font-black uppercase">
                    <input className="w-full bg-transparent outline-none" value={aluno.nome} onChange={e=>{const n=[...alunosLocais]; n[i].nome=e.target.value.toUpperCase(); setAlunosLocais(n)}} onBlur={()=>salvarAlunoNoBanco(i, aluno.id)} />
                  </td>
                  {!modoRelatorio && (
                    <td className="border-2 border-black px-2 no-print">
                      <div className="flex items-center gap-1">
                        <input className="w-full bg-transparent text-[10px]" value={aluno.telefone||""} placeholder="73..." onChange={e=>{const n=[...alunosLocais]; n[i].telefone=e.target.value; setAlunosLocais(n)}} onBlur={()=>salvarAlunoNoBanco(i, aluno.id)} />
                        {aluno.telefone && <a href={`https://wa.me/55${aluno.telefone.replace(/\D/g,'')}`} target="_blank" className="text-green-500">ZAP</a>}
                      </div>
                    </td>
                  )}
                  <td className={`border-2 border-black px-2 ${modoRelatorio ? '' : 'no-print'}`}>
                    <input className="w-full bg-transparent outline-none text-[10px] italic" value={aluno.busca_ativa||""} placeholder="Anotar contato..." onChange={e=>{const n=[...alunosLocais]; n[i].busca_ativa=e.target.value; setAlunosLocais(n)}} onBlur={()=>salvarAlunoNoBanco(i, aluno.id)} />
                  </td>
                  {!modoRelatorio && datasAulas.map(dt => (
                    <td key={dt} onClick={() => alternarPresenca(i, dt)} className={`border-2 border-black text-center cursor-pointer font-black ${presencas[i]?.[dt] === 'P' ? 'bg-green-100' : presencas[i]?.[dt] === 'F' ? 'bg-red-100' : ''}`}>
                      {presencas[i]?.[dt]}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
