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
            <!-- Cabeçalho do Dia (sempre visível) -->
            <div class="day-header" onclick="toggleDetails(${index})">
                <span class="date">${day.date}</span>
                <span class="day">${day.weekday}</span>
                <div class="event-container">
                    <div class="drag-handle">☰</div>
                    <input type="text" 
                           placeholder="Ex: Rio de Janeiro" 
                           value="${day.location || ''}" 
                           oninput="updateLocation(${index}, this.value)">
                    <button class="event-info-btn">
                        <i class="fa-solid fa-chevron-down"></i>
                    </button>
                </div>
            </div>

            <!-- Detalhes Expandíveis -->
            <div class="details-row" id="details-${index}" style="display: none;">
                <div class="modal-grid">
                    <!-- Linha 2 - 3 colunas -->
                    <div class="row-third">
                        <label>
                            Partida:
                            <input type="time" 
                                   value="${day.departure || ''}" 
                                   onchange="updateDeparture(${index}, this.value)">
                        </label>
                        
                        <label>
                            Chegada:
                            <input type="time" 
                                   value="${day.arrival || ''}" 
                                   onchange="updateArrival(${index}, this.value)">
                        </label>
                    </div>

                    <!-- Linha 3 - Hospedagem -->
                    <div class="row-half-unequal">
                        <label>
                            Hospedagem:
                            <input type="text" 
                                   value="${day.lodging || ''}" 
                                   onchange="updateLodging(${index}, this.value)">
                        </label>
                        <label>
                            Valor:
                            <input type="number" 
                                   value="${day.lodgingPrice || ''}" 
                                   onchange="updateLodgingPrice(${index}, this.value)">
                        </label>
                    </div>

                    <!-- Adicione os demais campos seguindo o mesmo padrão -->
                    <!-- Exemplo para Atrações (será necessário ajustar) -->
                    <div class="attraction-container">
                        ${renderAttractions(day.attractions, index)}
                    </div>

                    <!-- Botões para Add/Remover Atrações -->
                    <div class="attraction-actions">
                        <button type="button" onclick="addAttractionField(${index})">
                            + Atração
                        </button>
                        <button type="button" onclick="removeAttraction(${index})">
                            - Atração
                        </button>
                    </div>
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
    const lastDateStr = currentTrip[currentTrip.length - 1].date;
    const lastDate = parseDate(lastDateStr);
    
    // Cria nova data SEM timezone (evita bugs de UTC)
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + 1);
    
    currentTrip.push({
        date: formatDate(date),
        weekday: getShortWeekday(date),
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

            // Troca os dias de posição no array
            const temp = currentTrip[oldIndex];
            currentTrip[oldIndex] = currentTrip[newIndex];
            currentTrip[newIndex] = temp;
            
            // Atualiza também os eventos salvos no localStorage se existirem
            const savedEvents = JSON.parse(localStorage.getItem('currentTrip')) || [];
            if (savedEvents.length > 0) {
                const tempEvent = savedEvents[oldIndex];
                savedEvents[oldIndex] = savedEvents[newIndex];
                savedEvents[newIndex] = tempEvent;

                localStorage.setItem('savedTrip', JSON.stringify(currentTrip));
            }
            
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
// localStorage.clear();
