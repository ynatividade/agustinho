let graficoCustos;

// Funções da Calculadora
function toggleInfo() {
  const infoBox = document.getElementById('infoBox');
  infoBox.style.display = infoBox.style.display === 'none' || infoBox.style.display === '' ? 'block' : 'none';
}

function toggleHistorico() {
  const box = document.getElementById('historicoBox');
  box.style.display = box.style.display === 'none' ? 'block' : 'none';
  if (box.style.display === 'block') carregarHistorico();
}

function carregarHistorico() {
  const historico = JSON.parse(localStorage.getItem('historicoCalculadora') || '[]');
  
  const html = historico.map(item => {
    if (!item) return '';
    
    const kmInicial = item.kmInicial !== undefined ? item.kmInicial : 0;
    const kmFinal = item.kmFinal !== undefined ? item.kmFinal : 0;
    const kmTrabalho = item.kmTrabalho !== undefined ? item.kmTrabalho.toFixed(1) : '0.0';
    const valorCorridas = item.valorCorridas !== undefined ? item.valorCorridas.toFixed(2) : '0.00';
    const lucroLiquido = item.lucroLiquido !== undefined ? item.lucroLiquido.toFixed(2) : '0.00';
    const custoPorKm = item.custoPorKm !== undefined ? item.custoPorKm.toFixed(2) : '0.00';
    const lucroPorKm = item.lucroPorKm !== undefined ? item.lucroPorKm.toFixed(2) : '0.00';
    const numeroCorridas = item.numeroCorridas !== undefined ? item.numeroCorridas : 0;

    return `
      <div class="historico-item">
        <small>${item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Data desconhecida'}</small>
        <div>KM: ${kmInicial} → ${kmFinal} (${kmTrabalho} trabalhados)</div>
        ${numeroCorridas > 0 ? `<div class="corridas-info">Corridas: ${numeroCorridas}</div>` : ''}
        <div class="kpi-box">
          <span class="kpi-label"></span> Custo/km: R$ ${custoPorKm} | Lucro/km: R$ ${lucroPorKm}
        </div>
        <div>Receita: R$ ${valorCorridas} | Lucro: R$ ${lucroLiquido}</div>
      </div>
      <hr>
    `;
  }).join('');
  
  document.getElementById('historicoLista').innerHTML = html || '<p>Nenhum registro encontrado</p>';
}

function limparHistorico() {
  if (confirm('Apagar todo o histórico de cálculos?')) {
    localStorage.removeItem('historicoCalculadora');
    carregarHistorico();
  }
}

function salvarCalculo(dados) {
  let historico = [];
  try {
    const historicoSalvo = localStorage.getItem('historicoCalculadora');
    historico = historicoSalvo ? JSON.parse(historicoSalvo) : [];
  } catch (e) {
    console.error('Erro ao ler histórico:', e);
    historico = [];
  }
  
  historico.unshift({
    kmInicial: dados.kmInicial || 0,
    kmFinal: dados.kmFinal || 0,
    kmTotal: dados.kmTotal || 0,
    kmTrabalho: dados.kmTrabalho || 0,
    valorCorridas: dados.valorCorridas || 0,
    custoTotal: dados.custoTotal || 0,
    lucroLiquido: dados.lucroLiquido || 0,
    custoPorKm: dados.custoPorKm || 0,
    lucroPorKm: dados.lucroPorKm || 0,
    numeroCorridas: dados.numeroCorridas || 0,
    timestamp: new Date().toISOString()
  });
  
  const historicoLimitado = historico.slice(0, 40);
  localStorage.setItem('historicoCalculadora', JSON.stringify(historicoLimitado));
}

