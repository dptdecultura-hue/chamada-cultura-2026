// src/app/(dashboard)/notificacoes/page.js
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Loading from '@/components/ui/Loading'

export default function Notificacoes() {
  const [loading, setLoading] = useState(true)
  const [alunosRisco, setAlunosRisco] = useState([])
  const [historico, setHistorico] = useState([])
  const [config, setConfig] = useState({ limite_faltas: 3, ativo: true })
  const [mensagem, setMensagem] = useState(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    fetchData()
    fetchHistorico()
    fetchConfig()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const { data: alunosData } = await supabase.from('alunos').select('id, nome, whatsapp, turma_id, telefone').not('turma_id', 'is', null)
      const { data: turmasData } = await supabase.from('turmas').select('id, oficina, horario, professor')
      const { data: frequenciasData } = await supabase.from('frequencia').select('aluno_id, status, data_aula').gte('data_aula', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])

      const alunosAnalisados = alunosData?.map(aluno => {
        const freqAluno = frequenciasData?.filter(f => f.aluno_id === aluno.id) || []
        const ultimasAulas = freqAluno.sort((a, b) => new Date(b.data_aula) - new Date(a.data_aula)).slice(0, 5)
        const faltasConsecutivas = ultimasAulas.filter(f => f.status === 'F').length
        const totalFaltas = freqAluno.filter(f => f.status === 'F').length
        const turma = turmasData?.find(t => t.id === aluno.turma_id)
        return { ...aluno, turma, faltasConsecutivas, totalFaltas, emRisco: faltasConsecutivas >= config.limite_faltas }
      }) || []

      setAlunosRisco(alunosAnalisados.filter(a => a.emRisco))
    } catch (error) { console.error('Erro ao carregar dados:', error) } finally { setLoading(false) }
  }

  async function fetchHistorico() {
    const { data } = await supabase.from('historico_notificacoes').select('*, alunos(nome)').order('created_at', { ascending: false }).limit(50)
    setHistorico(data || [])
  }

  async function fetchConfig() {
    const { data } = await supabase.from('config_notificacoes').select('*').single()
    if (data) setConfig(data)
  }

  async function enviarNotificacao(aluno) {
    if (!aluno.whatsapp && !aluno.telefone) {
      setMensagem({ tipo: 'erro', texto: '❌ Aluno não tem WhatsApp ou telefone cadastrado!' })
      return
    }
    setEnviando(true)
    const numero = aluno.whatsapp || aluno.telefone
    const mensagemTexto = `📢 *CASA DA CULTURA* - Alerta de Frequência\n\nOlá! O(A) aluno(a) *${aluno.nome}* está com ${aluno.faltasConsecutivas} faltas consecutivas na turma de *${aluno.turma?.oficina}* (${aluno.turma?.horario}).\n\nTotal de faltas no mês: ${aluno.totalFaltas}\n\nPor favor, entre em contato com a coordenação para justificar as ausências.\n📞 (73) 99999-9999`

    try {
      console.log(`📤 Enviando para ${numero}:`, mensagemTexto)
      await supabase.from('historico_notificacoes').insert([{ aluno_id: aluno.id, turma_id: aluno.turma_id, tipo: 'faltas', mensagem: mensagemTexto, destinatario: numero, status: 'enviado' }])
      setMensagem({ tipo: 'ok', texto: `✅ Notificação enviada para ${aluno.nome}!` })
      fetchHistorico()
      fetchData()
    } catch (error) {
      console.error('Erro ao enviar:', error)
      setMensagem({ tipo: 'erro', texto: '❌ Erro ao enviar notificação!' })
    } finally { setEnviando(false) }
  }

  async function enviarEmMassa() {
    if (!confirm(`Enviar notificações para ${alunosRisco.length} alunos em risco?`)) return
    setEnviando(true)
    let enviados = 0, erros = 0
    for (const aluno of alunosRisco) {
      try { await enviarNotificacao(aluno); enviados++ } catch { erros++ }
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    setMensagem({ tipo: 'ok', texto: `✅ Enviados: ${enviados} | ❌ Erros: ${erros}` })
    setEnviando(false)
  }

  if (loading) {
    return <Loading mensagem="Carregando notificações..." />
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/menu" className="text-xs border-2 border-black px-4 py-2 font-black italic uppercase bg-white hover:bg-black hover:text-white transition-all">← VOLTAR</Link>
            <h1 className="text-3xl font-black border-l-8 border-black pl-4">📱 NOTIFICAÇÕES <span className="text-blue-600">WHATSAPP</span></h1>
          </div>
          {alunosRisco.length > 0 && <button onClick={enviarEmMassa} disabled={enviando} className="bg-green-600 text-white px-6 py-2 font-black uppercase text-sm border-2 border-black shadow-[4px_4px_0px_#000] hover:bg-green-500 transition-all disabled:opacity-50">{enviando ? 'Enviando...' : `📤 ENVIAR PARA ${alunosRisco.length}`}</button>}
        </div>

        <div className="bg-white border-4 border-black p-4 mb-6 shadow-[4px_4px_0px_#000]">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-[10px] font-black uppercase">Limite de faltas:</span>
            <input type="number" value={config.limite_faltas} onChange={e => setConfig({...config, limite_faltas: parseInt(e.target.value)})} className="w-16 border-2 border-black px-2 py-1 text-sm font-bold text-center outline-none" min="1" max="10" />
            <button onClick={async () => { await supabase.from('config_notificacoes').upsert({ id: config.id, limite_faltas: config.limite_faltas, ativo: true }); setMensagem({ tipo: 'ok', texto: '✅ Configuração salva!' }); setTimeout(() => setMensagem(null), 3000) }} className="bg-blue-600 text-white px-4 py-1 text-xs font-black border-2 border-black hover:bg-blue-500 transition-all">SALVAR CONFIG</button>
            <span className="text-xs text-gray-500 ml-4">⚡ Alunos com {config.limite_faltas}+ faltas consecutivas recebem alerta</span>
          </div>
        </div>

        {mensagem && <div className={`mb-6 px-4 py-3 border-4 border-black font-bold text-sm ${mensagem.tipo === 'ok' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{mensagem.texto}</div>}

        <div className="bg-white border-4 border-black shadow-[4px_4px_0px_#000] mb-8 overflow-hidden">
          <div className="p-4 border-b-2 border-black bg-red-50"><h2 className="font-black text-lg">⚠️ Alunos em Risco de Evasão</h2><p className="text-sm text-gray-600">{alunosRisco.length} alunos precisam de atenção</p></div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead><tr className="bg-gray-100 border-b-2 border-black"><th className="px-4 py-2 text-left font-black">Aluno</th><th className="px-4 py-2 text-left font-black">Turma</th><th className="px-4 py-2 text-center font-black">Faltas Consec.</th><th className="px-4 py-2 text-center font-black">Total Faltas</th><th className="px-4 py-2 text-center font-black">WhatsApp</th><th className="px-4 py-2 text-center font-black">Ação</th></tr></thead>
              <tbody>
                {alunosRisco.map((aluno) => (
                  <tr key={aluno.id} className="border-b border-black hover:bg-gray-50">
                    <td className="px-4 py-2 font-bold uppercase">{aluno.nome}</td>
                    <td className="px-4 py-2">{aluno.turma?.oficina}<span className="block text-[10px] text-gray-400">{aluno.turma?.horario} - {aluno.turma?.professor}</span></td>
                    <td className="px-4 py-2 text-center font-bold text-red-600">{aluno.faltasConsecutivas}</td>
                    <td className="px-4 py-2 text-center font-bold">{aluno.totalFaltas}</td>
                    <td className="px-4 py-2 text-center">{aluno.whatsapp || aluno.telefone || 'N/A'}</td>
                    <td className="px-4 py-2 text-center"><button onClick={() => enviarNotificacao(aluno)} disabled={enviando} className="bg-green-500 text-white px-3 py-1 text-xs font-black border border-black hover:bg-green-600 transition-all disabled:opacity-50">💬 ALERTAR</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {alunosRisco.length === 0 && <div className="p-8 text-center"><p className="text-xl font-black text-green-600">✅ Nenhum aluno em risco!</p><p className="text-sm text-gray-400 mt-2">Todos os alunos estão com frequência regular</p></div>}
        </div>

        <div className="bg-white border-4 border-black shadow-[4px_4px_0px_#000] overflow-hidden">
          <div className="p-4 border-b-2 border-black bg-gray-50"><h2 className="font-black text-lg">📋 Histórico de Notificações</h2></div>
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full border-collapse text-sm">
              <thead><tr className="bg-gray-100 border-b-2 border-black sticky top-0"><th className="px-4 py-2 text-left font-black">Data</th><th className="px-4 py-2 text-left font-black">Aluno</th><th className="px-4 py-2 text-left font-black">Mensagem</th><th className="px-4 py-2 text-center font-black">Status</th></tr></thead>
              <tbody>
                {historico.map((item) => (
                  <tr key={item.id} className="border-b border-black hover:bg-gray-50">
                    <td className="px-4 py-2 text-xs">{new Date(item.created_at).toLocaleDateString('pt-BR')}<span className="block text-[10px] text-gray-400">{new Date(item.created_at).toLocaleTimeString('pt-BR')}</span></td>
                    <td className="px-4 py-2 font-bold uppercase">{item.alunos?.nome || 'N/A'}</td>
                    <td className="px-4 py-2 text-xs truncate max-w-xs">{item.mensagem?.split('\n')[0]}</td>
                    <td className="px-4 py-2 text-center"><span className={`px-2 py-1 text-xs font-black border border-black ${item.status === 'enviado' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.status === 'enviado' ? '✅ ENVIADO' : '❌ ERRO'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
