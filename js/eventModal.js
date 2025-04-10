// =============================================
// VARIÁVEL GLOBAL
// =============================================

// Controla qual evento está sendo editado no momento
let currentEditingIndex = null;

// =============================================
// CONFIGURAÇÃO DOS INPUTS DE TEMPO
// =============================================

/**
 * Configura os inputs de tempo para aceitar apenas intervalos de 15 minutos
 * Cria um datalist com opções de 00, 15, 30, 45 minutos para todas as horas
 * Adiciona validação para garantir que apenas esses valores sejam aceitos
 */
function setupTimeInputs() {
  const timeInputs = document.querySelectorAll('input[type="time"]');
  
  timeInputs.forEach(input => {
    // Cria dropdown de opções quando o input recebe foco
    input.addEventListener('focus', () => {
      if (!input.list) {
        const datalist = document.createElement('datalist');
        datalist.id = `minuteOptions-${input.id}`;
        
        let html = '';
        // Gera todas as combinações de horas (00-23) e minutos (00,15,30,45)
        for (let h = 0; h < 24; h++) {
          ['00', '15', '30', '45'].forEach(m => {
            const hours = h.toString().padStart(2, '0');
            html += `<option value="${hours}:${m}"></option>`;
          });
        }
        
        datalist.innerHTML = html;
        document.body.appendChild(datalist);
        input.setAttribute('list', datalist.id);
      }
    });

    // Validação quando o valor é alterado
    input.addEventListener('change', () => {
      if (input.value) {
        const minutes = input.value.split(':')[1];
        const validMinutes = ['00', '15', '30', '45'];
        
        if (!validMinutes.includes(minutes)) {
          alert('Por favor, selecione minutos em intervalos de 15 (00, 15, 30, 45)');
          input.value = '';
          input.focus();
        }
      }
    });
  });
}

// =============================================
// FUNÇÕES PRINCIPAIS DO MODAL
// =============================================

/**
 * Abre o modal de edição de evento
 * @param {number} index - Índice do evento na viagem
 */
function openEventModal(index) {
  currentEditingIndex = index;
  const modal = document.getElementById('eventModal');
  const trip = JSON.parse(localStorage.getItem('currentTrip')) || [];
  const day = currentTrip[index];
  
  // Preenche os campos com os dados existentes
  document.getElementById('eventDate').value = day.date;
  
  if (trip[index]) {
    // Edição de evento existente
    const event = trip[index];
    document.getElementById('eventTitle').value = event.title || '';
    document.getElementById('eventDeparture').value = event.departure || '';
    document.getElementById('eventArrival').value = event.arrival || '';
    document.getElementById('eventLodging').value = event.lodging || '';
    document.getElementById('eventAddress').value = event.address || '';
    document.getElementById('eventLink').value = event.link || '';
    document.getElementById('eventNotes').value = event.notes || '';
  } else {
    // Novo evento
    document.getElementById('eventTitle').value = document.querySelectorAll('.event-container input')[index].value || '';
    document.getElementById('eventDeparture').value = '';
    document.getElementById('eventArrival').value = '';
    document.getElementById('eventLodging').value = '';
    document.getElementById('eventAddress').value = '';
    document.getElementById('eventLink').value = '';
    document.getElementById('eventNotes').value = '';
  }
  
  // Configura os inputs de tempo
  setupTimeInputs();
  
  // Exibe o modal
  document.body.classList.add('modal-open');
  modal.showModal();
  document.getElementById('eventTitle').focus();
}

/**
 * Manipula o salvamento do evento (com feedback visual)
 */
function handleSave() {
  const btn = document.querySelector('#eventModal button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Salvando...';
  
  if (saveEventDetails()) {
    setTimeout(() => {
      document.getElementById('eventModal').close();
      btn.textContent = 'Salvar';
      btn.disabled = false;
    }, 500);
  }
}

/**
 * Salva os detalhes do evento no localStorage
 * @returns {boolean} True se salvou com sucesso
 */
function saveEventDetails() {
  if (currentEditingIndex === null) return false;
  
  const trip = JSON.parse(localStorage.getItem('currentTrip')) || [];
  
  // Atualiza os dados do evento
  trip[currentEditingIndex] = {
    ...trip[currentEditingIndex],
    title: document.getElementById('eventTitle').value,
    date: document.getElementById('eventDate').value,
    departure: document.getElementById('eventDeparture').value,
    arrival: document.getElementById('eventArrival').value,
    lodging: document.getElementById('eventLodging').value,
    address: document.getElementById('eventAddress').value,
    link: document.getElementById('eventLink').value,
    notes: document.getElementById('eventNotes').value
  };
  
  // Salva no localStorage
  localStorage.setItem('currentTrip', JSON.stringify(trip));
  return true;
}

// =============================================
// EVENT LISTENERS
// =============================================

// Fecha o modal quando clica no backdrop
document.getElementById('eventModal').addEventListener('click', function(e) {
  if (e.target === this) {
    this.close();
    document.body.classList.remove('modal-open');
    currentEditingIndex = null;
  }
});

// Limpa o estado quando o modal é fechado
document.getElementById('eventModal').addEventListener('close', function() {
  document.body.classList.remove('modal-open');
  currentEditingIndex = null;
});