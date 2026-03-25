'use client'
import { useState } from 'react'

const LOGO_PREFEITURA = "data:image/png;base64,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"
const LOGO_CULTURA = "data:image/png;base64,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WY4O7hrh8znEdOY+HTwG6ifa80dqnUPEShbwmBv5CuzGMjdJBEXNDu8kO2489iPzWqUWNt+QT947lemMdPSqXwHC+pqrs+4jTWeoGhlIq3NFI+Pllry7nYnz29R6KnuElDifwp1/NGdL5W5inTdxfZBA58crAekjCPEjxH5LZKIy84BzXDId4QxjYrJXabr6617q+vBiNLZiXDY+Plru+GcBI9wBc/Y/YfZc/FdnHiYzHt7nMUKTLDA6SD4qRu248HADbfyWxUU26lIxgYwAALwxAnJWEpeGfE7QGuatnH4S3ds0JY54rNKJ0kT/AD232+oIW3tO35Mpg6WQlqzVJLELXvglaWvjcR1aQfQr3osVq46yB1DceVJjOjhERFTU0REREREREREREREREREREXg1Hdnx2Cu3q0Bnmghc9kY/WIXvQ9RsVJpAcCRlReC5pAOCqq4Za41BnNS/o/IMjlge1zi5sfL3ew6f3K1V8K1OnWc99arBC553eY4w0uPvt4r7qxbmjmk6o2dI9FUoV5a8XRK/rOeUREVVXURERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERF//2Q=="

type DiasVariante = 'terca-quinta' | 'segunda-quarta'

interface ConfigFrequencia {
  professor: string
  curso: string
  horario: string
  diasVariante: DiasVariante
  mes: string
  unidade: string
  totalAlunos: number
}

const DIAS_VARIANTES: Record<DiasVariante, { label: string; dias: number[] }> = {
  'terca-quinta': {
    label: 'Terça e Quinta',
    dias: [3, 5, 10, 12, 17, 19, 24, 26, 31],
  },
  'segunda-quarta': {
    label: 'Segunda e Quarta',
    dias: [2, 4, 9, 11, 16, 18, 23, 25, 30],
  },
}

