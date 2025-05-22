let currentTrip = JSON.parse(localStorage.getItem('currentTrip')) || [];
// outra forma de escrever usando if else
// let currentTrip;
// const storedTrip = localStorage.getItem('currentTrip');
// if (storedTrip) {
//   currentTrip = JSON.parse(storedTrip);
// } else {
//   currentTrip = [];
// }

let sortableInstance = null;

// ========== FUNÇÕES DE VALIDAÇÃO ========== //
function validateCreateButton() {
  const dateInput = document.getElementById('startDate');
  const createBtn = document.getElementById('createTripBtn');
  createBtn.disabled = !dateInput.value;
}


// ========== FUNÇÕES DE FORMATAÇÃO ========== //
// Função para formatar a data como DD/MM/AAAA
function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Converte DD/MM/AAAA para Date (usado no addDay)
function parseDate(dateStr) {
    const [day, month, year] = dateStr.split('/');
    return new Date(year, month - 1, day);
}

//Abrevia os dias da semana
function getShortWeekday(date) {
    const longName = date.toLocaleDateString('pt-BR', { weekday: 'long' }).toLowerCase();
    const weekdays = {
        'domingo': 'dom',
        'segunda-feira': 'seg',
        'terça-feira': 'ter',
        'quarta-feira': 'qua',
        'quinta-feira': 'qui',
        'sexta-feira': 'sex',
        'sábado': 'sab'
    };
    return weekdays[longName] || '???';
}

// ========== FUNÇÕES PRINCIPAIS ========== //

// CRIAR/ATUALIZAR VIAGEM //
function createTrip() {
    const btn = document.querySelector('.controls button');
    if (btn.disabled) return;
    
    const startDateInput = document.getElementById('startDate').value;
    const [year, month, day] = startDateInput.split('-');
    const startDate = new Date(year, month - 1, day);
    
    const daysCount = parseInt(document.getElementById('daysCount').value);
    currentTrip = [];
    
    // Limpa os eventos salvos para esta viagem
    localStorage.removeItem('currentTrip');
    
for (let i = 0; i < daysCount; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        currentTrip.push({
        date: formatDate(date),
        weekday: getShortWeekday(date),
        location: '',
        expenses: { // 👈 Deve ter lodging como array
            lodging: [],
            transport: [],
            food: [],
            activity: [],
            shopping: []
        }
        });
    }
    renderTrip();
}

// RENDERIZAR TABELA DE VIAGEM //
function renderTrip() {
    const daysList = document.getElementById('daysList');
    daysList.innerHTML = '';
    
    currentTrip.forEach((day, index) => {
        const row = document.createElement('div');
        row.className = 'day-row';
        
        row.innerHTML = `
            <!-- Cabeçalho do Dia -->
            <div class="day-header">
                <div class="date-day">
                    <span class="date">${day.date}</span>
                    <span class="day">${day.weekday}</span>
                </div>
                <div class="event-container">
                    <div class="drag-handle">☰</div>
                    <input type="text" 
                           placeholder="Ex: Rio de Janeiro" 
                           value="${day.location || ''}" 
                           oninput="updateLocation(${index}, this.value)">
                    <button class="expand-btn" onclick="toggleDetails(${index})">
                        <i class="fa-solid fa-chevron-down"></i>
                    </button>
                </div>
            </div>

            <!-- Detalhes Expandíveis -->
            <div class="details-row" id="details-${index}" style="display: none;">

                <div class="expense-buttons">
                    <!-- Botões para Adicionar Despesas -->
                    <button class="expense-btn" onclick="openExpenseModal('lodging', ${index})">
                        <i class="fa-solid fa-bed"></i>
                        <span>Hospedagem</span>
                    </button>
                    <button class="expense-btn" onclick="openExpenseModal('transport', ${index})">
                        <i class="fa-solid fa-car"></i>
                        <span>Transporte</span>
                    </button>
                    <button class="expense-btn" onclick="openExpenseModal('food', ${index})">
                        <i class="fa-solid fa-utensils"></i>
                        <span>Alimentação</span>
                    </button>
                    <button class="expense-btn" onclick="openExpenseModal('activity', ${index})">
                        <i class="fa-solid fa-ticket-simple"></i>
                        <span>Atividades</span>
                    </button>
                    <button class="expense-btn" onclick="openExpenseModal('shopping', ${index})">
                        <i class="fa-solid fa-bag-shopping"></i>
                        <span>Compras</span>
                    </button>
                </div>

                <!-- Cards de Despesas -->
                <div class="expense-cards">
                    ${renderExpenseCards(day.expenses)}
                </div>
            </div>
        `;
        
        daysList.appendChild(row);
    });

    initSortable();
}

