let currentTrip = [];
let sortableInstance = null;

// Função para formatar a data como DD/MM/AAAA
function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getDate() === 1 ? date.getMonth() + 1 : date.getMonth() + 1).padStart(2, '0'); // Corrigido
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Converte DD/MM/AAAA para Date (usado no addDay)
function parseDate(dateStr) {
    const [day, month, year] = dateStr.split('/');
    return new Date(`${year}-${month}-${day}`);
}

// Cria/Atualiza a viagem
function createTrip() {
    const startDateInput = document.getElementById('startDate').value; // Formato ISO: "AAAA-MM-DD"
    const [year, month, day] = startDateInput.split('-'); // Divide a data
    const startDate = new Date(year, month - 1, day); // Cria data LOCAL (evita problemas de fuso horário)
    
    const daysCount = parseInt(document.getElementById('daysCount').value);
    currentTrip = [];
    
    for (let i = 0; i < daysCount; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i); // Adiciona "i" dias
        currentTrip.push({
            date: formatDate(date),
            weekday: date.toLocaleDateString('pt-BR', { weekday: 'long' }),
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
                       placeholder="Ex: RJ→BH" 
                       value="${day.location}" 
                       oninput="updateLocation(${index}, this.value)">
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
    lastDate.setDate(lastDate.getDate() + 1);
    
    currentTrip.push({
        date: formatDate(lastDate),
        weekday: lastDate.toLocaleDateString('pt-BR', { weekday: 'long' }),
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

// Inicialização
window.onload = () => {
    const savedTrip = localStorage.getItem('savedTrip');
    if (savedTrip) {
        currentTrip = JSON.parse(savedTrip);
        renderTrip();
    }
};