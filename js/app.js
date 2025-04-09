let currentTrip = [];
let sortableInstance = null;

// ========== FUNÇÕES DE VALIDAÇÃO ========== //
function validateCreateButton() {
  const dateInput = document.getElementById('startDate');
  const createBtn = document.querySelector('.controls button');
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
    if (btn.disabled) return; // Impede execução se botão estiver desabilitado
    
    const startDateInput = document.getElementById('startDate').value;
    const [year, month, day] = startDateInput.split('-');
    const startDate = new Date(year, month - 1, day);
    
    const daysCount = parseInt(document.getElementById('daysCount').value);
    currentTrip = [];
    
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
            <span class="date">${day.date}</span>
            <span class="day">${day.weekday}</span>
            <div class="event-container">
                <div class="drag-handle">☰</div>
                <input type="text" 
                       placeholder="Ex: Rio de Janeiro" 
                       value="${day.location}" 
                       oninput="updateLocation(${index}, this.value)">
                <button class="event-info-btn" onclick="openEventModal(${index})">ℹ️</button>
</div>
                
            </div>
        `;
        daysList.appendChild(row);
    });

    initSortable();
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
        date: formatDate(nextDate),
        weekday: getShortWeekday(nextDate), // Usa a função de abreviação
        location: ''
    });
    renderTrip();
}

function removeDay() {
    if (currentTrip.length > 1) {
        currentTrip.pop();
        renderTrip();
    }
}

// Drag and Drop
function initSortable() {
    if (sortableInstance) sortableInstance.destroy();
    
    sortableInstance = new Sortable(daysList, {
        handle: '.drag-handle',
        animation: 150,
        onEnd: (evt) => {
            const oldIndex = evt.oldIndex;
            const newIndex = evt.newIndex;
            [currentTrip[oldIndex].location, currentTrip[newIndex].location] = 
            [currentTrip[newIndex].location, currentTrip[oldIndex].location];
            renderTrip();
        }
    });
}

// Salvar/Compartilhar
function saveTrip() {
    localStorage.setItem('savedTrip', JSON.stringify(currentTrip));
    alert('Viagem salva! 🎉');
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
document.getElementById('importFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
        currentTrip = JSON.parse(e.target.result);
        renderTrip();
    };
    reader.readAsText(file);
});

// ========== INICIALIZAÇÃO ========== //
window.onload = () => {
    // Validação do botão
    validateCreateButton();
    document.getElementById('startDate').addEventListener('input', validateCreateButton);
    
    // Carrega viagem salva
    const savedTrip = localStorage.getItem('savedTrip');
    if (savedTrip) {
        currentTrip = JSON.parse(savedTrip);
        renderTrip();
    }
};
