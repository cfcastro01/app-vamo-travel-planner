// ====================================================================
// app.js - Lógica Principal do Aplicativo de Viagens
// ====================================================================

// ========== 1. VARIÁVEIS GLOBAIS ==========
let currentTrip = []; // Armazena os dados dos dias e despesas da viagem atual
let tripTitle = ''; // Título da viagem atual
let sortableInstance = null; // Instância do SortableJS para arrastar e soltar dias
let currentUser = null; // Objeto do usuário logado do Firebase Authentication
let currentTripId = null; // ID do documento da viagem atual no Firestore

// Variáveis para controle de despesas no modal
let currentExpenseType = ''; // Tipo de despesa sendo adicionada/editada (ex: 'lodging')
let currentExpenseDayIndex = null; // Índice do dia da viagem para a despesa
let currentExpenseIndex = null; // Índice da despesa específica sendo editada (se for uma edição)
let saveTimeout; // Variável para o debounce do salvamento automático

// Mapeamento de campos de modal por tipo de despesa
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

// ====================================================================
// ========== 2. INICIALIZAÇÃO E AUTENTICAÇÃO (DOM Ready) ==========
// ====================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Listener para o botão de logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await auth.signOut();
                console.log('Usuário deslogado com sucesso!');
                window.location.href = 'auth.html'; // Redirecionar para a página de autenticação
            } catch (error) {
                console.error('Erro ao fazer logout:', error);
                alert('Erro ao sair. Tente novamente.');
            }
        });
    }

    // Listener de estado de autenticação do Firebase
    // Essencial para saber se o usuário está logado e carregar seus dados
    auth.onAuthStateChanged(user => {
        if (user) {
            // Se um usuário está logado
            currentUser = user; // Define o usuário global
            console.log('Usuário logado:', currentUser.uid);
            // Carrega as viagens do usuário do Firestore
            loadUserTrips(currentUser.uid);

            // Re-valida o botão de criar viagem (se o usuário já estiver logado e tiver data)
            validateCreateButton();

            // Listener para validação do input de data (deve estar dentro de DOMContentLoaded)
            const startDateInput = document.getElementById('startDate');
            if (startDateInput) {
                startDateInput.addEventListener('input', validateCreateButton);
            }

        } else {
            // Se o usuário NÃO está logado
            currentUser = null;
            // Redireciona para a página de autenticação, a menos que já estejamos nela
            if (!window.location.pathname.endsWith('auth.html') && !window.location.pathname.endsWith('/')) {
                window.location.href = 'auth.html';
            }
            // Opcional: Limpar a UI se o usuário deslogar para evitar mostrar dados antigos
            tripTitle = '';
            currentTrip = [];
            currentTripId = null;
            renderTrip();
        }
    });

    // Se o aplicativo carrega e não há um usuário logado imediatamente (ou seja, auth.onAuthStateChanged ainda não disparou),
    // pode ser que a página esteja sendo acessada diretamente e o usuário não está logado.
    // O 'onAuthStateChanged' vai tratar o redirecionamento.
    // O localStorage é removido aqui, pois a fonte de verdade agora é o Firestore.
    localStorage.removeItem('savedTrip');
});

// ====================================================================
// ========== 3. FUNÇÕES DE FORMATAÇÃO E UTILITÁRIAS ==========
// ====================================================================

/**
 * Valida o estado do botão de criar/atualizar viagem.
 * Desabilita o botão se a data de início não estiver preenchida.
 */
function validateCreateButton() {
    const dateInput = document.getElementById('startDate');
    const createBtn = document.getElementById('createTripBtn');
    if (createBtn) { // Verifica se o botão existe antes de tentar manipulá-lo
        createBtn.disabled = !dateInput.value;
    }
}

/**
 * Formata um objeto Date para a string "DD/MM/AAAA".
 * @param {Date} date O objeto Date a ser formatado.
 * @returns {string} A data formatada.
 */
function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

/**
 * Converte uma string de data "DD/MM/AAAA" para um objeto Date.
 * @param {string} dateStr A string de data no formato "DD/MM/AAAA".
 * @returns {Date} O objeto Date correspondente.
 */
function parseDate(dateStr) {
    const [day, month, year] = dateStr.split('/');
    return new Date(year, month - 1, day);
}

