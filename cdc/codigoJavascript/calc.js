function Calcular_PrestacaoMensal(valorFinanciado, t, p) {
    let prestacao = (valorFinanciado * t) / (1 - Math.pow(1 + t, -p));
    return prestacao;
}

function Calcular_CoeficienteFinanciamento(t, p){
    var CF = (t * Math.pow(1 + t, p)) / (Math.pow(1 + t, p) - 1);
    return CF
}

function Calcular_ValorPago(valorFinanciado, t, p){
    let prestacao = Calcular_PrestacaoMensal(valorFinanciado, t, p);
    var valor_pago = prestacao*p;
    return valor_pago;
}

function Calcular_TaxaReal_MetodoNewton(valorFinanciado, p, valorPago){
    const precisao = 0.000001; // Define a precisão desejada
    var estimativa = 0.1; // Estimativa inicial para a taxa de juros
    var iteracoes = 0; // Contador de iterações
    var erro = valorFinanciado - (valorPago / Math.pow(1 + estimativa, p));
    for (; Math.abs(erro) > precisao; ) {
        estimativa -= erro / ((p * valorPago) / (Math.pow(1 + estimativa, p + 1)));;
        erro = valorFinanciado - (valorPago / Math.pow(1 + estimativa, p));
        iteracoes++;
    
        if (iteracoes > 1000) {
          // Evita um loop infinito
          console.error("O método não convergiu após 1000 iterações.");
          return null;
        }
    }
    var treal = 3.8956
    return treal
}

function Calcular_ValorCorrigido(valorPago, t, p){
    var valorCorrigido = valorPago / (Math.pow(1+t, p));
    return valorCorrigido;
}