function atualizarGrafico(dados) {
  const chartSection = document.getElementById('chartSection');
  chartSection.style.display = 'block';
  const ctx = document.getElementById('graficoCustos').getContext('2d');
  const labels = ['Combustível', 'Manutenção', 'Pneus', 'Óleo', 'Outros'];
  const valores = [
    dados.combustivel || 0,
    dados.manutencao || 0,
    dados.pneu || 0,
    dados.oleo || 0,
    dados.outros || 0
  ];

  if (graficoCustos) graficoCustos.destroy();

  graficoCustos = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: valores,
        backgroundColor: ['#4CAF50','#2196F3','#FFC107','#FF5722','#9C27B0','#607D8B']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
              const value = context.parsed;
              const percentage = ((value / total) * 100).toFixed(1);
              return `${context.label}: R$ ${value.toFixed(2)} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

function calcularLucro() {
  const kmInicial = parseFloat(document.getElementById('kmInicial').value) || 0;
  const kmFinal = parseFloat(document.getElementById('kmFinal').value) || 0;
  const kmPessoais = parseFloat(document.getElementById('kmPessoais').value) || 0;
  const valorCorridas = parseFloat(document.getElementById('valorCorridas').value) || 0;
  const consumoMedio = parseFloat(document.getElementById('consumoMedio').value) || 0;
  const precoCombustivel = parseFloat(document.getElementById('precoCombustivel').value) || 0;
  const outrosCustos = parseFloat(document.getElementById('outrosCustos').value) || 0;
  const numeroCorridas = parseInt(document.getElementById('numeroCorridas').value) || 0;

  if (kmFinal <= kmInicial) {
    alert('O km final deve ser maior que o km inicial!');
    return;
  }

  const kmTotal = kmFinal - kmInicial;
  const kmTrabalho = kmTotal - kmPessoais;
  const litrosGastos = kmTrabalho / consumoMedio;
  const custoCombustivel = litrosGastos * precoCombustivel;
  const custoManutencao = kmTrabalho * 0.05;
  const custoPneu = kmTrabalho * 0.05;
  const custoOleo = kmTrabalho * 0.05;
  const custoTotal = custoCombustivel + custoManutencao + custoPneu + custoOleo + outrosCustos;
  const lucroLiquido = valorCorridas - custoTotal;
  const ganhoPorKm = valorCorridas / kmTrabalho;
  const custoPorKm = custoTotal / kmTrabalho;
  const lucroPorKm = lucroLiquido / kmTrabalho;

  salvarCalculo({
    kmInicial,
    kmFinal,
    kmTotal,
    kmTrabalho,
    valorCorridas,
    custoTotal,
    lucroLiquido,
    custoPorKm,
    lucroPorKm,
    numeroCorridas
  });

  let porCorrida = '';
  if (numeroCorridas > 0) {
    const ganhoPorCorrida = valorCorridas / numeroCorridas;
    const custoPorCorrida = custoTotal / numeroCorridas;
    const lucroPorCorrida = lucroLiquido / numeroCorridas;
    porCorrida = `
      <div class="card">
        <h3>Por corrida</h3>
        <div class="result-item">Ganho médio: <span class="highlight">R$ ${ganhoPorCorrida.toFixed(2)}</span></div>
        <div class="result-item">Custo médio: <span class="highlight">R$ ${custoPorCorrida.toFixed(2)}</span></div>
        <div class="result-item">Lucro médio: <span class="highlight">R$ ${lucroPorCorrida.toFixed(2)}</span></div>
      </div>
    `;
  }

  const resultado = `
    <div class="card">
      <h3>Distâncias</h3>
      <div class="result-item">km totais: <span class="highlight">${kmTotal.toFixed(2)} km</span></div>
      <div class="result-item">km trabalhados: <span class="highlight">${kmTrabalho.toFixed(2)} km</span></div>
    </div>
    <div class="card">
      <h3>Combustível</h3>
      <div class="result-item">Litros consumidos: <span class="highlight">${litrosGastos.toFixed(2)} L</span></div>
      <div class="result-item">Custo: <span class="highlight">R$ ${custoCombustivel.toFixed(2)}</span></div>
    </div>
    <div class="card">
      <h3>Custos estimados</h3>
      <div class="result-item">Manutenção: <span class="highlight">R$ ${custoManutencao.toFixed(2)}</span></div>
      <div class="result-item">Pneus: <span class="highlight">R$ ${custoPneu.toFixed(2)}</span></div>
      <div class="result-item">Troca de óleo: <span class="highlight">R$ ${custoOleo.toFixed(2)}</span></div>
      <div class="result-item">Outros: <span class="highlight">R$ ${outrosCustos.toFixed(2)}</span></div>
    </div>
    <div class="card">
      <h3>Resumo</h3>
      <div class="result-item">Valor total recebido: <span class="highlight">R$ ${valorCorridas.toFixed(2)}</span></div>
      <div class="result-item">Custo total: <span class="highlight">R$ ${custoTotal.toFixed(2)}</span></div>
      <div class="result-item">Lucro líquido: <span class="highlight">R$ ${lucroLiquido.toFixed(2)}</span></div>
      <div class="result-item">Ganho por km: <span class="highlight">R$ ${ganhoPorKm.toFixed(2)}</span></div>
      <div class="result-item">Custo por km: <span class="highlight">R$ ${custoPorKm.toFixed(2)}</span></div>
      <div class="result-item">Lucro por km: <span class="highlight">R$ ${lucroPorKm.toFixed(2)}</span></div>
    </div>
    ${porCorrida}
  `;

  document.getElementById('resultado').innerHTML = resultado;

  atualizarGrafico({
    combustivel: custoCombustivel,
    manutencao: custoManutencao,
    pneu: custoPneu,
    oleo: custoOleo,
    outros: outrosCustos
  });
}

// Funções para a página de combustíveis
const API_URL = 'https://script.google.com/macros/s/AKfycbxSDlEGGsOr0ieUrE_kTruNwZOpXbeEW_fQEacXfqx8vLs1x2GhoLQjoYxAvlqoDxA3/exec';

async function carregarPostos() {
  try {
    const response = await fetch(API_URL);
    const postos = await response.json();
    
    const tabelaHTML = postos.map(posto => `
      <tr>
        <td>${posto.Nome || '-'}</td>
        <td>R$ ${formatarPreco(posto.Etanol)}</td>
        <td>R$ ${formatarPreco(posto['Gas. Comum'])}</td>
        <td>R$ ${formatarPreco(posto['Gas. Aditivada'])}</td>
        <td>${posto.Bandeira || '-'}</td>
        <td>${posto.Funcionamento || '-'}</td>
        <td>${posto.Endereço || '-'}</td>
        <td><i class="fas fa-map-marker-alt mapa-icon" 
              onclick="abrirMapa('${posto.Coordenadas || ''}')"></i></td>
        <td>${formatarData(posto['Atualizado em'])}</td>
      </tr>
    `).join('');
    
    document.getElementById('tabela-postos').innerHTML = tabelaHTML;
    document.getElementById('data-atualizacao').textContent = new Date().toLocaleString();
    
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
    alert("Erro ao carregar dados. Tente novamente mais tarde.");
  }
}

function abrirMapa(coordenadas) {
  if (!coordenadas) return;
  window.open(`https://www.google.com/maps?q=${coordenadas}`, '_blank');
}

