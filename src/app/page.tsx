'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image' // Importação nativa para otimizar imagens

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
    if (tData) setTurmas(tData.sort((a: any, b: any) => a.horario.localeCompare(b.horario)));
    setLoading(false);
  }

  async function fetchDadosGlobais() {
    const { data: freq } = await supabase.from('frequencia').select('*').eq('mes', mes);
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

  const alternarPresenca = async (index: number, dataAula: string) => {
    let aId = alunosLocais[index].id;
    if (!aId) return;
    const atual = presencas[aId]?.[dataAula] || "";
    let novoStatus = (atual === "") ? "P" : (atual === "P") ? "F" : (atual === "F") ? "J" : "";
    setPresencas((p: any) => ({ ...p, [aId]: { ...(p[aId] || {}), [dataAula]: novoStatus } }));
    if (novoStatus === "") await supabase.from('frequencia').delete().eq('aluno_id', aId).eq('data_aula', dataAula).eq('mes', mes);
    else await supabase.from('frequencia').upsert({ aluno_id: aId, turma_id: idAtivo, data_aula: dataAula, mes: mes, status: novoStatus });
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black text-2xl uppercase italic text-black bg-white">CARREGANDO...</div>;

  // Lógica de menus e listas omitida para focar na folha de impressão
  if (tela !== 'chamada') return <div className="p-10 text-center">Acesse uma turma para ver a folha de impressão.</div>;

  const curso = turmas.find((t: any) => t.id === idAtivo);
  
  return (
    <div className="min-h-screen font-sans bg-white text-black uppercase">
      <title>CASA DA CULTURA 2026 - IMPRESSÃO</title>
      <style jsx global>{`
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .folha-container { border: none !important; box-shadow: none !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
          table { width: 100% !important; border-collapse: collapse !important; }
          th, td { border: 1px solid black !important; padding: 2px !important; }
          /* Garante que as cores de fundo apareçam na impressão */
          .bg-head-1 { background-color: #B8CCE4 !important; }
          .bg-head-2 { background-color: #DCE6F1 !important; }
        }
      `}</style>

      <nav className="no-print bg-gray-100 border-b p-4 sticky top-0 z-50 flex justify-between gap-4 shadow">
        <button onClick={()=>setTela('menu')} className="border px-4 py-1 rounded">VOLTAR</button>
        <button onClick={()=>window.print()} className="bg-black text-white px-6 py-1 rounded font-bold">IMPRIMIR FOLHA</button>
      </nav>

      <div className="folha-container max-w-[1000px] mx-auto p-[15mm] bg-white text-[11px]">
        
        {/* CABEÇALHO COM LOGO OFICIAL EM ALTA RESOLUÇÃO */}
        <div className="border border-black mb-1 p-3 flex justify-between items-center relative h-[100px]">
          {/* Componente Image do Next.js garante nitidez máxima */}
          <div className="relative h-16 w-[350px]">
            <Image 
              src="/logo-prefeitura.png" // Caminho para a imagem na pasta public
              alt="Logo Prefeitura Teixeira de Freitas"
              fill
              className="object-contain object-left"
              priority
            />
          </div>

          <div className="h-16 w-[1px] bg-gray-300"></div>

          <div className="flex flex-col text-right font-sans">
            <span className="text-[20px] font-black text-gray-800 leading-none">CASA DA</span>
            <span className="text-[20px] font-black text-blue-600 leading-none">CULTURA</span>
            <span className="text-[9px] font-bold text-gray-500 mt-1">JARDIM EUROPA</span>
          </div>
        </div>

        {/* INFORMAÇÕES DA TURMA (AZUL CLARO IGUAL AO MODELO) */}
        <table className="w-full border-collapse font-sans font-bold mb-1">
          <tbody>
            <tr className="border border-black bg-head-2">
              <td className="p-2 border-r border-black w-1/2">
                OFICINEIRO (A) / PROFESSOR (A): <span className="font-black text-gray-900">{curso?.professor || '____________________'}</span>
              </td>
              <td className="p-2 w-1/2">
                CURSO: <span className="font-black text-gray-900">{curso?.oficina || '____________________'}</span>
              </td>
            </tr>
            <tr className="border border-black bg-head-2">
              <td className="p-2 border-r border-black w-1/2">
                DIAS DA SEMANA: <span className="font-black text-gray-900">{String(curso?.dias).includes('2') ? 'TERÇA E QUINTA' : 'SEGUNDA E QUARTA'}</span>
              </td>
              <td className="p-2 w-1/2">
                HORÁRIO: <span className="font-black text-gray-900">{curso?.horario || '__:__ às __:__'}</span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* TABELA DE CHAMADA */}
        <table className="w-full border-collapse font-sans font-bold text-center">
          <thead>
            <tr className="bg-head-1 border border-black h-8">
              <th className="border border-black w-10">ORDEM</th>
              <th className="border border-black p-2 text-left min-w-[300px]">NOMES</th>
              <th className="border border-black h-5" colSpan={9}>{mesesNomes[mes]}</th>
            </tr>
            <tr className="bg-head-2 border border-black h-8 text-[10px]">
              {/* Gera as colunas de dias automaticamente com base no mês e dias da turma */}
              {(() => {
                const diasAlvo = String(curso?.dias).includes('2') ? [2, 4] : [1, 3];
                const datas: any[] = [];
                const ultimoDia = new Date(2026, mes + 1, 0).getDate();
                for (let d = 1; d <= ultimoDia; d++) {
                  const dataProd = new Date(2026, mes, d);
                  if (diasAlvo.includes(dataProd.getDay())) datas.push(d < 10 ? `0${d}` : d);
                }
                // Preenche com 9 colunas padrão do modelo se não houver datas suficientes
                while(datas.length < 9) datas.push('__');
                return datas.slice(0, 9).map((dt, idx) => <th key={idx} className="border border-black w-10">{dt}</th>);
              })()}
            </tr>
          </thead>
          <tbody>
            {/* Gera 12 linhas vazias padrão do modelo se não houver alunos */}
            {(alunosLocais.length > 0 ? alunosLocais : Array(12).fill({})).map((aluno, i) => (
              <tr key={i} className="border border-black h-7 text-xs">
                <td className="border border-black text-center">{i+1}</td>
                <td className="border border-black px-2 text-left uppercase text-gray-800">
                  {aluno.nome || '________________________________________'}
                </td>
                {/* Gera as 9 colunas de presença vazias */}
                {Array(9).fill('').map((_, idx) => (
                  <td key={idx} className="border border-black"></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* RODAPÉ */}
        <footer className="mt-8 flex flex-col gap-6 font-bold text-[10px] text-gray-600">
          <div className="flex justify-between items-center italic">
            <p className="max-w-[60%] border-l-2 border-black pl-3 uppercase">
              A UNIDADE DA CASA DA CULTURA DO JARDIM EUROPA DESEJA UM ÓTIMO MÊS — QUE A ARTE CONTINUE TRANSFORMANDO VIDAS.
            </p>
            <div className="text-center font-sans font-bold text-gray-800">
              <div className="w-64 border-b border-black mb-1"></div>
              <p className="uppercase text-[9px]">ASSINATURA DO PROFESSOR(A)</p>
            </div>
          </div>
          <div className="text-center text-[7px] text-gray-400 tracking-[0.3em] uppercase">
            FOLHA DE CONTROLE DE FREQUÊNCIA - SECRETARIA DE CULTURA 2026
          </div>
        </footer>
      </div>
    </div>
  );
}