// CONTROLE EXPANDIR/RECOLHER
function toggleDetails(index) {
    const details = document.getElementById(`details-${index}`);
    const icon = details.previousElementSibling.querySelector('i');
    
    details.style.display = details.style.display === 'none' ? 'block' : 'none';
    icon.className = details.style.display === 'none' 
        ? 'fa-solid fa-chevron-down' 
        : 'fa-solid fa-chevron-up';
}


// Atualiza localização
function updateLocation(index, value) {
    currentTrip[index].location = value;
    saveTrip();
}

// ADICIONA/REMOVE DIAS //
function addDay() {
    if (currentTrip.length === 0) return; // Prevenção contra array vazio

    const lastDateStr = currentTrip[currentTrip.length - 1].date;
    const lastDate = parseDate(lastDateStr);
    
    // Cria nova data SEM timezone (evita bugs de UTC)
const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + 1);

    currentTrip.push({
    date: formatDate(nextDate),
    weekday: getShortWeekday(date),
    location: '',
    expenses: { // 👈 Nova estrutura
        lodging: [], // Array para múltiplas hospedagens
        transport: [],
        food: [],
        activity: [],
        shopping: []
    }
    });
    renderTrip();
    saveTrip();
};

function removeDay() {
    if (currentTrip.length > 1) {
        currentTrip.pop();
        
        renderTrip();
        saveTrip();
    }
}

// DRAG AND DROP //
function initSortable() {
    if (sortableInstance) sortableInstance.destroy();
    
    sortableInstance = new Sortable(daysList, {
        handle: '.drag-handle',
        draggable: '.day-row',
        animation: 150,
        onEnd: (evt) => {
            const oldIndex = evt.oldIndex;
            const newIndex = evt.newIndex;

            // Guarda as datas originais (não devem ser alteradas)
            const oldDate = currentTrip[oldIndex].date;
            const oldWeekday = currentTrip[oldIndex].weekday;
            const newDate = currentTrip[newIndex].date;
            const newWeekday = currentTrip[newIndex].weekday;

            // Troca TODOS os dados relacionados ao evento/local
            const tempEventData = { 
                location: currentTrip[oldIndex].location, // inclui a localização
                expenses: currentTrip[oldIndex].expenses // inclui as despesas
            };

            // Move os dados do novo índice para o antigo
            currentTrip[oldIndex].location = currentTrip[newIndex].location;
            currentTrip[oldIndex].expenses = currentTrip[newIndex].expenses;

            // Coloca os dados temporários no novo índice
            currentTrip[newIndex].location = tempEventData.location;
            currentTrip[newIndex].expenses = tempEventData.expenses;

            // Restaura as datas originais nos índices
            currentTrip[oldIndex].date = oldDate;
            currentTrip[oldIndex].weekday = oldWeekday;
            currentTrip[newIndex].date = newDate;
            currentTrip[newIndex].weekday = newWeekday;

            saveTrip();
            renderTrip();
        }
    });
}

// SALVAR VIAGEM //
let saveTimeout;
// Salvamento automático
function saveTrip() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    localStorage.setItem('savedTrip', JSON.stringify(currentTrip));
    console.log('Salvando...'); // Remova o alerta
  }, 500); // Salva após 0.5s da última alteração
}