/**
 * Retorna a abreviação do dia da semana em português (ex: "seg", "ter").
 * @param {Date} date O objeto Date.
 * @returns {string} A abreviação do dia da semana.
 */
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

/**
 * Calcula o valor total de todas as despesas da viagem atual.
 * @returns {number} O valor total das despesas.
 */
function calculateTotalExpenses() {
    let total = 0;
    currentTrip.forEach(day => {
        Object.values(day.expenses).forEach(expenseList => {
            expenseList.forEach(exp => {
                total += exp.value || 0;
            });
        });
    });
    return total;
}

// ====================================================================
// ========== 4. FUNÇÕES DE GERENCIAMENTO DA VIAGEM (CRUD) ==========
// ====================================================================

/**
 * Cria uma nova estrutura de viagem ou reseta a atual com base nos inputs do usuário.
 * Salva a nova viagem no Firestore.
 */
function createTrip() {
    const btn = document.querySelector('.controls button');
    if (btn && btn.disabled) return; // Verifica se o botão e válido

    const startDateInput = document.getElementById('startDate').value;
    const [year, month, day] = startDateInput.split('-');
    const startDate = new Date(year, month - 1, day);

    const daysCount = parseInt(document.getElementById('daysCount').value);
    tripTitle = document.getElementById('tripTitle').value;
    currentTrip = []; // Reinicia currentTrip para uma nova viagem
    currentTripId = null; // Garante que é uma nova viagem no Firestore

    for (let i = 0; i < daysCount; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        currentTrip.push({
            date: formatDate(date),
            weekday: getShortWeekday(date),
            location: '',
            expenses: {
                lodging: [],
                transport: [],
                food: [],
                activity: [],
                shopping: []
            }
        });
    }
    renderTrip();
    saveTripToFirestore(true); // Salvamento manual inicial
}

/**
 * Renderiza (ou atualiza) a tabela de dias da viagem na interface.
 */
function renderTrip() {
    const daysList = document.getElementById('daysList');
    if (!daysList) {
        console.error("Elemento 'daysList' não encontrado.");
        return;
    }
    daysList.innerHTML = '';

    // Atualiza o valor total das despesas exibido
    const totalSpan = document.getElementById('tripTotalDisplay');
    if (totalSpan) {
        totalSpan.textContent = `Total: R$ ${calculateTotalExpenses().toFixed(2)}`;
    }

    currentTrip.forEach((day, index) => {
        const row = document.createElement('div');
        row.className = 'day-row';

        row.innerHTML = `
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
            <div class="details-row" id="details-${index}" style="display: none;">
                <div class="expense-buttons">
                    <button class="expense-btn" onclick="openExpenseModal('lodging', ${index})">
                        <i class="fa-solid fa-bed"></i><span>Hospedagem</span>
                    </button>
                    <button class="expense-btn" onclick="openExpenseModal('transport', ${index})">
                        <i class="fa-solid fa-car"></i><span>Transporte</span>
                    </button>
                    <button class="expense-btn" onclick="openExpenseModal('food', ${index})">
                        <i class="fa-solid fa-utensils"></i><span>Alimentação</span>
                    </button>
                    <button class="expense-btn" onclick="openExpenseModal('activity', ${index})">
                        <i class="fa-solid fa-ticket-simple"></i><span>Atividades</span>
                    </button>
                    <button class="expense-btn" onclick="openExpenseModal('shopping', ${index})">
                        <i class="fa-solid fa-bag-shopping"></i><span>Compras</span>
                    </button>
                </div>
                <div class="expense-cards">
                    ${renderExpenseCards(day.expenses, index)}
                </div>
            </div>
        `;
        daysList.appendChild(row);
    });

    initSortable();

    // Atualiza o título da viagem exibido
    const titleContainer = document.getElementById('tripTitleDisplay');
    if (titleContainer) {
        titleContainer.innerHTML = `
            <span class="trip-title-text">${tripTitle}</span>
            <button class="trip-title-btn" onclick="editTripTitle()">
                <i class="fa-solid fa-pen"></i>
            </button>
        `;
    }
}

/**
 * Alterna a visibilidade dos detalhes de um dia (despesas).
 * @param {number} index O índice do dia na `currentTrip`.
 */
