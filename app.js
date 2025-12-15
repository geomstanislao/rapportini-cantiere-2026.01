// File principale dell'applicazione

// Inizializzazione
document.addEventListener('DOMContentLoaded', function() {
    loadAllData();
    updateStats();
});

// Gestione Tab
function showTab(tabName) {
    // Nascondi tutti i tab
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Rimuovi active da tutti i bottoni
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Mostra il tab selezionato
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Attiva il bottone corrispondente
    event.target.classList.add('active');
    
    // Aggiorna la tabella
    updateTable(tabName);
}

// Aggiorna le tabelle
function updateTable(dataType) {
    const data = JSON.parse(localStorage.getItem(`rapportini_${dataType}`)) || [];
    const tableId = `${dataType}-table`;
    const tableBody = document.querySelector(`#${tableId} tbody`);
    
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (data.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: #666;">
                    Nessun dato disponibile. Importa prima i dati da Excel.
                </td>
            </tr>
        `;
        return;
    }
    
    data.forEach(item => {
        const row = tableBody.insertRow();
        
        switch(dataType) {
            case 'operai':
                row.innerHTML = `
                    <td>${item.codice || ''}</td>
                    <td>${item.nome || ''}</td>
                    <td>${item.cognome || ''}</td>
                    <td>${item.qualifica || ''}</td>
                    <td>${item.orario || '08:00-17:00'}</td>
                `;
                break;
                
            case 'mezzi':
                row.innerHTML = `
                    <td>${item.tipo || ''}</td>
                    <td>${item.targa || ''}</td>
                    <td>${item.modello || ''}</td>
                    <td>${item.ore_giornaliere || 8}</td>
                    <td>${item.note || ''}</td>
                `;
                break;
                
            case 'lavorazioni':
                row.innerHTML = `
                    <td>${item.codice || ''}</td>
                    <td>${item.descrizione || ''}</td>
                    <td>${item.unita_misura || 'ore'}</td>
                    <td>€ ${item.costo_orario || 0}</td>
                    <td>${item.categoria || ''}</td>
                `;
                break;
        }
    });
}

// Aggiorna statistiche
function updateStats() {
    const operai = JSON.parse(localStorage.getItem('rapportini_operai')) || [];
    const mezzi = JSON.parse(localStorage.getItem('rapportini_mezzi')) || [];
    const lavorazioni = JSON.parse(localStorage.getItem('rapportini_lavorazioni')) || [];
    
    document.getElementById('operai-count').textContent = operai.length;
    document.getElementById('mezzi-count').textContent = mezzi.length;
    document.getElementById('lavorazioni-count').textContent = lavorazioni.length;
}

// Carica tutti i dati
function loadAllData() {
    ['operai', 'mezzi', 'lavorazioni'].forEach(type => {
        loadDataForType(type);
    });
}

// Carica dati per tipo specifico
function loadDataForType(type) {
    const data = JSON.parse(localStorage.getItem(`rapportini_${type}`)) || [];
    
    // Aggiorna dropdown nei rapportini
    updateDropdowns(type, data);
    
    // Aggiorna tabella
    if (document.querySelector(`#${type}-tab`).classList.contains('active')) {
        updateTable(type);
    }
}

// Aggiorna dropdown
function updateDropdowns(type, data) {
    const dropdownMap = {
        'operai': 'seleziona-operaio',
        'mezzi': 'seleziona-mezzo',
        'lavorazioni': 'seleziona-lavorazione'
    };
    
    const dropdownId = dropdownMap[type];
    const dropdown = document.getElementById(dropdownId);
    
    if (!dropdown) return;
    
    // Salva la selezione corrente
    const currentValue = dropdown.value;
    
    // Pulisci opzioni (mantieni la prima)
    dropdown.innerHTML = `<option value="">Seleziona ${type}...</option>`;
    
    data.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id || item.codice || item.targa;
        
        switch(type) {
            case 'operai':
                option.textContent = `${item.codice} - ${item.nome} ${item.cognome}`;
                break;
            case 'mezzi':
                option.textContent = `${item.targa} - ${item.tipo} (${item.modello})`;
                break;
            case 'lavorazioni':
                option.textContent = `${item.codice} - ${item.descrizione} (€${item.costo_orario}/ora)`;
                break;
        }
        
        dropdown.appendChild(option);
    });
    
    // Ripristina selezione se ancora valida
    if (currentValue && Array.from(dropdown.options).some(opt => opt.value === currentValue)) {
        dropdown.value = currentValue;
    }
}