// Botão de atualização
document.getElementById('btn-atualizar').addEventListener('click', carregarPostos);

// Carrega os dados quando a página abre
document.addEventListener('DOMContentLoaded', carregarPostos);

function formatarData(data) {
  if (!data) return '-';
  if (typeof data === 'string' && data.includes('/')) return data;
  const dateObj = new Date(data);
  return dateObj.toLocaleDateString('pt-BR');
}

function formatarPreco(valor) {
  const numero = Number(valor) || 0;
  return numero.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Inicialização da página
document.addEventListener('DOMContentLoaded', function() {
  // Inicializa os sliders
  const swiperConfig = {
    loop: true,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false,
    },
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
  };

  if (document.querySelector('.banner-topo')) {
    new Swiper('.banner-topo', swiperConfig);
  }

  if (document.querySelector('.banner-rodape')) {
    new Swiper('.banner-rodape', swiperConfig);
  }

  // Carrega a calculadora se estiver na página certa
  if (document.getElementById('kmInicial')) {
    carregarHistorico();
  }

  // Carrega a tabela de combustíveis se estiver na página certa
  if (document.getElementById('tabela-postos')) {
    carregarPostos();
  }

  // Configura o formulário de contato se estiver na página certa
  if (document.getElementById('formContato')) {
    document.getElementById('formContato').addEventListener('submit', function(e) {
      e.preventDefault();
      alert('Mensagem enviada com sucesso!');
      this.reset();
    });
  }
});