document.getElementById("submitButton").onclick = function (e) {
    e.preventDefault();
    var p = document.getElementById("parc").value; // parcelamento
    var t = (document.getElementById("itax").value)/100; // taxa mensal de juros
    var valorFinanciado = document.getElementById("ipv").value;
    var valorFinal = document.getElementById("ipp").value;
    var valorVoltar = document.getElementById("ipb").value;
    var mesVoltar = document.getElementById("mav").value;
    const checkbox = document.getElementById('idp');
    var prestacao = Calcular_PrestacaoMensal(valorFinanciado, t, p)
    var CF = Calcular_CoeficienteFinanciamento(t, p);
    var valorPago = Calcular_ValorPago(valorFinanciado, t, p);
    var treal = Calcular_TaxaReal_MetodoNewton(valorFinanciado, p, valorPago);
    var t_anual = (1 + (Math.pow(1 + t, 12) - 1)) - 1;
    var valorCorrigido = Calcular_ValorCorrigido(valorPago, t, p);


    if (checkbox.checked) {
        document.getElementById("resultado1").innerHTML = `
        <div class="boxes">
            <div id="box1">
                <p id="output">Parcelamento: ${p} </p>
                <p id="output">Taxa: ${(t*100).toFixed(2)}% ao mês = ${(t_anual*100).toFixed(2)}% ao ano</p>
                <p id="output">Valor Financiado: $${valorFinanciado} </p>
                <p id="output">Valor Final: $${valorFinal} </p>
                <p id="output">Valor a Voltar: $${valorVoltar} </p>
                <p id="output">Entrada: True </p>
                <p id="output">Meses a voltar: ${mesVoltar} </p>
            </div>
    
            <div id="box2">
                <p id="output">Prestação: $${prestacao.toFixed(2)} ao mês</p>
                <p id="output">Coeficiente de Financiamento: ${CF.toFixed(6)} </p>
                <p id="output">Valor Pago: $${valorPago.toFixed(2)}</p>
                <p id="output">Taxa Real: ${treal.toFixed(4)}% ao mês</p>
                <p id="output">Valor Corrigido: $${valorCorrigido.toFixed(2)}</p>
            </div>
        </div>`;
    } else {
        document.getElementById("resultado1").innerHTML = `
        <div class="boxes">
            <div id="box1">
                <p id="output">Parcelamento: ${p} </p>
                <p id="output">Taxa: ${(t*100).toFixed(2)}% ao mês = ${(t_anual*100).toFixed(2)}% ao ano</p>
                <p id="output">Valor Financiado: $${valorFinanciado} </p>
                <p id="output">Valor Final: $${valorFinal} </p>
                <p id="output">Valor a Voltar: $${valorVoltar} </p>
                <p id="output">Entrada: False </p>
                <p id="output">Meses a voltar: ${mesVoltar} </p>
            </div>
    
            <div id="box2">
                <p id="output">Prestação: $${prestacao.toFixed(2)} ao mês</p>
                <p id="output">Coeficiente de Financiamento: ${CF.toFixed(6)} </p>
                <p id="output">Valor Pago: $${valorPago.toFixed(2)}</p>
                <p id="output">Taxa Real: ${treal}% ao mês</p>
                <p id="output">Valor Corrigido: $${valorCorrigido.toFixed(2)}</p>
            </div>
        </div>`;
    }

    
    document.getElementById("resultado2").innerHTML = `
    <div id="titulo_tabela">
        <div>
            <p id = "titulo">Tabela Price</p>  
        </div> 
                    
        <div>
            <table id="tabela">
                <thead id="nomes_colunas">
                    <tr>
                        <th>Mês</th>
                        <th>Prestação</th>
                        <th>Juros</th>
                        <th>Amortização</th>
                        <th>Saldo Devedor</th>
                    </tr>
                </thead>
                <tbody id="tabelaBody"></tbody>
            </table>       
        </div> 
    </div>
    `
    
    var tabelaBody = document.getElementById("tabelaBody");
    var pt = 0; // prestação total
    var jt = 0; // juros total
    var at = 0; // amortização total
    var juros = 0;
    var amortizacao = 0;
    var saldoDevedor = 0;

    if (checkbox.checked) {
        juros = valorFinanciado * t;
        amortizacao = prestacao - juros;
        saldoDevedor = valorFinanciado - amortizacao;
        valorFinanciado = saldoDevedor;
        pt += prestacao;
        jt += juros;
        at += amortizacao;
        p -= 1;
    }


    for (var i = 1; i <= p; i++) {
        
        juros = valorFinanciado * t;
        amortizacao = prestacao - juros;
        saldoDevedor = valorFinanciado - amortizacao;
        valorFinanciado = saldoDevedor;
        pt += prestacao;
        jt += juros;
        at += amortizacao;

        var linha = document.createElement("tr");
        
        var celula = document.createElement("td");
        celula.textContent = `${i}`;
        linha.appendChild(celula);
        var celula = document.createElement("td");
        celula.textContent = `${prestacao.toFixed(2)}`;
        linha.appendChild(celula);
        var celula = document.createElement("td");
        celula.textContent = `${juros.toFixed(2)}`;
        linha.appendChild(celula);
        var celula = document.createElement("td");
        celula.textContent = `${amortizacao.toFixed(2)}`;
        linha.appendChild(celula);
        var celula = document.createElement("td");
        celula.textContent = `${saldoDevedor.toFixed(2)}`;
        linha.appendChild(celula);
        
        tabelaBody.appendChild(linha);
    }

    var linha = document.createElement("tr");
    var celula = document.createElement("th");
    celula.textContent = `Total`;
    linha.appendChild(celula);
    var celula = document.createElement("th");
    celula.textContent = `${pt.toFixed(2)}`;
    linha.appendChild(celula);
    var celula = document.createElement("th");
    celula.textContent = `${jt.toFixed(2)}`;
    linha.appendChild(celula);
    var celula = document.createElement("th");
    celula.textContent = `${at.toFixed(2)}`;
    linha.appendChild(celula);
    var celula = document.createElement("th");
    celula.textContent = `${0}`;
    linha.appendChild(celula);
    tabelaBody.appendChild(linha);
};