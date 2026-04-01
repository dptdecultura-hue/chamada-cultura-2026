'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// --- AS LOGOS (MANTENHA AS STRINGS ORIGINAIS DO SEU ARQUIVO AQUI) ---
const LOGO_PREFEITURA = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..." // Cole aqui a string do seu arquivo
const LOGO_CULTURA = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..."    // Cole aqui a string do seu arquivo

export default function CasaDaCultura2026() {
  // 1. TODA A SUA LÓGICA ORIGINAL (ESTADOS)
  const [tela, setTela] = useState('menu')
  const [profSel, setProfSel] = useState("")
  const [filtroOficina, setFiltroOficina] = useState("")
  const [idAtivo, setIdAtivo] = useState(null)
  const [mes, setMes] = useState(new Date().getMonth())
  const [turmas, setTurmas] = useState([])
  const [alunosLocais, setAlunosLocais] = useState([])
  const [presencas, setPresencas] = useState({})
  const [loading, setLoading] = useState(true)
  const mesesNomes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]

  // 2. TODAS AS SUAS FUNÇÕES (MANTENHA EXATAMENTE COMO NO SEU "CODIGO PERFEITO")
  // [Aqui ficam suas funções fetchDados, fetchDadosGlobais, detectarGenero, etc.]

  const curso = turmas.find(t => t.id === idAtivo)

  return (
    <div className="min-h-screen bg-gray-100 p-4 print:p-0 print:bg-white font-sans">
      
      {/* INTERFACE DE GESTÃO - NO-PRINT (O QUE VOCÊ VÊ NO COMPUTADOR) */}
      <div className="no-print">
         {/* Cole aqui todo o conteúdo do seu menu e filtros originais */}
         <button onClick={() => window.print()} className="bg-blue-600 text-white p-2 rounded">Imprimir Folha</button>
      </div>

      {/* ÁREA DE IMPRESSÃO - LAYOUT IDENTICO AO PREVIEW.HTML */}
      <div className="hidden print:block bg-white w-[210mm] mx-auto">
        
        {/* CABEÇALHO COM LOGOS DO PREVIEW */}
        <div className="flex items-stretch border border-black h-[110px] bg-white mb-4">
          <div className="flex-1 flex items-center justify-end px-4">
            <img src={LOGO_PREFEITURA} alt="Prefeitura" className="h-[85px] object-contain" />
          </div>
          
          <div className="w-[380px] border-x border-black flex flex-col items-center justify-center text-center p-2">
            <h1 className="font-black text-[18px] uppercase leading-tight">Lista de Chamada</h1>
            <div className="w-full border-b border-black my-1"></div>
            <p className="text-[12px] font-black uppercase">{curso?.oficina || 'OFICINA'}</p>
          </div>

          <div className="flex-1 flex items-center justify-start px-4">
            <img src={LOGO_CULTURA} alt="Cultura" className="h-[85px] object-contain" />
          </div>
        </div>

        {/* TABELA DE ALUNOS (ESTRUTURA DO PREVIEW + DADOS DO SUPABASE) */}
        <table className="w-full border-collapse border border-black">
          <thead>
            <tr className="bg-gray-100 uppercase font-black text-[10px]">
              <th className="border border-black p-1 w-8">Nº</th>
              <th className="border border-black p-1 text-left">Nome do Aluno</th>
              {[...Array(31)].map((_, i) => (
                <th key={i} className="border border-black text-[9px] w-5">{i + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {alunosLocais.map((aluno, index) => (
              <tr key={aluno.id}>
                <td className="border border-black text-center text-[10px] py-1 font-bold">{index + 1}</td>
                <td className="border border-black px-2 text-[10px] font-bold uppercase truncate max-w-[200px]">
                  {aluno.nome}
                </td>
                {[...Array(31)].map((_, i) => (
                  <td key={i} className="border border-black"></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* RODAPÉ DO PREVIEW_FOLHA.HTML */}
        <footer className="mt-8 flex flex-col gap-4">
          <div className="flex justify-between items-end gap-4 px-4">
            
            <div className="text-center">
              <div className="w-[260px] border-bottom border-black mb-1" style={{borderBottom: '1px solid black'}}></div>
              <p className="text-[9px] font-black uppercase">Coordenador(a) Pedagógico(a)</p>
            </div>

            <p className="text-[8px] text-gray-400 italic text-center leading-relaxed max-w-[380px]">
              A Secretaria de Cultura e Turismo deseja ao professor do curso de {curso?.oficina} um ótimo mês de {mesesNomes[mes].toLowerCase()}.
            </p>

            <div className="text-center">
              <div className="w-[260px] border-bottom border-black mb-1" style={{borderBottom: '1px solid black'}}></div>
              <p className="text-[9px] font-black uppercase">
                Professor(a): {curso?.professor || profSel}
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

