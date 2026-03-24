// Substitua APENAS a parte visual da folha (o que fica dentro do "folha-container") por esta estrutura atualizada:

<div className="folha-container max-w-[1300px] mx-auto p-10 mt-4 border-4 border-black bg-white mb-10 shadow-2xl">
  
  {/* MODELO DE CABEÇALHO ATUALIZADO (IGUAL À FOTO DO PEDAGÓGICO) */}
  <div className="border-2 border-slate-400 mb-4 p-4 flex justify-between items-center font-sans">
    <div className="flex items-center gap-6">
      {/* Logos da Esquerda */}
      <div>
        <h2 className="text-xs font-black text-slate-700 tracking-tighter uppercase leading-none">Prefeitura de</h2>
        <h1 className="text-2xl font-black text-blue-900 tracking-tighter uppercase leading-none">Teixeira</h1>
        <h2 className="text-xs font-black text-slate-700 uppercase leading-none">de Freitas</h2>
      </div>
      <div className="h-12 w-[2px] bg-slate-300"></div>
      <div>
        <p className="text-[10px] font-bold text-slate-600 uppercase leading-tight">Secretaria de</p>
        <p className="text-xs font-black text-slate-800 uppercase leading-tight">Cultura e Turismo</p>
      </div>
    </div>

    <div className="flex items-center gap-2">
      {/* Logo Casa da Cultura da direita */}
      <div className="text-right">
        <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase leading-none">Casa da</h1>
        <h1 className="text-xl font-black text-blue-600 tracking-tight uppercase leading-none">Cultura</h1>
      </div>
    </div>
  </div>

  {/* TABELA DE INFORMAÇÕES DO PROFESSOR (O GRID AZUL CLARO DA FOTO) */}
  <div className="grid grid-cols-2 border-2 border-slate-400 bg-[#D9E2EC] font-sans mb-1 text-xs font-bold">
    <div className="p-2 border-r border-b border-slate-400">Oficineiro (a) / Professor (a): <span className="uppercase font-black text-slate-800">{curso?.professor}</span></div>
    <div className="p-2 border-b border-slate-400">Curso: <span className="uppercase font-black text-slate-800">{curso?.oficina}</span></div>
    <div className="p-2 border-r border-slate-400">Dias da Semana: <span className="uppercase font-black text-slate-800">{diasTexto}</span></div>
    <div className="p-2">Horário: <span className="uppercase font-black text-slate-800">{curso?.horario}</span></div>
  </div>

  {/* TABELA DE CHAMADA COM O MÊS CENTRALIZADO */}
  <table className="w-full border-collapse border-2 border-slate-400 font-sans text-xs font-bold uppercase">
    <thead>
      <tr className="bg-[#B0C4DE] text-center h-8">
        <th className="border border-slate-400 w-12" rowSpan={2}>Ordem</th>
        <th className="border border-slate-400 p-2 text-left min-w-[300px]" rowSpan={2}>Nomes</th>
        {/* Descobre o número de colunas de datas para expandir o cabeçalho do mês */}
        {(() => {
          const diasAlvo = String(curso?.dias).split('').map(Number);
          const datas = [];
          const ultimoDia = new Date(2026, mes + 1, 0).getDate();
          for (let d = 1; d <= ultimoDia; d++) {
            const dataProd = new Date(2026, mes, d);
            if (diasAlvo.includes(dataProd.getDay())) datas.push(d);
          }
          return <th className="border border-slate-400 h-6" colSpan={datas.length}>{mesesNomes[mes]}</th>;
        })()}
      </tr>
      <tr className="bg-[#D9E2EC] text-center h-8">
        {(() => {
          const diasAlvo = String(curso?.dias).split('').map(Number);
          const datas = [];
          const ultimoDia = new Date(2026, mes + 1, 0).getDate();
          for (let d = 1; d <= ultimoDia; d++) {
            const dataProd = new Date(2026, mes, d);
            if (diasAlvo.includes(dataProd.getDay())) datas.push(d < 10 ? `0${d}` : d);
          }
          return datas.map(dt => <th key={dt} className="border border-slate-400 w-12 text-[10px]">{dt}</th>);
        })()}
      </tr>
    </thead>
    <tbody>
      {alunosLocais.map((aluno, i) => {
        // ... (Manter exatamente o mesmo mapeamento de TRs e TDs do seu código anterior)
      })}
    </tbody>
  </table>
</div>

