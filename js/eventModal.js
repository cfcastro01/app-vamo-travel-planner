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
 * ABRE O MODAL DO EVENTO
 * @param {number} index - Índice do evento na viagem
 */
function openEventModal(index) {
  currentEditingIndex = index;
  const modal = document.getElementById('eventModal');
  const day = currentTrip[index];
  
  // Preenche os campos básicos
  document.getElementById('eventDate').value = day.date;
  document.getElementById('eventTitle').value = day.location || '';
  
  // Busca detalhes do localStorage ou do próprio objeto day
  const savedEvents = JSON.parse(localStorage.getItem('currentTrip')) || [];
  const eventDetails = savedEvents[index] || day;
  
  // Preenche os campos detalhados
  document.getElementById('eventDeparture').value = eventDetails.departure || '';
  document.getElementById('eventArrival').value = eventDetails.arrival || '';
  document.getElementById('eventLodging').value = eventDetails.lodging || '';
  document.getElementById('eventAddress').value = eventDetails.address || '';
  document.getElementById('eventLink').value = eventDetails.link || '';
  document.getElementById('eventNotes').value = eventDetails.notes || '';
  
  setupTimeInputs();
  document.body.classList.add('modal-open');
  modal.showModal();
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
  
  const savedEvents = JSON.parse(localStorage.getItem('currentTrip')) || [];
  const title = document.getElementById('eventTitle').value;
  
  // Atualiza o objeto completo no currentTrip
  currentTrip[currentEditingIndex] = {
      ...currentTrip[currentEditingIndex],
      location: title,
      title: title,
      departure: document.getElementById('eventDeparture').value,
      arrival: document.getElementById('eventArrival').value,
      lodging: document.getElementById('eventLodging').value,
      address: document.getElementById('eventAddress').value,
      link: document.getElementById('eventLink').value,
      notes: document.getElementById('eventNotes').value
  };
  
  // Atualiza o input visível
  document.querySelectorAll('.event-container input')[currentEditingIndex].value = title;
  
  // Atualiza os detalhes no localStorage
  savedEvents[currentEditingIndex] = currentTrip[currentEditingIndex];
  localStorage.setItem('currentTrip', JSON.stringify(savedEvents));
  
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

// Adicionar nova atração
// function addAttractionField() {
//   const container = document.querySelector('.attraction-container');
//   if (!container) return;

//   const newItem = document.createElement('div');
//   newItem.className = 'row-half-unequal attraction-item';
//   newItem.innerHTML = `
//     <label>
//       Atração:
//       <input type="text" class="attractionName">
//     </label>
//     <label>
//       Valor (R$):
//       <input type="number" class="attractionPrice input-valor" min="0" step="50" placeholder="0">
//     </label>
//   `;
  
//   container.appendChild(newItem);
// }

// Remover última atração (funciona sempre)
// function removeLastAttraction() {
//   const container = document.querySelector('.attraction-container');
//   const items = container?.querySelectorAll('.attraction-item');
  
//   if (items && items.length > 0) {
//     items[items.length - 1].remove();
//   }
// }

