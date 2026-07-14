'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { UNIDADES, NOMES_DIAS_SEMANA } from '@/lib/constants'

export default function NovoAluno() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [mensagem, setMensagem] = useState(null)

  // Estados para os filtros
  const [turmas, setTurmas] = useState([])
  const [cursosFiltrados, setCursosFiltrados] = useState([])
  const [horariosFiltrados, setHorariosFiltrados] = useState([])
  const [diasDaTurma, setDiasDaTurma] = useState([])

  // Estado do formulário
  const [formData, setFormData] = useState({
    nome: '',
    nome_social: '',
    cpf: '',
    data_nascimento: '',
    telefone: '',
    whatsapp: '',
    email: '',
    unidade: 'jardim_europa',
    curso: '',
    horario: '',
    escola: '',
    nis: '',
    endereco_rua: '',
    endereco_numero: '',
    endereco_bairro: '',
    endereco_cidade: '',
    responsavel_nome: '',
    responsavel_cpf: '',
    responsavel_telefone: '',
    responsavel_profissao: '',
    alergias: '',
    alergias_quais: '',
    problemas_saude: '',
    problemas_saude_quais: '',
    tipo_sanguineo: '',
    sus_numero: '',
    matricular_agora: true,
  })

  // Buscar turmas ao carregar
  useEffect(() => {
    fetchTurmas()
  }, [])

  // Quando a unidade muda, filtrar os cursos
  useEffect(() => {
    if (formData.unidade) {
      const turmasDaUnidade = turmas.filter(t => t.unidade === formData.unidade)
      const cursos = [...new Set(turmasDaUnidade.map(t => {
        const nome = t.oficina || ''
        return nome.split('(')[0].trim()
      }))].sort()
      setCursosFiltrados(cursos)
      setFormData(prev => ({ ...prev, curso: '', horario: '' }))
      setHorariosFiltrados([])
      setDiasDaTurma([])
    }
  }, [formData.unidade, turmas])

  // Quando o curso muda, filtrar os horários
  useEffect(() => {
    if (formData.curso && formData.unidade) {
      const turmasDoCurso = turmas.filter(t => 
        t.unidade === formData.unidade && 
        t.oficina && 
        t.oficina.split('(')[0].trim() === formData.curso
      )
      const horarios = [...new Set(turmasDoCurso.map(t => t.horario))].sort()
      setHorariosFiltrados(horarios)
      setFormData(prev => ({ ...prev, horario: '' }))
      setDiasDaTurma([])
    }
  }, [formData.curso, formData.unidade, turmas])

  // ✅ CORRIGIDO: Buscar TODOS os dias de TODAS as turmas do mesmo horário
  useEffect(() => {
    if (formData.horario && formData.curso && formData.unidade) {
      const turmasDoHorario = turmas.filter(t => 
        t.unidade === formData.unidade && 
        t.oficina && 
        t.oficina.split('(')[0].trim() === formData.curso && 
        t.horario === formData.horario
      )
      // Pega todos os dias de todas as turmas do mesmo horário
      const todosDias = [...new Set(turmasDoHorario.flatMap(t => t.dias || []))].sort((a, b) => a - b)
      setDiasDaTurma(todosDias)
    }
  }, [formData.horario, formData.curso, formData.unidade, turmas])

  async function fetchTurmas() {
    const { data, error } = await supabase
      .from('turmas')
      .select('*')
      .order('oficina', { ascending: true })

    if (error) {
      console.error('Erro ao buscar turmas:', error)
      return
    }
    setTurmas(data || [])
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }))
  }

  const formatarDias = (diasArray) => {
    if (!diasArray || diasArray.length === 0) return 'Nenhum dia selecionado'
    const dias = diasArray.map(d => NOMES_DIAS_SEMANA[d] || d)
    // Agrupa os dias em uma string legível
    if (dias.length === 1) return dias[0]
    return dias.join(', ')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMensagem(null)

    if (!formData.nome.trim()) {
      setMensagem({ tipo: 'erro', texto: 'Nome é obrigatório!' })
      setLoading(false)
      return
    }

    try {
      let turmaSelecionada = null
      if (formData.matricular_agora && formData.curso && formData.horario) {
        turmaSelecionada = turmas.find(t => 
          t.unidade === formData.unidade && 
          t.oficina && 
          t.oficina.split('(')[0].trim() === formData.curso && 
          t.horario === formData.horario
        )
      }

      const alunoData = {
        nome: formData.nome.toUpperCase().trim(),
        nome_social: formData.nome_social.toUpperCase().trim(),
        cpf: formData.cpf,
        data_nascimento: formData.data_nascimento,
        telefone: formData.telefone,
        whatsapp: formData.whatsapp,
        email: formData.email,
        unidade: formData.unidade,
        curso: formData.curso || null,
        horario: formData.horario || null,
        escola: formData.escola.toUpperCase().trim(),
        nis: formData.nis,
        endereco_rua: formData.endereco_rua.toUpperCase().trim(),
        endereco_numero: formData.endereco_numero,
        endereco_bairro: formData.endereco_bairro.toUpperCase().trim(),
        endereco_cidade: formData.endereco_cidade.toUpperCase().trim(),
        responsavel_nome: formData.responsavel_nome.toUpperCase().trim(),
        responsavel_cpf: formData.responsavel_cpf,
        responsavel_telefone: formData.responsavel_telefone,
        responsavel_profissao: formData.responsavel_profissao.toUpperCase().trim(),
        alergias: formData.alergias,
        alergias_quais: formData.alergias_quais.toUpperCase().trim(),
        problemas_saude: formData.problemas_saude,
        problemas_saude_quais: formData.problemas_saude_quais.toUpperCase().trim(),
        tipo_sanguineo: formData.tipo_sanguineo.toUpperCase().trim(),
        sus_numero: formData.sus_numero,
        turma_id: turmaSelecionada?.id || null,
        posicao: 0,
      }

      const { data: alunoInsert, error: alunoError } = await supabase
        .from('alunos')
        .insert([alunoData])
        .select()

      if (alunoError) throw alunoError

      const alunoId = alunoInsert[0].id

      if (turmaSelecionada && formData.matricular_agora) {
        const { data: alunosNaTurma } = await supabase
          .from('alunos')
          .select('posicao')
          .eq('turma_id', turmaSelecionada.id)
          .order('posicao', { ascending: true })

        const ultimaPosicao = alunosNaTurma?.length || 0

        await supabase
          .from('alunos')
          .update({ posicao: ultimaPosicao + 1 })
          .eq('id', alunoId)

        await supabase
          .from('matriculas')
          .insert([{
            aluno_id: alunoId,
            turma_id: turmaSelecionada.id,
            unidade: formData.unidade,
            data_matricula: new Date().toISOString().split('T')[0],
            status: 'cursando',
          }])

        setMensagem({ 
          tipo: 'ok', 
          texto: `✅ Aluno "${formData.nome}" cadastrado e matriculado em "${turmaSelecionada.oficina}" (${turmaSelecionada.horario})!` 
        })

        setTimeout(() => {
          router.push(`/chamada/${turmaSelecionada.id}`)
        }, 2000)
      } else {
        setMensagem({ 
          tipo: 'ok', 
          texto: `✅ Aluno "${formData.nome}" cadastrado com sucesso!` 
        })
        setTimeout(() => {
          router.push(`/alunos`)
        }, 2000)
      }

    } catch (error) {
      console.error('Erro ao cadastrar:', error)
      setMensagem({ tipo: 'erro', texto: '❌ Erro ao cadastrar aluno!' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8">
      <div className="max-w-4xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/alunos" className="text-xs border-2 border-black px-4 py-2 font-black italic uppercase bg-white hover:bg-black hover:text-white transition-all">
            ← VOLTAR
          </Link>
          <h1 className="text-3xl font-black border-l-8 border-black pl-4">
            NOVO <span className="text-blue-600">ALUNO</span>
          </h1>
        </div>

        {mensagem && (
          <div className={`mb-6 px-4 py-3 border-4 border-black font-bold text-sm ${
            mensagem.tipo === 'ok' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {mensagem.texto}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white border-4 border-black p-6 shadow-[4px_4px_0px_#000]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dados Pessoais */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-black uppercase border-b-2 border-black pb-2 mb-4">📋 Dados Pessoais</h3>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-black uppercase mb-1">Nome completo *</label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                className="w-full border-2 border-black px-3 py-2 text-sm font-bold uppercase outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase mb-1">CPF</label>
              <input
                type="text"
                name="cpf"
                value={formData.cpf}
                onChange={handleChange}
                placeholder="000.000.000-00"
                className="w-full border-2 border-black px-3 py-2 text-sm font-bold outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase mb-1">Data de nascimento</label>
              <input
                type="date"
                name="data_nascimento"
                value={formData.data_nascimento}
                onChange={handleChange}
                className="w-full border-2 border-black px-3 py-2 text-sm font-bold outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase mb-1">Telefone</label>
              <input
                type="text"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                placeholder="(73) 99999-9999"
                className="w-full border-2 border-black px-3 py-2 text-sm font-bold outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase mb-1">WhatsApp</label>
              <input
                type="text"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleChange}
                placeholder="(73) 99999-9999"
                className="w-full border-2 border-black px-3 py-2 text-sm font-bold outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border-2 border-black px-3 py-2 text-sm font-bold outline-none"
              />
            </div>

            {/* Matrícula */}
            <div className="md:col-span-2 mt-4">
              <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-4">
                <h3 className="text-lg font-black uppercase">🎵 Matrícula</h3>
                <label className="flex items-center gap-2 text-sm font-black">
                  <input
                    type="checkbox"
                    name="matricular_agora"
                    checked={formData.matricular_agora}
                    onChange={handleChange}
                    className="w-4 h-4 border-2 border-black"
                  />
                  Matricular agora
                </label>
              </div>
            </div>

            {formData.matricular_agora && (
              <>
                <div>
                  <label className="block text-[10px] font-black uppercase mb-1">Casa *</label>
                  <select
                    name="unidade"
                    value={formData.unidade}
                    onChange={handleChange}
                    className="w-full border-2 border-black px-3 py-2 text-sm font-bold outline-none"
                    required={formData.matricular_agora}
                  >
                    {UNIDADES.map((u) => (
                      <option key={u.id} value={u.id}>{u.nome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase mb-1">Curso *</label>
                  <select
                    name="curso"
                    value={formData.curso}
                    onChange={handleChange}
                    className="w-full border-2 border-black px-3 py-2 text-sm font-bold outline-none"
                    required={formData.matricular_agora}
                  >
                    <option value="">Selecione um curso</option>
                    {cursosFiltrados.map((curso) => (
                      <option key={curso} value={curso}>{curso}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase mb-1">Horário *</label>
                  <select
                    name="horario"
                    value={formData.horario}
                    onChange={handleChange}
                    className="w-full border-2 border-black px-3 py-2 text-sm font-bold outline-none"
                    required={formData.matricular_agora}
                  >
                    <option value="">Selecione um horário</option>
                    {horariosFiltrados.map((horario) => (
                      <option key={horario} value={horario}>{horario}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black uppercase mb-1">📅 Dias da semana</label>
                  <div className="w-full border-2 border-black px-3 py-2 text-sm font-bold bg-gray-50">
                    {diasDaTurma.length > 0 ? formatarDias(diasDaTurma) : 'Selecione um curso e horário'}
                  </div>
                </div>

                <div className="md:col-span-2 text-xs text-gray-500">
                  ⚡ Ao marcar "Matricular agora", o aluno será vinculado à turma selecionada.
                </div>
              </>
            )}

            {/* Escola e NIS */}
            <div>
              <label className="block text-[10px] font-black uppercase mb-1">Escola</label>
              <input
                type="text"
                name="escola"
                value={formData.escola}
                onChange={handleChange}
                className="w-full border-2 border-black px-3 py-2 text-sm font-bold uppercase outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase mb-1">NIS</label>
              <input
                type="text"
                name="nis"
                value={formData.nis}
                onChange={handleChange}
                className="w-full border-2 border-black px-3 py-2 text-sm font-bold outline-none"
              />
            </div>

            {/* Endereço */}
            <div className="md:col-span-2 mt-4">
              <h3 className="text-lg font-black uppercase border-b-2 border-black pb-2 mb-4">📍 Endereço</h3>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-black uppercase mb-1">Rua</label>
              <input
                type="text"
                name="endereco_rua"
                value={formData.endereco_rua}
                onChange={handleChange}
                className="w-full border-2 border-black px-3 py-2 text-sm font-bold uppercase outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase mb-1">Número</label>
              <input
                type="text"
                name="endereco_numero"
                value={formData.endereco_numero}
                onChange={handleChange}
                className="w-full border-2 border-black px-3 py-2 text-sm font-bold outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase mb-1">Bairro</label>
              <input
                type="text"
                name="endereco_bairro"
                value={formData.endereco_bairro}
                onChange={handleChange}
                className="w-full border-2 border-black px-3 py-2 text-sm font-bold uppercase outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-black uppercase mb-1">Cidade</label>
              <input
                type="text"
                name="endereco_cidade"
                value={formData.endereco_cidade}
                onChange={handleChange}
                className="w-full border-2 border-black px-3 py-2 text-sm font-bold uppercase outline-none"
              />
            </div>

            {/* Responsável */}
            <div className="md:col-span-2 mt-4">
              <h3 className="text-lg font-black uppercase border-b-2 border-black pb-2 mb-4">👨‍👩‍👧 Responsável</h3>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-black uppercase mb-1">Nome do responsável</label>
              <input
                type="text"
                name="responsavel_nome"
                value={formData.responsavel_nome}
                onChange={handleChange}
                className="w-full border-2 border-black px-3 py-2 text-sm font-bold uppercase outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase mb-1">CPF do responsável</label>
              <input
                type="text"
                name="responsavel_cpf"
                value={formData.responsavel_cpf}
                onChange={handleChange}
                className="w-full border-2 border-black px-3 py-2 text-sm font-bold outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase mb-1">Telefone do responsável</label>
              <input
                type="text"
                name="responsavel_telefone"
                value={formData.responsavel_telefone}
                onChange={handleChange}
                className="w-full border-2 border-black px-3 py-2 text-sm font-bold outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-black uppercase mb-1">Profissão</label>
              <input
                type="text"
                name="responsavel_profissao"
                value={formData.responsavel_profissao}
                onChange={handleChange}
                className="w-full border-2 border-black px-3 py-2 text-sm font-bold uppercase outline-none"
              />
            </div>

            {/* Saúde */}
            <div className="md:col-span-2 mt-4">
              <h3 className="text-lg font-black uppercase border-b-2 border-black pb-2 mb-4">🏥 Saúde</h3>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase mb-1">Possui alergias?</label>
              <select
                name="alergias"
                value={formData.alergias}
                onChange={handleChange}
                className="w-full border-2 border-black px-3 py-2 text-sm font-bold outline-none"
              >
                <option value="">Selecione</option>
                <option value="SIM">Sim</option>
                <option value="NAO">Não</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase mb-1">Qual(is)?</label>
              <input
                type="text"
                name="alergias_quais"
                value={formData.alergias_quais}
                onChange={handleChange}
                className="w-full border-2 border-black px-3 py-2 text-sm font-bold uppercase outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase mb-1">Problemas de saúde?</label>
              <select
                name="problemas_saude"
                value={formData.problemas_saude}
                onChange={handleChange}
                className="w-full border-2 border-black px-3 py-2 text-sm font-bold outline-none"
              >
                <option value="">Selecione</option>
                <option value="SIM">Sim</option>
                <option value="NAO">Não</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase mb-1">Qual(is)?</label>
              <input
                type="text"
                name="problemas_saude_quais"
                value={formData.problemas_saude_quais}
                onChange={handleChange}
                className="w-full border-2 border-black px-3 py-2 text-sm font-bold uppercase outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase mb-1">Tipo sanguíneo</label>
              <input
                type="text"
                name="tipo_sanguineo"
                value={formData.tipo_sanguineo}
                onChange={handleChange}
                className="w-full border-2 border-black px-3 py-2 text-sm font-bold uppercase outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase mb-1">Nº do SUS</label>
              <input
                type="text"
                name="sus_numero"
                value={formData.sus_numero}
                onChange={handleChange}
                className="w-full border-2 border-black px-3 py-2 text-sm font-bold outline-none"
              />
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-4 mt-6">
            <button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 text-white px-6 py-3 font-black uppercase italic text-sm border-4 border-black shadow-[4px_4px_0px_#000] hover:bg-emerald-500 transition-all disabled:opacity-50"
            >
              {loading ? 'Salvando...' : '💾 CADASTRAR ALUNO'}
            </button>
            <Link
              href="/alunos"
              className="bg-gray-200 px-6 py-3 font-black uppercase italic text-sm border-4 border-black hover:bg-gray-300 transition-all text-center"
            >
              CANCELAR
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
