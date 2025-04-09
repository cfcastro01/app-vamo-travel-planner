// Variável global para controlar o evento sendo editado
let currentEditingIndex = null;

function openEventModal(index) {
  currentEditingIndex = index;
  const modal = document.getElementById('eventModal');
  const trip = JSON.parse(localStorage.getItem('currentTrip')) || [];
  const day = currentTrip[index];
  
  document.getElementById('eventDate').value = day.date;
  
  if (trip[index]) {
    const event = trip[index];
    document.getElementById('eventTitle').value = event.title || '';
    document.getElementById('eventDeparture').value = event.departure || '';
    document.getElementById('eventArrival').value = event.arrival || '';
    document.getElementById('eventLodging').value = event.lodging || '';
    document.getElementById('eventAddress').value = event.address || '';
    document.getElementById('eventLink').value = event.link || '';
    document.getElementById('eventNotes').value = event.notes || '';
  } else {
    document.getElementById('eventTitle').value = document.querySelectorAll('.event-container input')[index].value || '';
    document.getElementById('eventDeparture').value = '';
    document.getElementById('eventArrival').value = '';
    document.getElementById('eventLodging').value = '';
    document.getElementById('eventAddress').value = '';
    document.getElementById('eventLink').value = '';
    document.getElementById('eventNotes').value = '';
  }
  
  document.body.classList.add('modal-open');
  modal.showModal();
  document.getElementById('eventTitle').focus();
}

function handleSave() {
  if (saveEventDetails()) {
    document.getElementById('eventModal').close();
  }
}

function saveEventDetails() {
  if (currentEditingIndex === null) return false;
  
  const trip = JSON.parse(localStorage.getItem('currentTrip')) || [];
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
  
  localStorage.setItem('currentTrip', JSON.stringify(trip));
  return true;
}

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

// Listeners para o modal
document.getElementById('eventModal').addEventListener('close', function() {
  document.body.classList.remove('modal-open');
  currentEditingIndex = null;
});

document.getElementById('eventModal').addEventListener('click', function(e) {
  if (e.target === this) {
    this.close();
    document.body.classList.remove('modal-open');
    currentEditingIndex = null;
  }
});