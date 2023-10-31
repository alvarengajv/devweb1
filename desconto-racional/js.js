// Constantes
const NUMERO_DE_REPETICOES = 96;

// Função para calcular a tabela de amortização
function calcularTabelaAmortizacao(valorFinanciado, t, p) {
    const tabela = [];

    let saldoDevedor = valorFinanciado;
    for (let mes = 1; mes <= NUMERO_DE_REPETICOES; mes++) {
        const juros = saldoDevedor * t;
        const amortizacao = Calcular_PrestacaoMensal(valorFinanciado, t, p) - juros;

        tabela.push({
            mes,
            prestacao: Calcular_PrestacaoMensal(valorFinanciado, t, p),
            juros,
            amortizacao,
            saldoDevedor
        });

        saldoDevedor -= amortizacao;
    }

    return tabela;
}

// Função para preencher a tabela HTML
function preencherTabela(tabela) {
    const tabelaBody = document.getElementById("tabelaBody");

    let prestacaoTotal = 0;
    let jurosTotal = 0;
    let amortizacaoTotal = 0;
    let saldoDevedorTotal = 0;

    for (const item of tabela) {
        prestacaoTotal += item.prestacao;
        jurosTotal += item.juros;
        amortizacaoTotal += item.amortizacao;
        saldoDevedorTotal += item.saldoDevedor;

        const linha = document.createElement("tr");
        linha.innerHTML = `
            <td>${item.mes}</td>
            <td>${item.prestacao.toFixed(2)}</td>
            <td>${item.juros.toFixed(2)}</td>
            <td>${item.amortizacao.toFixed(2)}</td>
            <td>${item.saldoDevedor.toFixed(2)}</td>
        `;
        tabelaBody.appendChild(linha);
    }

    const linhaTotal = document.createElement("tr");
    linhaTotal.innerHTML = `
        <th>Total</th>
        <th>${prestacaoTotal.toFixed(2)}</th>
        <th>${jurosTotal.toFixed(2)}</th>
        <th>${amortizacaoTotal.toFixed(2)}</th>
        <th>${saldoDevedorTotal.toFixed(2)}</th>
    `;
    tabelaBody.appendChild(linhaTotal);
}

document.getElementById("submitButton").onclick = function (e) {
    e.preventDefault();

    // Obtenha os valores de entrada do usuário aqui

    // Calcule a tabela de amortização
    const tabelaAmortizacao = calcularTabelaAmortizacao(valorFinanciado, t, p);

    // Preencha a tabela HTML
    preencherTabela(tabelaAmortizacao);

    // Exiba outros resultados na parte superior da página
};