function toggleDetails(index) {
    const details = document.getElementById(`details-${index}`);
    const icon = details.previousElementSibling.querySelector('i');

    if (details) {
        details.style.display = details.style.display === 'none' ? 'block' : 'none';
        if (icon) {
            icon.className = details.style.display === 'none'
                ? 'fa-solid fa-chevron-down'
                : 'fa-solid fa-chevron-up';
        }
    }
}

/**
 * Atualiza a localização de um dia específico na `currentTrip`.
 * @param {number} index O índice do dia.
 * @param {string} value O novo valor da localização.
 */
function updateLocation(index, value) {
    if (currentTrip[index]) {
        currentTrip[index].location = value;
        saveTripToFirestore(false); // Salvamento automático
    }
}

/**
 * Adiciona um novo dia ao final da viagem atual.
 */
function addDay() {
    if (currentTrip.length === 0) return; // Prevenção contra array vazio

    const lastDateStr = currentTrip[currentTrip.length - 1].date;
    const lastDate = parseDate(lastDateStr);

    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + 1);

    currentTrip.push({
        date: formatDate(nextDate),
        weekday: getShortWeekday(nextDate),
        location: '',
        expenses: {
            lodging: [],
            transport: [],
            food: [],
            activity: [],
            shopping: []
        }
    });
    renderTrip();
    saveTripToFirestore(false); // Salvamento automático
}

/**
 * Remove o último dia da viagem atual.
 */
function removeDay() {
    if (currentTrip.length > 1) {
        currentTrip.pop();
        renderTrip();
        saveTripToFirestore(false); // Salvamento automático
    }
}

/**
 * Inicializa a funcionalidade de arrastar e soltar para os dias da viagem.
 */
function initSortable() {
    const daysList = document.getElementById('daysList');
    if (!daysList) {
        console.error("Elemento 'daysList' para SortableJS não encontrado.");
        return;
    }
    // Destrói a instância anterior para evitar duplicidade de eventos
    if (sortableInstance) {
        sortableInstance.destroy();
    }

    sortableInstance = new Sortable(daysList, {
        handle: '.drag-handle',
        draggable: '.day-row',
        animation: 150,
        onEnd: (evt) => {
            const oldIndex = evt.oldIndex;
            const newIndex = evt.newIndex;

            // Cria uma cópia da viagem para manipular a ordem
            const tempTrip = [...currentTrip];
            const [movedItem] = tempTrip.splice(oldIndex, 1); // Remove o item da posição antiga
            tempTrip.splice(newIndex, 0, movedItem); // Insere o item na nova posição

            // Reatribui as datas e dias da semana para garantir que continuem em ordem cronológica
            // Apenas a ordem dos *dados do dia* (location, expenses) é alterada.
            // As datas e dias da semana permanecem fixas na posição original do array.
            currentTrip = tempTrip.map((day, index) => {
                const originalDayData = currentTrip.find(d => d.date === day.date && d.weekday === day.weekday);
                if (originalDayData) {
                    return {
                        date: originalDayData.date,
                        weekday: originalDayData.weekday,
                        location: day.location,
                        expenses: day.expenses
                    };
                }
                return day; // Fallback, shouldn't happen if logic is correct
            });

            saveTripToFirestore(false);
            renderTrip();
        }
    });
}


/**
 * Entra no modo de edição do título da viagem.
 */
function editTripTitle() {
    const container = document.getElementById('tripTitleDisplay');
    if (!container) return;

    container.innerHTML = `
        <input id="editTitleInput" value="${tripTitle}" class="edit-title-input">
        <button onclick="saveEditedTitle()" class="save-title-btn">
            <i class="fa-solid fa-floppy-disk"></i>
        </button>
    `;
    document.getElementById('editTitleInput')?.focus(); // Foca no input
}

/**
 * Salva o título da viagem editado.
 */
function saveEditedTitle() {
    const input = document.getElementById('editTitleInput');
    if (!input) return;

    tripTitle = input.value;

    const container = document.getElementById('tripTitleDisplay');
    if (container) {
        container.innerHTML = `
            <span class="trip-title-text">${tripTitle}</span>
            <button class="trip-title-btn" onclick="editTripTitle()">
                <i class="fa-solid fa-pen"></i>
            </button>
        `;
    }

    renderTrip(); // Re-renderiza para atualizar o total e outras coisas
    saveTripToFirestore(true); // Salvamento manual
}


