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

// Cria/Atualiza a viagem
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
            location: ''
        });
    }
    
    renderTrip();
}

// Renderiza a tabela
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
            </div>
        `;
        
        daysList.appendChild(row);
    });

    initSortable();
}

// Função auxiliar para renderizar atrações
function renderAttractions(attractions, dayIndex) {
    return (attractions || []).map((attraction, attractionIndex) => `
        <div class="attraction-item">
            <input type="text" 
                   value="${attraction.name}" 
                   onchange="updateAttractionName(${dayIndex}, ${attractionIndex}, this.value)">
            <input type="number" 
                   value="${attraction.price}" 
                   onchange="updateAttractionPrice(${dayIndex}, ${attractionIndex}, this.value)">
        </div>
    `).join('');
}

// Controle expandir/recolher
function toggleDetails(index) {
    const details = document.getElementById(`details-${index}`);
    const icon = details.previousElementSibling.querySelector('i');
    
    details.style.display = details.style.display === 'none' ? 'block' : 'none';
    icon.className = details.style.display === 'none' 
        ? 'fa-solid fa-chevron-down' 
        : 'fa-solid fa-chevron-up';
}

// Exemplo de função de atualização
function updateDeparture(index, value) {
    currentTrip[index].departure = value;
    // Adicione lógica de salvamento automático se desejar
}

// Atualiza localização
function updateLocation(index, value) {
    currentTrip[index].location = value;
}

// Adiciona/Remove dias
function addDay() {
    if (currentTrip.length === 0) return; // Prevenção contra array vazio

    const lastDateStr = currentTrip[currentTrip.length - 1].date;
    const lastDate = parseDate(lastDateStr);
    
    // Cria nova data SEM timezone (evita bugs de UTC)
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + 1);
    
    currentTrip.push({
        date: formatDate(nextDate),
        weekday: getShortWeekday(nextDate),
        location: '',
        lodgingPrice: '', // Novo
        transportPrice: '', // Novo
        foodPrice: '', // Novo
        attractions: [] // Novo
      });
    renderTrip();
}

function removeDay() {
    if (currentTrip.length > 1) {
        currentTrip.pop();
        
        // Remove também o último evento salvo se existir
        const savedEvents = JSON.parse(localStorage.getItem('currentTrip')) || [];
        if (savedEvents.length >= currentTrip.length) {
            savedEvents.pop();
            localStorage.setItem('currentTrip', JSON.stringify(savedEvents));
        }
        
        renderTrip();
    }
}

// Drag and Drop
function initSortable() {
    if (sortableInstance) sortableInstance.destroy();
    
    sortableInstance = new Sortable(daysList, {
        handle: '.drag-handle',
        draggable: '.day-row',
        animation: 150,
        onEnd: (evt) => {
            const oldIndex = evt.oldIndex;
            const newIndex = evt.newIndex;

            // Troca APENAS os dados do evento entre os dias
            const tempLocation = currentTrip[oldIndex].location;
            const tempEventDetails = { 
                departure: currentTrip[oldIndex].departure,
                arrival: currentTrip[oldIndex].arrival,
                lodging: currentTrip[oldIndex].lodging,
                lodgingPrice: currentTrip[oldIndex].lodgingPrice,
                attractions: currentTrip[oldIndex].attractions,
                notes: currentTrip[oldIndex].notes
            };

            // Mantém as datas originais, só troca os dados do evento
            currentTrip[oldIndex].location = currentTrip[newIndex].location;
            currentTrip[oldIndex].departure = currentTrip[newIndex].departure;
            currentTrip[oldIndex].arrival = currentTrip[newIndex].arrival;
            currentTrip[oldIndex].lodging = currentTrip[newIndex].lodging;
            currentTrip[oldIndex].lodgingPrice = currentTrip[newIndex].lodgingPrice;
            currentTrip[oldIndex].attractions = currentTrip[newIndex].attractions;
            currentTrip[oldIndex].notes = currentTrip[newIndex].notes;

            currentTrip[newIndex].location = tempLocation;
            currentTrip[newIndex].departure = tempEventDetails.departure;
            currentTrip[newIndex].arrival = tempEventDetails.arrival;
            currentTrip[newIndex].lodging = tempEventDetails.lodging;
            currentTrip[newIndex].lodgingPrice = tempEventDetails.lodgingPrice;
            currentTrip[newIndex].attractions = tempEventDetails.attractions;
            currentTrip[newIndex].notes = tempEventDetails.notes;

            // Atualiza localStorage
            localStorage.setItem('currentTrip', JSON.stringify(currentTrip));
            
            renderTrip();
        }
    });
}

// Salvar/Compartilhar
function saveTrip() {
    localStorage.setItem('savedTrip', JSON.stringify(currentTrip));
    alert('Viagem salva! 🎉🎉🎉');
}

function shareTrip() {
    const data = JSON.stringify(currentTrip);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'viagem.json';
    a.click();
}

// Importar
// document.getElementById('importFile').addEventListener('change', function(e) {
//     const file = e.target.files[0];
//     if (!file) return;
    
//     const reader = new FileReader();
//     reader.onload = (e) => {
//         try {
//             currentTrip = JSON.parse(e.target.result);
//             // Limpa os eventos detalhados ao importar nova viagem
//             localStorage.removeItem('currentTrip');
//             renderTrip();
//             alert('Viagem importada com sucesso!');
//         } catch (error) {
//             alert('Erro ao importar o arquivo. Verifique se é um JSON válido.');
//             console.error('Erro na importação:', error);
//         }
//     };
//     reader.onerror = () => {
//         alert('Erro ao ler o arquivo.');
//     };
//     reader.readAsText(file);
// });


// ======== ABRIR MODAL DE DESPESA ======== //
// Variáveis globais para controle
let currentExpenseType = ''; // 'hospedagem', 'transporte', etc.
let currentExpenseDayIndex = null; // Índice do dia na viagem

// Abre o modal específico
function openExpenseModal(type, dayIndex) {
    currentExpenseType = type;
    currentExpenseDayIndex = dayIndex;
    
    const modalId = `${type}Modal`; // Ex: 'hospedagemModal'
    const modal = document.getElementById(modalId);
    
    if (modal) {
      modal.showModal();
      // Adiciona classe para estilização específica (opcional)
      modal.classList.add('active');
    } else {
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


// ========== INICIALIZAÇÃO ========== //
window.onload = () => {
    // Validação do botão (agora independente)
    validateCreateButton();
    
    // Listener para validação em tempo real
    const startDateInput = document.getElementById('startDate');
    if (startDateInput) {
        startDateInput.addEventListener('input', validateCreateButton);
    }
    
    // Carrega viagem salva (se existir)
    const savedTrip = localStorage.getItem('savedTrip');
    if (savedTrip) {
        currentTrip = JSON.parse(savedTrip);
        renderTrip();
    }
};

// Limpar o localStorage e apagar infos de viagem
// Manter a linha abaixo comentada para salvar infos
localStorage.clear();