export default function ModeloFrequencia() {
  const [config, setConfig] = useState<ConfigFrequencia>({
    professor: '',
    curso: '',
    horario: '',
    diasVariante: 'terca-quinta',
    mes: 'MARÇO',
    unidade: 'Casa da Cultura - Bela Vista (Sede)',
    totalAlunos: 25,
  })

  const [nomes, setNomes] = useState<string[]>(Array(25).fill(''))
  const [presencas, setPresencas] = useState<Record<number, Record<number, string>>>({})

  const variante = DIAS_VARIANTES[config.diasVariante]

  const handleNome = (i: number, val: string) => {
    const n = [...nomes]
    n[i] = val.toUpperCase()
    setNomes(n)
  }

  const ciclarPresenca = (alunoIdx: number, dia: number) => {
    const atual = presencas[alunoIdx]?.[dia] ?? ''
    const ciclo: Record<string, string> = { '': 'P', P: 'F', F: 'J', J: '' }
    const novo = ciclo[atual]
    setPresencas(p => ({
      ...p,
      [alunoIdx]: { ...(p[alunoIdx] ?? {}), [dia]: novo },
    }))
  }

  const corPresenca = (val: string) => {
    if (val === 'P') return 'bg-green-100 text-green-700'
    if (val === 'F') return 'bg-red-100 text-red-700'
    if (val === 'J') return 'bg-blue-100 text-blue-700'
    return ''
  }

  return (
    <div className="min-h-screen bg-gray-200 font-sans">
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 8mm; }
          .no-print { display: none !important; }
          body { background: white !important; }
          .folha { box-shadow: none !important; margin: 0 !important; }
          table { border-collapse: collapse !important; }
          th, td { border: 1px solid #000 !important; }
          input { border: none !important; background: transparent !important; }
        }
      `}</style>

      {/* ── PAINEL DE CONTROLE (não imprime) ── */}
      <div className="no-print bg-white border-b-4 border-blue-700 px-6 py-4 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <h1 className="text-base font-black uppercase text-blue-800 tracking-tight">
              Modelo de Frequência — Casa da Cultura
            </h1>
            <button
              onClick={() => window.print()}
              className="ml-auto bg-blue-700 text-white text-xs font-bold px-5 py-2 rounded hover:bg-blue-800 transition"
            >
              IMPRIMIR / SALVAR PDF
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="flex flex-col gap-1">
              <label className="font-bold text-gray-500 uppercase tracking-wide">Professor(a)</label>
              <input
                className="border border-gray-300 rounded px-2 py-1 uppercase"
                value={config.professor}
                onChange={e => setConfig(c => ({ ...c, professor: e.target.value }))}
                placeholder="Nome do professor"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-bold text-gray-500 uppercase tracking-wide">Curso</label>
              <input
                className="border border-gray-300 rounded px-2 py-1 uppercase"
                value={config.curso}
                onChange={e => setConfig(c => ({ ...c, curso: e.target.value }))}
                placeholder="Ex: Violão"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-bold text-gray-500 uppercase tracking-wide">Horário</label>
              <input
                className="border border-gray-300 rounded px-2 py-1"
                value={config.horario}
                onChange={e => setConfig(c => ({ ...c, horario: e.target.value }))}
                placeholder="Ex: 14h às 15h"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-bold text-gray-500 uppercase tracking-wide">Dias da Semana</label>
              <select
                className="border border-gray-300 rounded px-2 py-1"
                value={config.diasVariante}
                onChange={e => setConfig(c => ({ ...c, diasVariante: e.target.value as DiasVariante }))}
              >
                <option value="terca-quinta">Terça e Quinta</option>
                <option value="segunda-quarta">Segunda e Quarta</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-bold text-gray-500 uppercase tracking-wide">Mês</label>
              <input
                className="border border-gray-300 rounded px-2 py-1 uppercase"
                value={config.mes}
                onChange={e => setConfig(c => ({ ...c, mes: e.target.value.toUpperCase() }))}
                placeholder="Ex: MARÇO"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-bold text-gray-500 uppercase tracking-wide">Unidade</label>
              <input
                className="border border-gray-300 rounded px-2 py-1"
                value={config.unidade}
                onChange={e => setConfig(c => ({ ...c, unidade: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-bold text-gray-500 uppercase tracking-wide">Qtd. Alunos</label>
              <input
                type="number" min={1} max={25}
                className="border border-gray-300 rounded px-2 py-1"
                value={config.totalAlunos}
                onChange={e => setConfig(c => ({ ...c, totalAlunos: Math.min(25, Math.max(1, Number(e.target.value))) }))}
              />
            </div>
          </div>
          <p className="mt-2 text-[10px] text-gray-400">
            Clique nas células: <strong>P</strong> Presente → <strong>F</strong> Falta → <strong>J</strong> Justificada → vazio
          </p>
        </div>
      </div>

      {/* ── FOLHA OFICIAL ── */}
      <div className="folha max-w-[1100px] mx-auto my-8 bg-white shadow-2xl">

        {/* CABEÇALHO — logos reais idênticas ao PDF */}
        <div
          className="border border-black flex items-stretch bg-white"
          style={{ height: 110 }}
        >
          {/* Logo Prefeitura */}
          <div className="flex items-center justify-end px-4 flex-1">
            <img
              src={LOGO_PREFEITURA}
              alt="Prefeitura de Teixeira de Freitas — Secretaria de Cultura e Turismo"
              style={{ height: 100, maxWidth: '100%' }}
              className="object-contain"
            />
          </div>

          {/* Divisor central */}
          <div style={{ width: 1, background: '#bbb', margin: '8px 0' }} />

          {/* Logo Casa da Cultura */}
          <div className="flex items-center justify-center px-4 flex-1" style={{ overflow: 'hidden' }}>
            <img
              src={LOGO_CULTURA}
              alt="Casa da Cultura"
              style={{ height: 90, width: '100%', objectFit: 'contain' }}
            />
          </div>
        </div>

        {/* CAMPOS DO PROFESSOR */}
        <table className="w-full border-collapse text-xs font-bold" style={{ borderTop: 'none' }}>
          <tbody>
            <tr style={{ background: '#DCE6F1' }}>
              <td className="border border-black px-3 py-2 w-1/2">
                <span className="text-gray-600">Oficineiro (a)/ Professor (a):&nbsp;</span>
                <input
                  className="bg-transparent outline-none font-black text-gray-900 uppercase"
                  style={{ minWidth: 200 }}
                  value={config.professor}
                  onChange={e => setConfig(c => ({ ...c, professor: e.target.value }))}
                  placeholder="____________"
                />
              </td>
              <td className="border border-black px-3 py-2 w-1/2">
                <span className="text-gray-600">Curso:&nbsp;</span>
                <input
                  className="bg-transparent outline-none font-black text-gray-900 uppercase"
                  style={{ minWidth: 200 }}
                  value={config.curso}
                  onChange={e => setConfig(c => ({ ...c, curso: e.target.value }))}
                  placeholder="____________"
                />
              </td>
            </tr>
            <tr style={{ background: '#DCE6F1' }}>
              <td className="border border-black px-3 py-2">
                <span className="text-gray-600">Dias da Semana:&nbsp;</span>
                <span className="font-black text-gray-900">{variante.label}</span>
              </td>
              <td className="border border-black px-3 py-2">
                <span className="text-gray-600">Horário:&nbsp;</span>
                <input
                  className="bg-transparent outline-none font-black text-gray-900"
                  style={{ minWidth: 160 }}
                  value={config.horario}
                  onChange={e => setConfig(c => ({ ...c, horario: e.target.value }))}
                  placeholder="____________"
                />
              </td>
            </tr>
            <tr style={{ background: '#DCE6F1' }}>
              <td className="border border-black px-3 py-2">
                <span className="text-gray-600">{config.unidade}</span>
              </td>
              <td className="border border-black px-3 py-2 text-center">
                <span className="font-black text-gray-900 text-sm tracking-widest">{config.mes}</span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* TABELA DE CHAMADA */}
        <table className="w-full border-collapse text-xs font-bold" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: 44 }} />
            <col />
            {variante.dias.map(d => <col key={d} style={{ width: 40 }} />)}
          </colgroup>
          <thead>
            <tr style={{ background: '#B8CCE4' }} className="text-center">
              <th className="border border-black px-1 py-2 font-black">Ordem</th>
              <th className="border border-black px-2 py-2 text-left font-black">Nomes</th>
              {variante.dias.map(d => (
                <th key={d} className="border border-black py-2 font-black">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: config.totalAlunos }, (_, i) => {
              const num = i + 1
              return (
                <tr key={num} className="border border-black" style={{ height: 28 }}>
                  <td className="border border-black text-center font-bold text-gray-700">{num}</td>
                  <td className="border border-black px-2">
                    <input
                      className="w-full bg-transparent outline-none font-bold uppercase text-gray-800 text-xs"
                      value={nomes[i] ?? ''}
                      onChange={e => handleNome(i, e.target.value)}
                    />
                  </td>
                  {variante.dias.map(dia => {
                    const val = presencas[i]?.[dia] ?? ''
                    return (
                      <td
                        key={dia}
                        className={`border border-black text-center cursor-pointer select-none font-black text-sm ${corPresenca(val)}`}
                        onClick={() => ciclarPresenca(i, dia)}
                      >
                        {val}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* RODAPÉ COM ASSINATURAS */}
        <div className="border-l border-r border-b border-black px-6 pt-10 pb-6 flex justify-between items-end">
          <div className="text-center">
            <div style={{ width: 300, borderBottom: '1px solid black', marginBottom: 4 }} />
            <div className="text-xs font-bold text-gray-700 uppercase tracking-wide">
              Coordenador(a) Pedagógico(a)
            </div>
          </div>
          <div className="text-center">
            <div style={{ width: 300, borderBottom: '1px solid black', marginBottom: 4 }} />
            <div className="text-xs font-bold text-gray-700 uppercase tracking-wide">
              Professor(a)
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
