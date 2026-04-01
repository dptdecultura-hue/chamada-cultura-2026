'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// Logotipos em Base64 extraídos do seu modelo
const LOGO_PREFEITURA = "data:image/png;base64,..." // Mantenha o código longo aqui
const LOGO_CULTURA = "data:image/png;base64,..."    // Mantenha o código longo aqui

export default function ChamadaCultura() {
  const [curso, setCurso] = useState<any>(null)
  const [alunos, setAlunos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Lógica de data para o seletor de meses
  const dataAtual = new Date()
  const [mes, setMes] = useState(dataAtual.getMonth())
  const [ano, setAno] = useState(dataAtual.getFullYear())

  const mesesNomes = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  useEffect(() => {
    fetchDados()
  }, [mes])

  async function fetchDados() {
    setLoading(true)
    try {
      // 1. Busca os dados do curso (Exemplo: ID 1 ou conforme sua lógica)
      const { data: cursoData } = await supabase
        .from('cursos')
        .select('*')
        .single()
      setCurso(cursoData)

      // 2. Busca alunos e filtra os ativos para o mês selecionado
      const { data: alunosData } = await supabase
        .from('alunos')
        .select('*')
        .order('nome', { ascending: true })

      if (alunosData) {
        const dataReferencia = new Date(ano, mes, 1)
        const ativosNoMes = alunosData.filter(aluno => {
          const dataMatricula = new Date(aluno.data_matricula)
          const dataCancelamento = aluno.data_cancelamento ? new Date(aluno.data_cancelamento) : null
          
          const jaMatriculado = dataMatricula <= new Date(ano, mes + 1, 0)
          const naoCanceladoAinda = !dataCancelamento || dataCancelamento >= dataReferencia
          
          return jaMatriculado && naoCanceladoAinda
        })
        setAlunos(ativosNoMes)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8 text-center">Carregando formulário...</div>

  return (
    <div className="min-h-screen bg-gray-100 p-4 print:p-0 print:bg-white">
      {/* SELETOR DE MÊS - Invisível na impressão */}
      <div className="max-w-[1000px] mx-auto mb-4 flex gap-4 items-center print:hidden bg-white p-4 rounded-lg shadow">
        <span className="font-bold text-gray-700">Visualizar mês de:</span>
        <select 
          value={mes} 
          onChange={(e) => setMes(Number(e.target.value))}
          className="border rounded px-3 py-1 bg-white"
        >
          {mesesNomes.map((nome, index) => (
            <option key={index} value={index}>{nome}</option>
          ))}
        </select>
        <button 
          onClick={() => window.print()}
          className="ml-auto bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
        >
          Imprimir Chamada
        </button>
      </div>

      {/* MODELO DE CHAMADA INTEGRADO */}
      <div className="w-[210mm] min-h-[297mm] mx-auto bg-white p-[10mm] shadow-lg print:shadow-none print:m-0 text-black font-sans border border-gray-200">
        
        {/* CABEÇALHO */}
        <header className="flex items-center justify-between border-b-2 border-black pb-4 mb-6">
          <img src={LOGO_PREFEITURA} alt="Prefeitura" className="h-16 w-auto object-contain" />
          <div className="text-center flex-1 px-4">
            <h1 className="text-xl font-black uppercase tracking-tighter leading-none">Secretaria de Cultura e Turismo</h1>
            <p className="text-[11px] font-bold mt-1 tracking-widest uppercase">Diário de Classe - Jardim Europa</p>
          </div>
          <img src={LOGO_CULTURA} alt="Cultura" className="h-16 w-auto object-contain" />
        </header>

        {/* INFO DO CURSO */}
        <div className="grid grid-cols-3 gap-y-3 mb-6 text-[10px] uppercase font-bold bg-gray-50 p-3 border border-gray-200">
          <div className="flex gap-2"><span>Curso:</span> <span className="font-normal border-b border-gray-400 flex-1">{curso?.oficina}</span></div>
          <div className="flex gap-2 px-2"><span>Professor:</span> <span className="font-normal border-b border-gray-400 flex-1">{curso?.professor}</span></div>
          <div className="flex gap-2"><span>Mês:</span> <span className="font-normal border-b border-gray-400 flex-1">{mesesNomes[mes]} / {ano}</span></div>
          
          <div className="flex gap-2"><span>Horário:</span> <span className="font-normal border-b border-gray-400 flex-1">{curso?.horario}</span></div>
          <div className="flex gap-2 px-2"><span>Local:</span> <span className="font-normal border-b border-gray-400 flex-1">Jardim Europa</span></div>
          <div className="flex gap-2"><span>Ativos:</span> <span className="font-normal border-b border-gray-400 flex-1 text-center">{alunos.length}</span></div>
        </div>

        {/* TABELA DE CHAMADA */}
        <table className="w-full border-collapse border border-black text-[9px]">
          <thead>
            <tr>
              <th className="border border-black w-8 py-2">Nº</th>
              <th className="border border-black px-2 text-left">NOME DO ALUNO</th>
              {/* Espaços para 20 dias de aula */}
              {Array.from({ length: 20 }).map((_, i) => (
                <th key={i} className="border border-black w-5 text-[7px] rotate-0">{i + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {alunos.map((aluno, index) => (
              <tr key={aluno.id} className="h-6">
                <td className="border border-black text-center font-bold">{index + 1}</td>
                <td className="border border-black px-2 uppercase truncate max-w-[200px]">{aluno.nome}</td>
                {Array.from({ length: 20 }).map((_, i) => (
                  <td key={i} className="border border-black bg-white"></td>
                ))}
              </tr>
            ))}
            {/* Linhas vazias para preencher a página */}
            {Array.from({ length: Math.max(0, 30 - alunos.length) }).map((_, i) => (
              <tr key={`empty-${i}`} className="h-6 opacity-40">
                <td className="border border-black text-center text-gray-300">{alunos.length + i + 1}</td>
                <td className="border border-black px-2"></td>
                {Array.from({ length: 20 }).map((_, j) => (
                  <td key={j} className="border border-black"></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* RODAPÉ */}
        <footer className="mt-8 flex flex-col gap-6">
          <div className="flex justify-between items-end px-4">
            <div className="text-center">
              <div className="border-t border-black w-64 pt-1">
                <p className="text-[9px] font-black uppercase">Coordenação Pedagógica</p>
              </div>
            </div>
            
            <p className="text-[8px] text-gray-400 italic text-center max-w-[300px]">
              "A cultura é o que nos torna humanos." — Ótimo mês de {mesesNomes[mes]} para o professor {curso?.professor}.
            </p>

            <div className="text-center">
              <div className="border-t border-black w-64 pt-1">
                <p className="text-[9px] font-black uppercase">Assinatura do Professor</p>
              </div>
            </div>
          </div>

          <div className="text-center text-[7px] text-gray-300 font-bold tracking-widest uppercase">
            Documento gerado em {new Date().toLocaleDateString()} — Sistema de Gestão de Cultura
          </div>
        </footer>
      </div>
    </div>
  )
}