// Salvamento manual (instantâneo)
function manualSaveTrip() {
  clearTimeout(saveTimeout); // Cancela o debounce pendente
  localStorage.setItem('savedTrip', JSON.stringify(currentTrip));
  alert('Viagem salva! ✅');
}


// ABRIR MODAL DE DESPESA //
// Variáveis globais para controle
let currentExpenseType = ''; // Guarda o tipo de despesa selecionado (ex: 'hospedagem')
let currentExpenseDayIndex = null; // Guarda o índice/dia da viagem selecionado

function openExpenseModal(type, dayIndex) {
    // Atualiza as variáveis globais com os valores recebidos
    currentExpenseType = type; // Ex: Define 'hospedagem' como tipo atual
    currentExpenseDayIndex = dayIndex; // Ex: Define 2 (terceiro dia) como dia atual
    
    // Cria o ID do modal baseado no tipo (concatenação)
    const modalId = `${type}Modal`; // Resultado: 'hospedagemModal' (template string)
    // Busca o elemento do modal no DOM
    const modal = document.getElementById(modalId); // Procura por id="hospedagemModal"
    
    // Verifica se o modal foi encontrado
    if (modal) {
    // Abre o modal (método nativo do HTMLDialogElement)
      modal.showModal();
    // Adiciona classe CSS para estilização
      modal.classList.add('active');
    } else {
    // Mensagem de erro se o modal não existir
      console.error(`Modal não encontrado: ${modalId}`);
    }
  }

// Fecha qualquer modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.close();
      modal.classList.remove('active');
    }
  }
  
// Fechar modal ao clicar fora
  document.querySelectorAll('.expense-modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modal.id);
    });
  });

// MAPEAMENTO DE CAMPOS POR TIPO //
const fieldConfig = {
  lodging: {
    fields: ['Type', 'Value', 'CheckIn', 'CheckOut', 'Name', 'Address', 'Link']
  },
  transport: {
    fields: ['Type', 'Value', 'Departure', 'Arrival', 'Time']
  },
  food: {
    fields: ['Value', 'Name']
  },
  activity: {
    fields: ['Type', 'Value', 'Name', 'Address', 'Date', 'Time']
  },
  shopping: {
    fields: ['Store', 'Value', 'Address', 'Items']
  }
};

// SALVAR DESPESA (HOSPEDAGEM) //
function saveExpense() {
  const type = currentExpenseType;
  const dayIndex = currentExpenseDayIndex;
  
  // Obter configuração dos campos
  const config = fieldConfig[type];
  const expenseData = { id: Date.now() };

  // Coletar dados dinamicamente
  config.fields.forEach(field => {
    const fieldId = `${type}${field}`; // Ex: lodgingType
    const element = document.getElementById(fieldId);
    
    if (element) {
      let value = element.value;
      // Converter números
      if (fieldId.includes('Value')) value = parseFloat(value);
      expenseData[field.toLowerCase()] = value;
    }
  });

  // Salvar no currentTrip
  currentTrip[dayIndex].expenses[type].push(expenseData);
  
  closeModal(`${type}Modal`);
  saveTrip();
  renderTrip();
}