// ====================================================================
// ========== 5. FUNÇÕES DE GERENCIAMENTO DE DESPESAS (CRUD) ==========
// ====================================================================

/**
 * Abre o modal de despesas para um tipo específico e dia da viagem.
 * @param {string} type O tipo de despesa (ex: 'lodging', 'transport').
 * @param {number} dayIndex O índice do dia na `currentTrip`.
 */
function openExpenseModal(type, dayIndex) {
    currentExpenseType = type;
    currentExpenseDayIndex = dayIndex;
    currentExpenseIndex = null; // Reseta o índice da despesa para indicar nova criação

    const modalId = `${type}Modal`;
    const modal = document.getElementById(modalId);

    // Limpar os campos do formulário antes de abrir (para nova despesa)
    if (modal) {
        modal.querySelectorAll('input').forEach(input => input.value = '');
        modal.querySelectorAll('textarea').forEach(textarea => textarea.value = '');
    }

    if (modal) {
        modal.showModal();
        modal.classList.add('active');
    } else {
        console.error(`Modal não encontrado: ${modalId}`);
    }
}

/**
 * Fecha um modal específico pelo seu ID.
 * @param {string} modalId O ID do modal a ser fechado.
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.close();
        modal.classList.remove('active');
    }
}

// Listener para fechar modais ao clicar fora
document.querySelectorAll('.expense-modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal.id);
    });
});

/**
 * Salva os dados de uma despesa (nova ou editada) na `currentTrip`.
 */
function saveExpense() {
    const type = currentExpenseType;
    const dayIndex = currentExpenseDayIndex;
    const modal = document.getElementById(`${type}Modal`);

    const expenseData = {
        id: Date.now(), // ID único para a despesa (para edição/exclusão)
        type: document.getElementById(`${type}Type`)?.value || '',
        value: parseFloat(document.getElementById(`${type}Value`)?.value) || 0,
        checkIn: document.getElementById(`${type}CheckIn`)?.value || '',
        checkOut: document.getElementById(`${type}CheckOut`)?.value || '',
        name: document.getElementById(`${type}Name`)?.value || '',
        store: document.getElementById(`${type}Store`)?.value || '',
        departure: document.getElementById(`${type}Departure`)?.value || '',
        destination: document.getElementById(`${type}Arrival`)?.value || '',
        time: document.getElementById(`${type}Time`)?.value || '',
        address: document.getElementById(`${type}Address`)?.value || '',
        link: document.getElementById(`${type}Link`)?.value || '',
        items: document.getElementById(`${type}Items`)?.value || ''
    };

    if (currentExpenseIndex !== null) {
        // Editando despesa existente
        if (currentTrip[dayIndex] && currentTrip[dayIndex].expenses[type] && currentTrip[dayIndex].expenses[type][currentExpenseIndex]) {
            currentTrip[dayIndex].expenses[type][currentExpenseIndex] = expenseData;
        }
        currentExpenseIndex = null; // Reseta o índice de edição
    } else {
        // Adicionando nova despesa
        if (currentTrip[dayIndex] && currentTrip[dayIndex].expenses[type]) {
            currentTrip[dayIndex].expenses[type].push(expenseData);
        }
    }

    closeModal(`${type}Modal`);
    saveTripToFirestore(false); // Salvamento automático
    renderTrip();
}

/**
 * Renderiza os cards de despesa para um dia específico.
 * @param {object} expenses O objeto de despesas para o dia.
 * @param {number} dayIndex O índice do dia na `currentTrip`.
 * @returns {string} O HTML dos cards de despesa.
 */
