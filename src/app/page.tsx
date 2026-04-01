'use client'
import { useState } from 'react'

export default function SistemaChamada() {
  const [tela, setTela] = useState('inicio')

  return (
    <div style={{ padding: 20 }}>
      
      {/* MENU SIMPLES */}
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setTela('inicio')}>Início</button>
        <button onClick={() => setTela('chamada')} style={{ marginLeft: 10 }}>
          Chamada
        </button>
      </div>

      {/* TELA INICIAL */}
      {tela === 'inicio' && (
        <div>
          <h2>Bem-vindo ao Sistema</h2>
          <p>Selecione a opção de chamada para visualizar.</p>
        </div>
      )}

      {/* 🔥 NOVA CHAMADA (SUBSTITUÍDA PELA IMAGEM) */}
      {tela === 'chamada' && (
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%"
        }}>
          <img 
            src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA6wAAAI2CAIAAADb05KCAAAQAElEQVR4AexdB3wURRffcj13ufTeK4GE3nvvIEgXEKyIfnYURBRFmgJWBEFAQAQB6b333tJDeu/JpVwvu/u9vbtcLskFgoJS5n7v5mbfvPfmzX93Z/83u7kQDHohBBACCAGEAEIAIYAQQAggBJ4xBAgMvRACCAGEwDOHABowQgAhgBBACDzrCNSSYIPBcPfu3VL0QgggBBACCAGEAEIAIYAQeAoReEaHlJqaqlKpGlL+WhKclZXVHL0QAggBhABCACGAEEAIIAQQAk8XAlu2bLkXCXY0vp7R7who2AiBpx4BNECEAEIAIYAQQAg8kwh07NixRYsW9yLBDduQBiGAEEAIIAQQAggBhMATjABKHSHQOAK1j0M0boNaEAIIAYQAQgAhgBBACCAEEAJPFQKIBD9VuxMNxhoBVEcIIAQQAggBhABCACHQGAKIBDeGDNIjBBACCAGEAELgyUMAZYwQQAgg0EQFEgpsIFDJDCCAEEAIIAYQAQgAhgBB4ehBAJPjp2ZcYhsaCEEAIIAQQAggBhABCACHQJAQQCW4STMgIIYAQQAggBB5XBFBeCAGEAELg7yCASPDfQQ35IAQQAggBhABCACGAEEAIPNEIPOEk+InGHiWPEEAIIAQQAggBhABCACHwHyGASPB/BDzqFiGAEEAI/G0EkCNCACGAEEAI/GMEEAn+xxCiAAgBhABCACGAEEAIIAQQAo8agYcdH5Hgh40oiocQQAggBBACCAGEAEIAIfDYI4BI8GO/i1CCCAGEAIYhDBACCAGEAEIAIfBwEUAk+OHiiaIhBBACCAGEAEIAIYAQeDgIoCiPFAFEgh8pvCg4QgAhgBBACCAEEAIIAYTA44gAIsGP415BOSEEMAxhgBBACPw3CDB6vT4xreDj5Ze6TjjYYtCx1sOSX/xIdfwKLVf9NwmhXhECCIFHgwAiwY8GVxQVIYAQQAggBJ5ABBiG0dxJVH65htx2PCSztINM37pY7Xjqjm7eSuWOY4xO/wSO6clKGWWLEPj3EEAk+N/DGvWEEEAIIAQQAo85AlR5hWrdLu3lGNpgoDHMJBRNa/OKtJv3axJSHvP8UXoIAYRA0xFAJLjpWCHLR4wACo8QQAggBP5rBPQp2czleMZgqJcIzTBYQRl9LZGhqHpNaBMhgBB4QhFAJPgJ3XEobYQAQgAhgBB4+AjQGh2mtf3MA0MZMJWGATb8cLtF0RACCIH/CAFEgv8j4FG3CAGEAEIAIfD4IUB6uBLebjhjIzNCJML93HACXTdtgINUCIEnEQF0Mv+Xew31jRBACCAEEAKPFQK8YB/uC0O57i44hgETNgnUSQ6X6NKK17ElIsGP1f5CySAE/gkCiAT/E/T+JV+4+5aUdHf79h27d++5ceOmQqHQ6XQXLlzYunXbnj37YmJilUqlVqs9d+78tm3bdu7cefnyZaVSVVVV/ccfW7dt+/Pw4cPFxcVgcOLECTDYsWPHxYsXVSpVRkbGvn37CwsLc3Jy9u/fD00Q8NSpMxUVlbGxsSdPnqqqqrpzJ+bUqdMQCtwhgT///PPYsWPZ2dlUzVNxmZmZMTExE"
            style={{
              maxWidth: "100%",
              height: "auto",
              boxShadow: "0 0 20px rgba(0,0,0,0.5)"
            }}
          />
        </div>
      )}
    </div>
  )
}