// RENDERIZAR CARDS DE DESPESA //
function renderExpenseCards(expenses) {
    // Mapeamento dos tipos para português
  const typeNames = {
    lodging: 'HOSPEDAGEM',
    transport: 'TRANSPORTE',
    food: 'ALIMENTAÇÃO',
    activity: 'ATIVIDADE',
    shopping: 'COMPRAS'
  };

return Object.keys(expenses).map(type => 
    expenses[type].map((expense, index) => `
      <div class="expense-card" data-type="${type}">
        <div class="card-header">
          <h4>${typeNames[type]}</h4>
          <div class="card-actions">
            <button onclick="editExpense('${type}', ${index})">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button onclick="deleteExpense('${type}', ${index})">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
        ${type === 'lodging' ? `
          <p>${expense.name} (${expense.type})</p>
          <p>Check-in: ${expense.checkIn} | Check-out: ${expense.checkOut}</p>
          ${expense.link ? `<p><a href="${expense.link}" target="_blank">🔗 Link</a></p>` : ''}
        ` : ''}
        ${type === 'transport' ? `
          <p>${expense.type} - ${expense.departure} → ${expense.destination}</p>
          <p>Duração: ${expense.time}</p>
        ` : ''}
        <p class="expense-value">R$ ${expense.value.toFixed(2)}</p>
      </div>
    `).join('')
  ).join('');
}


// EDITAR DESPESA //
function editExpense(type, expenseIndex) {
  const expense = currentTrip[currentExpenseDayIndex].expenses[type][expenseIndex];
  const modal = document.getElementById(`${type}Modal`);

  // Preenche todos os campos do modal baseado no tipo
  if (type === 'lodging') {
    modal.querySelector('#lodgingType').value = expense.type;
    modal.querySelector('#lodgingValue').value = expense.value;
    modal.querySelector('#lodgingCheckIn').value = expense.checkIn;
    modal.querySelector('#lodgingCheckOut').value = expense.checkOut;
    modal.querySelector('#lodgingName').value = expense.name;
    modal.querySelector('#lodgingAddress').value = expense.address;
    modal.querySelector('#lodgingLink').value = expense.link;
  }
  else if (type === 'transport') {
    modal.querySelector('#transportType').value = expense.type;
    modal.querySelector('#transportValue').value = expense.value;
    modal.querySelector('#transportDeparture').value = expense.departure;
    modal.querySelector('#transportArrival').value = expense.arrival;
    modal.querySelector('#transportTime').value = expense.time;
  }

  modal.showModal();
  
  // Atualiza o evento de submit para edição
  modal.querySelector('form').onsubmit = (e) => {
    e.preventDefault();
    updateExpense(expenseIndex);
  };
}

// ATUALIZAR DESPESA //
function updateExpense(expenseIndex) {
  const type = currentExpenseType;
  const modal = document.getElementById(`${type}Modal`);
  const dayIndex = currentExpenseDayIndex;

  // Coleta os dados atualizados
  const updatedData = {};
  if (type === 'lodging') {
    updatedData.type = modal.querySelector('#lodgingType').value;
    updatedData.value = parseFloat(modal.querySelector('#lodgingValue').value);
    updatedData.checkIn = modal.querySelector('#lodgingCheckIn').value;
    // ... colete todos os campos
  }
  // Repita para outros tipos...

  // Atualiza os dados
  currentTrip[dayIndex].expenses[type][expenseIndex] = {
    ...currentTrip[dayIndex].expenses[type][expenseIndex],
    ...updatedData
  };

  saveTrip();
  closeModal(`${type}Modal`);
  renderTrip();
}

// EXCLUIR DESPESA //
function deleteExpense(type, expenseIndex) {
  currentTrip[currentExpenseDayIndex].expenses[type].splice(expenseIndex, 1);
  saveTrip();
  renderTrip();
}


// ========== INICIALIZAÇÃO ========== //
window.onload = () => {
    // Validação do botão (agora independente)
    validateCreateButton();
    
    // Listener para validação em tempo real
    const startDateInput = document.getElementById('startDate');
    if (startDateInput) {
        startDateInput.addEventListener('input', validateCreateButton);
    }
    
    // Carrega viagem salva ou inicializa array
    const savedTrip = localStorage.getItem('savedTrip');
    currentTrip = savedTrip ? JSON.parse(savedTrip) : [];
    
    if (currentTrip.length > 0) renderTrip(); // Renderiza só se houver dados
};


// Limpar o localStorage e apagar infos de viagem
// Manter a linha abaixo comentada para salvar infos
// localStorage.clear();