function renderExpenseCards(expenses, dayIndex) {
    const typeNames = {
        lodging: 'HOSPEDAGEM',
        transport: 'TRANSPORTE',
        food: 'ALIMENTAÇÃO',
        activity: 'ATIVIDADE',
        shopping: 'COMPRAS'
    };

    return Object.keys(expenses).map(type =>
        expenses[type].map((expense, expenseIndex) => `
            <div class="expense-card" data-type="${type}">
                <div class="card-header">
                    <h4>${typeNames[type]}</h4>
                    <div class="card-actions">
                        <button onclick="editExpense(${dayIndex}, '${type}', ${expenseIndex})">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button onclick="deleteExpense(${dayIndex}, '${type}', ${expenseIndex})">
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
                    <p>${expense.type} – ${expense.departure} → ${expense.destination}</p>
                    <p>Duração: ${expense.time}</p>
                ` : ''}
                ${type === 'food' ? `
                    <p>${expense.name}</p>
                ` : ''}
                ${type === 'activity' ? `
                    <p>${expense.type} – ${expense.name}</p>
                    <p>${expense.time}</p>
                ` : ''}
                ${type === 'shopping' ? `
                    <p>Loja: ${expense.store}</p>
                    ${expense.items ? `<p>Itens: ${expense.items}</p>` : ''}
                ` : ''}
                <p class="expense-value">R$ ${expense.value.toFixed(2)}</p>
            </div>
        `).join('')
    ).join('');
}

/**
 * Preenche o modal de despesas com os dados de uma despesa existente para edição.
 * @param {number} dayIndex O índice do dia na `currentTrip`.
 * @param {string} type O tipo de despesa (ex: 'lodging').
 * @param {number} expenseIndex O índice da despesa dentro do array de despesas do dia.
 */
function editExpense(dayIndex, type, expenseIndex) {
    currentExpenseDayIndex = dayIndex;
    currentExpenseType = type;
    currentExpenseIndex = expenseIndex; // Define o índice da despesa sendo editada

    const expense = currentTrip[dayIndex].expenses[type][expenseIndex];
    const modal = document.getElementById(`${type}Modal`);

    if (modal) {
        // Preenche os campos do modal com os dados da despesa
        modal.querySelector(`#${type}Type`) && (modal.querySelector(`#${type}Type`).value = expense.type || '');
        modal.querySelector(`#${type}Value`) && (modal.querySelector(`#${type}Value`).value = expense.value || '');
        modal.querySelector(`#${type}CheckIn`) && (modal.querySelector(`#${type}CheckIn`).value = expense.checkIn || '');
        modal.querySelector(`#${type}CheckOut`) && (modal.querySelector(`#${type}CheckOut`).value = expense.checkOut || '');
        modal.querySelector(`#${type}Name`) && (modal.querySelector(`#${type}Name`).value = expense.name || '');
        modal.querySelector(`#${type}Address`) && (modal.querySelector(`#${type}Address`).value = expense.address || '');
        modal.querySelector(`#${type}Link`) && (modal.querySelector(`#${type}Link`).value = expense.link || '');
        modal.querySelector(`#${type}Store`) && (modal.querySelector(`#${type}Store`).value = expense.store || '');
        modal.querySelector(`#${type}Departure`) && (modal.querySelector(`#${type}Departure`).value = expense.departure || '');
        modal.querySelector(`#${type}Arrival`) && (modal.querySelector(`#${type}Arrival`).value = expense.destination || ''); // Note: 'Arrival' no HTML é 'destination' no JS
        modal.querySelector(`#${type}Time`) && (modal.querySelector(`#${type}Time`).value = expense.time || '');
        modal.querySelector(`#${type}Items`) && (modal.querySelector(`#${type}Items`).value = expense.items || '');

        modal.showModal();
        modal.classList.add('active');
    } else {
        console.error(`Modal para edição não encontrado: ${modalId}`);
    }
}

/**
 * Exclui uma despesa específica de um dia.
 * @param {number} dayIndex O índice do dia.
 * @param {string} type O tipo de despesa.
 * @param {number} expenseIndex O índice da despesa a ser excluída.
 */
function deleteExpense(dayIndex, type, expenseIndex) {
    if (currentTrip[dayIndex] && currentTrip[dayIndex].expenses[type]) {
        currentTrip[dayIndex].expenses[type].splice(expenseIndex, 1);
        saveTripToFirestore(false); // Salvamento automático
        renderTrip();
    }
}

// ====================================================================
// ========== 6. FUNÇÕES DE PERSISTÊNCIA (FIRESTORE) ==========
// ====================================================================