// Crea rapportino
function creaRapportino() {
    const data = document.getElementById('data-rapportino').value;
    const operaioId = document.getElementById('seleziona-operaio').value;
    const mezzoId = document.getElementById('seleziona-mezzo').value;
    const lavorazioneId = document.getElementById('seleziona-lavorazione').value;
    const ore = document.getElementById('ore-lavorate').value;
    
    if (!data || !operaioId || !mezzoId || !lavorazioneId || !ore) {
        showMessage('Compila tutti i campi!', 'error');
        return;
    }
    
    // Trova i dati completi
    const operai = JSON.parse(localStorage.getItem('rapportini_operai')) || [];
    const mezzi = JSON.parse(localStorage.getItem('rapportini_mezzi')) || [];
    const lavorazioni = JSON.parse(localStorage.getItem('rapportini_lavorazioni')) || [];
    
    const operaio = operai.find(o => (o.id || o.codice) === operaioId);
    const mezzo = mezzi.find(m => (m.id || m.targa) === mezzoId);
    const lavorazione = lavorazioni.find(l => (l.id || l.codice) === lavorazioneId);
    
    if (!operaio || !mezzo || !lavorazione) {
        showMessage('Dati non trovati!', 'error');
        return;
    }
    
    // Crea la riga del rapportino
    const rapportino = {
        id: Date.now(),
        data: data,
        operaio: operaio,
        mezzo: mezzo,
        lavorazione: lavorazione,
        ore: parseFloat(ore),
        costo_totale: parseFloat(ore) * (lavorazione.costo_orario || 0)
    };
    
    // Salva nel localStorage
    let rapportini = JSON.parse(localStorage.getItem('rapportini_giornalieri')) || [];
    rapportini.push(rapportino);
    localStorage.setItem('rapportini_giornalieri', JSON.stringify(rapportini));
    
    // Aggiorna la tabella
    updateRapportinoTable();
    
    showMessage('Rapportino aggiunto!', 'success');
}

// Aggiorna tabella rapportini
function updateRapportinoTable() {
    const tableBody = document.querySelector('#rapportino-table tbody');
    const rapportini = JSON.parse(localStorage.getItem('rapportini_giornalieri')) || [];
    
    tableBody.innerHTML = '';
    
    rapportini.forEach(rapp => {
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>${rapp.operaio.nome} ${rapp.operaio.cognome}</td>
            <td>${rapp.mezzo.targa} (${rapp.mezzo.tipo})</td>
            <td>${rapp.lavorazione.descrizione}</td>
            <td>${rapp.ore} ore</td>
            <td>
                <button onclick="rimuoviRapportino(${rapp.id})" class="btn btn-danger">
                    ❌
                </button>
            </td>
        `;
    });
}

// Rimuovi rapportino
function rimuoviRapportino(id) {
    let rapportini = JSON.parse(localStorage.getItem('rapportini_giornalieri')) || [];
    rapportini = rapportini.filter(r => r.id !== id);
    localStorage.setItem('rapportini_giornalieri', JSON.stringify(rapportini));
    updateRapportinoTable();
    showMessage('Rapportino rimosso!', 'success');
}

// Mostra messaggi
function showMessage(text, type) {
    const statusDiv = document.getElementById('import-status');
    statusDiv.textContent = text;
    statusDiv.className = `status-message ${type}`;
    
    setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.className = 'status-message';
    }, 3000);
}

// Cancella tutti i dati
function clearAllData() {
    if (confirm('Sei sicuro di voler cancellare TUTTI i dati? Questa azione è irreversibile.')) {
        localStorage.clear();
        loadAllData();
        updateStats();
        updateRapportinoTable();
        showMessage('Tutti i dati sono stati cancellati!', 'success');
    }
}

// Esporta rapportino in Excel
function esportaRapportinoExcel() {
    const rapportini = JSON.parse(localStorage.getItem('rapportini_giornalieri')) || [];
    
    if (rapportini.length === 0) {
        showMessage('Nessun rapportino da esportare!', 'warning');
        return;
    }
    
    const data = rapportini.map(r => ({
        'Data': r.data,
        'Operaio': `${r.operaio.nome} ${r.operaio.cognome}`,
        'Codice Operaio': r.operaio.codice,
        'Mezzo': r.mezzo.tipo,
        'Targa': r.mezzo.targa,
        'Lavorazione': r.lavorazione.descrizione,
        'Codice Lavorazione': r.lavorazione.codice,
        'Ore': r.ore,
        'Costo Orario': r.lavorazione.costo_orario,
        'Costo Totale': r.costo_totale
    }));
    
    exportToExcel(data, `rapportino_${new Date().toISOString().split('T')[0]}.xlsx`);
}