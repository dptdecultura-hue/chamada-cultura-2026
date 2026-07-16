// src/app/(dashboard)/alunos/page.js
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Loading from '@/components/ui/Loading'
import { formatarData, formatarCPF, formatarTelefone } from '@/lib/formatadores'

export default function PerfilAluno() {
  const [busca, setBusca] = useState('')
  const [aluno, setAluno] = useState(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [matriculas, setMatriculas] = useState([])
  const [editando, setEditando] = useState(false)
  const [formData, setFormData] = useState({})

  const buscarAluno = async () => {
    if (!busca.trim()) {
      setErro('Digite um CPF ou nome para buscar')
      return
    }

    setLoading(true)
    setErro('')
    setAluno(null)
    setMatriculas([])

    try {
      const { data: alunoData, error: alunoError } = await supabase
        .from('alunos')
        .select('*')
        .or(`cpf.eq.${busca},nome.ilike.%${busca}%`)
        .maybeSingle()

      if (alunoError) throw alunoError

      if (!alunoData) {
        setErro('Aluno não encontrado')
        setLoading(false)
        return
      }

      setAluno(alunoData)
      setFormData(alunoData)

      const { data: matriculasData, error: matriculasError } = await supabase
        .from('matriculas')
        .select(`
          *,
          turmas (
            oficina,
            horario,
            professor,
            unidade
          )
        `)
        .eq('aluno_id', alunoData.id)
        .order('data_matricula', { ascending: false })

      if (matriculasError) throw matriculasError
      setMatriculas(matriculasData || [])

    } catch (error) {
      console.error('Erro ao buscar aluno:', error)
      setErro('Erro ao buscar aluno')
    } finally {
      setLoading(false)
    }
  }

  const salvarAlteracoes = async () => {
    try {
      const { error } = await supabase
        .from('alunos')
        .update(formData)
        .eq('id', aluno.id)

      if (error) throw error

      setAluno(formData)
      setEditando(false)
      alert('✅ Dados atualizados com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar:', error)
      alert('❌ Erro ao salvar alterações')
    }
  }

  const calcularIdade = (dataNascimento) => {
    if (!dataNascimento) return 'N/A'
    const hoje = new Date()
    const nasc = new Date(dataNascimento)
    let idade = hoje.getFullYear() - nasc.getFullYear()
    const mes = hoje.getMonth() - nasc.getMonth()
    if (mes < 0 || (mes === 0 && hoje.getDate() < nasc.getDate())) {
      idade--
    }
    return idade
  }

  const isAtivo = matriculas.some(m => m.status === 'cursando')

  const formatarUnidade = (unidade) => {
    const mapa = {
      'jardim_europa': 'Jardim Europa',
      'centro': 'Centro',
      'sede': 'Sede'
    }
    return mapa[unidade] || unidade
  }

  const renderStatus = (status) => {
    const cores = {
      'cursando': '🟢 Cursando',
      'concluido': '✅ Concluído',
      'desistente': '🔴 Desistente',
      'transferido': '🟡 Transferido'
    }
    return cores[status] || status
  }

  if (loading) {
    return <Loading mensagem="Buscando aluno..." />
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/menu" className="text-xs border-2 border-black px-4 py-2 font-black italic uppercase bg-white hover:bg-black hover:text-white transition-all">
              ← VOLTAR
            </Link>
            <h1 className="text-3xl font-black border-l-8 border-black pl-4">
              PERFIL DO <span className="text-blue-600">ALUNO</span>
            </h1>
          </div>
          <Link
            href="/alunos/novo"
            className="bg-emerald-600 text-white px-6 py-2 font-black uppercase text-sm border-2 border-black shadow-[4px_4px_0px_#000] hover:bg-emerald-500 transition-all"
          >
            + NOVO ALUNO
          </Link>
        </div>

        <div className="bg-white border-4 border-black p-4 mb-6 shadow-[4px_4px_0px_#000]">
          <div className="flex gap-2">
            <input
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && buscarAluno()}
              placeholder="Digite o CPF ou nome do aluno"
              className="flex-1 border-2 border-black px-4 py-2 text-sm font-bold uppercase outline-none"
            />
            <button
              onClick={buscarAluno}
              disabled={loading}
              className="bg-black text-white px-6 py-2 font-black uppercase text-sm border-2 border-black hover:bg-white hover:text-black transition-all disabled:opacity-50"
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
          {erro && (
            <div className="mt-2 text-red-600 font-bold text-sm">{erro}</div>
          )}
        </div>

        {aluno && (
          <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0px_#000] mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-3xl font-black">{aluno.nome}</h2>
                {aluno.nome_social && (
                  <p className="text-sm text-gray-600">Nome social: {aluno.nome_social}</p>
                )}
                <p className="text-sm text-gray-600">
                  CPF: {formatarCPF(aluno.cpf)} | Idade: {calcularIdade(aluno.data_nascimento)} anos
                </p>
                <div className="flex gap-4 mt-2 text-sm flex-wrap">
                  <span>📞 {aluno.telefone || 'N/A'}</span>
                  <span>📱 {aluno.whatsapp || 'N/A'}</span>
                  <span>📧 {aluno.email || 'N/A'}</span>
                </div>
                <p className="text-sm mt-1 text-gray-600">
                  📍 {aluno.endereco_rua || 'N/A'}, {aluno.endereco_numero || 'N/A'} - {aluno.endereco_bairro || 'N/A'} - {aluno.endereco_cidade || 'N/A'}
                </p>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-black ${isAtivo ? 'text-green-600' : 'text-red-600'}`}>
                  {isAtivo ? '🟢 ATIVO' : '🔴 INATIVO'}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Matrícula: {formatarData(aluno.data_matricula)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 border-2 border-black">
              <div><p className="text-xs font-black uppercase text-gray-500">Curso</p><p className="font-bold">{aluno.curso || 'N/A'}</p></div>
              <div><p className="text-xs font-black uppercase text-gray-500">Nível</p><p className="font-bold">{aluno.nivel || 'N/A'}</p></div>
              <div><p className="text-xs font-black uppercase text-gray-500">Horário</p><p className="font-bold">{aluno.horario || 'N/A'}</p></div>
              <div><p className="text-xs font-black uppercase text-gray-500">Unidade</p><p className="font-bold">{formatarUnidade(aluno.unidade)}</p></div>
              <div><p className="text-xs font-black uppercase text-gray-500">Escola</p><p className="font-bold">{aluno.escola || 'N/A'}</p></div>
              <div><p className="text-xs font-black uppercase text-gray-500">NIS</p><p className="font-bold">{aluno.nis || 'N/A'}</p></div>
            </div>

            {aluno.responsavel_nome && (
              <div className="mt-4 p-3 bg-blue-50 border-2 border-blue-300">
                <p className="text-sm font-bold">👨‍👩‍👧 Responsável: {aluno.responsavel_nome}</p>
                <p className="text-sm">📞 {aluno.responsavel_telefone || 'N/A'} | CPF: {formatarCPF(aluno.responsavel_cpf)} | Profissão: {aluno.responsavel_profissao || 'N/A'}</p>
              </div>
            )}

            {(aluno.alergias === 'SIM' || aluno.problemas_saude === 'SIM') && (
              <div className="mt-4 p-3 bg-red-50 border-2 border-red-300">
                <p className="text-sm font-bold">⚠️ Informações de Saúde</p>
                {aluno.alergias === 'SIM' && <p className="text-sm">Alergias: {aluno.alergias_quais || 'Não especificado'}</p>}
                {aluno.problemas_saude === 'SIM' && <p className="text-sm">Problemas de saúde: {aluno.problemas_saude_quais || 'Não especificado'}</p>}
                <p className="text-sm">Tipo sanguíneo: {aluno.tipo_sanguineo || 'N/A'} | SUS: {aluno.sus_numero || 'N/A'}</p>
              </div>
            )}

            <div className="flex gap-4 mt-6 flex-wrap">
              <button onClick={() => setEditando(!editando)} className="bg-yellow-400 px-6 py-2 font-black uppercase text-sm border-2 border-black hover:bg-yellow-300 transition-all">
                {editando ? '✕ CANCELAR EDIÇÃO' : '✎ EDITAR PERFIL'}
              </button>
              <Link href={`/matricula/nova?alunoId=${aluno.id}`} className="bg-emerald-600 text-white px-6 py-2 font-black uppercase text-sm border-2 border-black hover:bg-emerald-500 transition-all inline-block text-center">
                📋 NOVA MATRÍCULA
              </Link>
              <button onClick={() => window.print()} className="bg-purple-600 text-white px-6 py-2 font-black uppercase text-sm border-2 border-black hover:bg-purple-500 transition-all">
                📊 RELATÓRIO
              </button>
            </div>

            {editando && (
              <div className="mt-6 p-4 border-4 border-black bg-white">
                <h3 className="font-black text-lg mb-4">✎ Editar Dados do Aluno</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-xs font-black uppercase">Nome *</label><input type="text" value={formData.nome || ''} onChange={e => setFormData({...formData, nome: e.target.value.toUpperCase()})} className="w-full border-2 border-black px-2 py-1 text-sm" /></div>
                  <div><label className="block text-xs font-black uppercase">Nome social</label><input type="text" value={formData.nome_social || ''} onChange={e => setFormData({...formData, nome_social: e.target.value.toUpperCase()})} className="w-full border-2 border-black px-2 py-1 text-sm" /></div>
                  <div><label className="block text-xs font-black uppercase">CPF</label><input type="text" value={formData.cpf || ''} onChange={e => setFormData({...formData, cpf: e.target.value})} className="w-full border-2 border-black px-2 py-1 text-sm" /></div>
                  <div><label className="block text-xs font-black uppercase">Data de nascimento</label><input type="date" value={formData.data_nascimento || ''} onChange={e => setFormData({...formData, data_nascimento: e.target.value})} className="w-full border-2 border-black px-2 py-1 text-sm" /></div>
                  <div><label className="block text-xs font-black uppercase">Telefone</label><input type="text" value={formData.telefone || ''} onChange={e => setFormData({...formData, telefone: e.target.value})} className="w-full border-2 border-black px-2 py-1 text-sm" /></div>
                  <div><label className="block text-xs font-black uppercase">WhatsApp</label><input type="text" value={formData.whatsapp || ''} onChange={e => setFormData({...formData, whatsapp: e.target.value})} className="w-full border-2 border-black px-2 py-1 text-sm" /></div>
                  <div><label className="block text-xs font-black uppercase">Curso</label><input type="text" value={formData.curso || ''} onChange={e => setFormData({...formData, curso: e.target.value.toUpperCase()})} className="w-full border-2 border-black px-2 py-1 text-sm" /></div>
                  <div><label className="block text-xs font-black uppercase">Nível</label><input type="text" value={formData.nivel || ''} onChange={e => setFormData({...formData, nivel: e.target.value.toUpperCase()})} className="w-full border-2 border-black px-2 py-1 text-sm" /></div>
                  <div><label className="block text-xs font-black uppercase">Horário</label><input type="text" value={formData.horario || ''} onChange={e => setFormData({...formData, horario: e.target.value})} className="w-full border-2 border-black px-2 py-1 text-sm" /></div>
                  <div><label className="block text-xs font-black uppercase">Unidade</label><select value={formData.unidade || 'jardim_europa'} onChange={e => setFormData({...formData, unidade: e.target.value})} className="w-full border-2 border-black px-2 py-1 text-sm"><option value="jardim_europa">Jardim Europa</option><option value="centro">Centro</option><option value="sede">Sede</option></select></div>
                  <div><label className="block text-xs font-black uppercase">Escola</label><input type="text" value={formData.escola || ''} onChange={e => setFormData({...formData, escola: e.target.value.toUpperCase()})} className="w-full border-2 border-black px-2 py-1 text-sm" /></div>
                  <div><label className="block text-xs font-black uppercase">NIS</label><input type="text" value={formData.nis || ''} onChange={e => setFormData({...formData, nis: e.target.value})} className="w-full border-2 border-black px-2 py-1 text-sm" /></div>
                  <div className="md:col-span-2"><label className="block text-xs font-black uppercase">Responsável</label><input type="text" value={formData.responsavel_nome || ''} onChange={e => setFormData({...formData, responsavel_nome: e.target.value.toUpperCase()})} className="w-full border-2 border-black px-2 py-1 text-sm" /></div>
                  <div><label className="block text-xs font-black uppercase">CPF do responsável</label><input type="text" value={formData.responsavel_cpf || ''} onChange={e => setFormData({...formData, responsavel_cpf: e.target.value})} className="w-full border-2 border-black px-2 py-1 text-sm" /></div>
                  <div><label className="block text-xs font-black uppercase">Telefone do responsável</label><input type="text" value={formData.responsavel_telefone || ''} onChange={e => setFormData({...formData, responsavel_telefone: e.target.value})} className="w-full border-2 border-black px-2 py-1 text-sm" /></div>
                  <div><label className="block text-xs font-black uppercase">Endereço - Rua</label><input type="text" value={formData.endereco_rua || ''} onChange={e => setFormData({...formData, endereco_rua: e.target.value.toUpperCase()})} className="w-full border-2 border-black px-2 py-1 text-sm" /></div>
                  <div><label className="block text-xs font-black uppercase">Número</label><input type="text" value={formData.endereco_numero || ''} onChange={e => setFormData({...formData, endereco_numero: e.target.value})} className="w-full border-2 border-black px-2 py-1 text-sm" /></div>
                  <div><label className="block text-xs font-black uppercase">Bairro</label><input type="text" value={formData.endereco_bairro || ''} onChange={e => setFormData({...formData, endereco_bairro: e.target.value.toUpperCase()})} className="w-full border-2 border-black px-2 py-1 text-sm" /></div>
                  <div className="md:col-span-2"><label className="block text-xs font-black uppercase">Cidade</label><input type="text" value={formData.endereco_cidade || ''} onChange={e => setFormData({...formData, endereco_cidade: e.target.value.toUpperCase()})} className="w-full border-2 border-black px-2 py-1 text-sm" /></div>
                  <div><label className="block text-xs font-black uppercase">Alergias?</label><select value={formData.alergias || ''} onChange={e => setFormData({...formData, alergias: e.target.value})} className="w-full border-2 border-black px-2 py-1 text-sm"><option value="">Selecione</option><option value="SIM">Sim</option><option value="NAO">Não</option></select></div>
                  <div><label className="block text-xs font-black uppercase">Quais alergias?</label><input type="text" value={formData.alergias_quais || ''} onChange={e => setFormData({...formData, alergias_quais: e.target.value.toUpperCase()})} className="w-full border-2 border-black px-2 py-1 text-sm" /></div>
                  <div><label className="block text-xs font-black uppercase">Problemas de saúde?</label><select value={formData.problemas_saude || ''} onChange={e => setFormData({...formData, problemas_saude: e.target.value})} className="w-full border-2 border-black px-2 py-1 text-sm"><option value="">Selecione</option><option value="SIM">Sim</option><option value="NAO">Não</option></select></div>
                  <div><label className="block text-xs font-black uppercase">Quais problemas?</label><input type="text" value={formData.problemas_saude_quais || ''} onChange={e => setFormData({...formData, problemas_saude_quais: e.target.value.toUpperCase()})} className="w-full border-2 border-black px-2 py-1 text-sm" /></div>
                  <div><label className="block text-xs font-black uppercase">Tipo sanguíneo</label><input type="text" value={formData.tipo_sanguineo || ''} onChange={e => setFormData({...formData, tipo_sanguineo: e.target.value.toUpperCase()})} className="w-full border-2 border-black px-2 py-1 text-sm" /></div>
                  <div><label className="block text-xs font-black uppercase">Nº do SUS</label><input type="text" value={formData.sus_numero || ''} onChange={e => setFormData({...formData, sus_numero: e.target.value})} className="w-full border-2 border-black px-2 py-1 text-sm" /></div>
                </div>
                <div className="flex gap-4 mt-4">
                  <button onClick={salvarAlteracoes} className="bg-blue-600 text-white px-6 py-2 font-black uppercase text-sm border-2 border-black hover:bg-blue-500 transition-all">💾 SALVAR ALTERAÇÕES</button>
                  <button onClick={() => { setEditando(false); setFormData(aluno) }} className="bg-gray-200 px-6 py-2 font-black uppercase text-sm border-2 border-black hover:bg-gray-300 transition-all">CANCELAR</button>
                </div>
              </div>
            )}
          </div>
        )}

        {aluno && matriculas.length > 0 && (
          <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0px_#000] mb-6">
            <h3 className="text-xl font-black uppercase mb-4">📚 Histórico de Cursos</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead><tr className="bg-gray-100 border-2 border-black"><th className="px-4 py-2 text-left font-black">Curso</th><th className="px-4 py-2 text-left font-black">Casa</th><th className="px-4 py-2 text-left font-black">Professor</th><th className="px-4 py-2 text-left font-black">Período</th><th className="px-4 py-2 text-left font-black">Status</th></tr></thead>
                <tbody>
                  {matriculas.map((m) => (
                    <tr key={m.id} className="border-b-2 border-black hover:bg-gray-50">
                      <td className="px-4 py-2 font-bold">{m.turmas?.oficina || 'N/A'}</td>
                      <td className="px-4 py-2">{formatarUnidade(m.turmas?.unidade || m.unidade)}</td>
                      <td className="px-4 py-2">{m.turmas?.professor || 'N/A'}</td>
                      <td className="px-4 py-2 text-sm">{formatarData(m.data_matricula)} - {m.data_conclusao ? formatarData(m.data_conclusao) : 'Atual'}</td>
                      <td className="px-4 py-2 font-bold">{renderStatus(m.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!aluno && !loading && !erro && (
          <div className="text-center py-16">
            <p className="text-3xl font-black italic text-gray-300">BUSQUE UM ALUNO</p>
            <p className="text-sm text-gray-400 mt-2">Digite o CPF ou nome no campo acima</p>
          </div>
        )}
      </div>
    </div>
  )
}