/**
 * Salva a viagem atual no Firestore, com debounce para salvamento automático
 * e salvamento imediato para ações manuais.
 * @param {boolean} isManual Indica se o salvamento foi acionado manualmente.
 */
async function saveTripToFirestore(isManual = false) {
    if (!currentUser) {
        console.warn('Não é possível salvar: Usuário não logado.');
        if (isManual) alert('Erro: Você precisa estar logado para salvar uma viagem.');
        return;
    }

    clearTimeout(saveTimeout); // Limpa qualquer salvamento automático pendente

    if (!isManual) {
        // Agende o salvamento automático com um pequeno atraso (debounce)
        saveTimeout = setTimeout(performSaveToFirestore, 500);
    } else {
        // Salva imediatamente se for um salvamento manual
        await performSaveToFirestore();
        alert('Viagem salva! ✅');
    }
}

/**
 * Executa o salvamento de fato da viagem no Firestore.
 * É uma função auxiliar chamada por `saveTripToFirestore`.
 */
async function performSaveToFirestore() {
    try {
        const tripDataToSave = {
            tripTitle: tripTitle,
            days: currentTrip,
            lastUpdatedAt: firebase.firestore.FieldValue.serverTimestamp(), // Timestamp do último salvamento
        };

        if (!currentTripId) {
            // Se não há um ID de viagem, cria um novo documento
            const docRef = await db.collection('users').doc(currentUser.uid).collection('trips').add(tripDataToSave);
            currentTripId = docRef.id; // Armazena o ID gerado para futuras atualizações
            console.log('Nova viagem criada no Firestore com ID:', currentTripId);
        } else {
            // Se já há um ID de viagem, atualiza o documento existente
            await db.collection('users').doc(currentUser.uid).collection('trips').doc(currentTripId).set(tripDataToSave, { merge: true });
            console.log('Viagem atualizada no Firestore com ID:', currentTripId);
        }
    } catch (error) {
        console.error("Erro ao salvar viagem no Firestore:", error);
        // Não exibe alerta para o usuário em salvamento automático para não interromper
    }
}

/**
 * Carrega as viagens do usuário logado do Firestore.
 * Por enquanto, carrega a viagem mais recente ou inicializa uma nova.
 * @param {string} userId O UID do usuário logado.
 */
async function loadUserTrips(userId) {
    try {
        const tripsSnapshot = await db.collection('users').doc(userId).collection('trips')
            .orderBy('lastUpdatedAt', 'desc') // Ordena para pegar a mais recente
            .limit(1) // Limita a 1 para pegar apenas a mais recente
            .get();

        if (!tripsSnapshot.empty) {
            const firstTripDoc = tripsSnapshot.docs[0];
            const loadedTrip = firstTripDoc.data();
            currentTripId = firstTripDoc.id; // Define o ID da viagem carregada

            tripTitle = loadedTrip.tripTitle || 'Minha Viagem';
            currentTrip = loadedTrip.days || [];

            // Preenche os inputs do formulário com os dados carregados
            if (currentTrip.length > 0 && currentTrip[0].date) {
                const [day, month, year] = currentTrip[0].date.split('/');
                document.getElementById('startDate').value = `${year}-${month}-${day}`;
            } else {
                document.getElementById('startDate').value = '';
            }
            document.getElementById('daysCount').value = currentTrip.length;
            document.getElementById('tripTitle').value = tripTitle;

            renderTrip(); // Renderiza a UI com os dados carregados
            console.log('Viagem carregada do Firestore:', tripTitle, 'ID:', currentTripId);
        } else {
            // Se não houver viagens para o usuário, reseta a interface para uma nova viagem
            console.log('Nenhuma viagem encontrada para este usuário no Firestore. Começando uma nova.');
            document.getElementById('startDate').value = '';
            document.getElementById('daysCount').value = 7; // Valor padrão
            document.getElementById('tripTitle').value = '';
            tripTitle = '';
            currentTrip = [];
            currentTripId = null;
            renderTrip(); // Limpa a tabela
        }
    } catch (error) {
        console.error("Erro ao carregar viagens do Firestore:", error);
        alert("Erro ao carregar suas viagens. Tente recarregar a página.");
    }
}