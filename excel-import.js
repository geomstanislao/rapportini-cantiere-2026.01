// Gestione importazione/esportazione Excel

// Importa dati da Excel
function importExcelData() {
    const fileInput = document.getElementById('file-input');
    const dataType = document.getElementById('data-type').value;
    const importBtn = document.getElementById('import-btn');
    
    if (!fileInput.files.length) {
        showMessage('Seleziona un file Excel', 'error');
        return;
    }
    
    if (!dataType) {
        showMessage('Seleziona il tipo di dati', 'error');
        return;
    }
    
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    // Mostra loading
    importBtn.innerHTML = '<span class="spinner"></span> Importando...';
    importBtn.disabled = true;
    
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);
            
            if (jsonData.length === 0) {
                showMessage('Il file Excel è vuoto', 'warning');
                importBtn.innerHTML = '📥 Importa Dati';
                importBtn.disabled = false;
                return;
            }
            
            // Processa i dati
            const processedData = processImportedData(jsonData, dataType);
            
            // Valida i dati
            const validationErrors = validateExcelData(processedData, dataType);
            if (validationErrors.length > 0) {
                showMessage(`Errori trovati: ${validationErrors.join(', ')}`, 'error');
                importBtn.innerHTML = '📥 Importa Dati';
                importBtn.disabled = false;
                return;
            }
            
            // Salva i dati
            saveDataToStorage(dataType, processedData);
            
            // Aggiorna UI
            updateUIWithData(dataType, processedData);
            
            // Aggiorna statistiche
            updateStats();
            
            showMessage(`Importati ${processedData.length} ${dataType} con successo!`, 'success');
            
        } catch (error) {
            showMessage(`Errore: ${error.message}`, 'error');
            console.error('Import error:', error);
        } finally {
            importBtn.innerHTML = '📥 Importa Dati';
            importBtn.disabled = false;
        }
    };
    
    reader.onerror = function() {
        showMessage('Errore nella lettura del file', 'error');
        importBtn.innerHTML = '📥 Importa Dati';
        importBtn.disabled = false;
    };
    
    reader.readAsArrayBuffer(file);
}

// Processa i dati importati
function processImportedData(data, type) {
    switch(type) {
        case 'operai':
            return data.map((item, index) => ({
                id: item.id || item.Codice || `OP${(index + 1).toString().padStart(3, '0')}`,
                codice: item.Codice || item.codice || `OP${(index + 1).toString().padStart(3, '0')}`,
                nome: item.Nome || item.nome || '',
                cognome: item.Cognome || item.cognome || '',
                qualifica: item.Qualifica || item.qualifica || 'Operaio',
                orario: item.Orario || item.orario || '08:00-17:00'
            }));
            
        case 'mezzi':
            return data.map((item, index) => ({
                id: item.id || item.Targa || `MZ${(index + 1).toString().padStart(3, '0')}`,
                tipo: item.Tipo || item.tipo || '',
                targa: item.Targa || item.targa || '',
                modello: item.Modello || item.modello || '',
                ore_giornaliere: item['Ore giornaliere'] || item.ore || 8,
                note: item.Note || item.note || ''
            }));
            
        case 'lavorazioni':
            return data.map((item, index) => ({
                id: item.id || item.Codice || `LAV${(index + 1).toString().padStart(3, '0')}`,
                codice: item.Codice || item.codice || `LAV${(index + 1).toString().padStart(3, '0')}`,
                descrizione: item.Descrizione || item.descrizione || '',
                unita_misura: item['Unità di misura'] || item.unita || 'ore',
                costo_orario: parseFloat(item['Costo orario'] || item.costo || 0),
                categoria: item.Categoria || item.categoria || ''
            }));
            
        default:
            return data;
    }
}

// Valida i dati
function validateExcelData(data, type) {
    const errors = [];
    
    data.forEach((item, index) => {
        const rowNum = index + 2; // +2 perché Excel inizia da 1 e la prima riga è l'header
        
        switch(type) {
            case 'operai':
                if (!item.nome || !item.cognome) {
                    errors.push(`Riga ${rowNum}: Nome e Cognome sono obbligatori`);
                }
                break;
                
            case 'mezzi':
                if (!item.targa) {
                    errors.push(`Riga ${rowNum}: Targa è obbligatoria`);
                }
                if (!item.tipo) {
                    errors.push(`Riga ${rowNum}: Tipo è obbligatorio`);
                }
                break;
                
            case 'lavorazioni':
                if (!item.codice) {
                    errors.push(`Riga ${rowNum}: Codice è obbligatorio`);
                }
                if (!item.descrizione) {
                    errors.push(`Riga ${rowNum}: Descrizione è obbligatoria`);
                }
                break;
        }
    });
    
    return errors;
}

// Salva dati in storage
function saveDataToStorage(type, data) {
    localStorage.setItem(`rapportini_${type}`, JSON.stringify(data));
}

// Aggiorna UI con i dati
function updateUIWithData(type, data) {
    // Aggiorna dropdown
    updateDropdowns(type, data);
    
    // Aggiorna tabella se attiva
    if (document.querySelector(`#${type}-tab`).classList.contains('active')) {
        updateTable(type);
    }
}

// Scarica template
function downloadTemplate(type) {
    let templateData = [];
    let fileName = '';
    let sheetName = '';
    
    switch(type) {
        case 'operai':
            templateData = [
                {
                    'Codice': 'OP001',
                    'Nome': 'Mario',
                    'Cognome': 'Rossi',
                    'Qualifica': 'Operaio Specializzato',
                    'Orario': '08:00-17:00'
                },
                {
                    'Codice': 'OP002',
                    'Nome': 'Luigi',
                    'Cognome': 'Verdi',
                    'Qualifica': 'Operaio',
                    'Orario': '08:00-17:00'
                }
            ];
            fileName = 'template_operai.xlsx';
            sheetName = 'Operai';
            break;
            
        case 'mezzi':
            templateData = [
                {
                    'Tipo': 'Escavatore',
                    'Targa': 'AB123CD',
                    'Modello': 'CAT 320',
                    'Ore giornaliere': 8,
                    'Note': 'In ottime condizioni'
                },
                {
                    'Tipo': 'Autocarro',
                    'Targa': 'EF456GH',
                    'Modello': 'IVECO',
                    'Ore giornaliere': 8,
                    'Note': 'Revisione annuale in corso'
                }
            ];
            fileName = 'template_mezzi.xlsx';
            sheetName = 'Mezzi';
            break;
            
        case 'lavorazioni':
            templateData = [
                {
                    'Codice': 'LAV001',
                    'Descrizione': 'Scavo manuale',
                    'Unità di misura': 'ore',
                    'Costo orario': 45.00,
                    'Categoria': 'Scavi'
                },
                {
                    'Codice': 'LAV002',
                    'Descrizione': 'Trasporto materiale',
                    'Unità di misura': 'ore',
                    'Costo orario': 35.00,
                    'Categoria': 'Trasporti'
                }
            ];
            fileName = 'template_lavorazioni.xlsx';
            sheetName = 'Lavorazioni';
            break;
    }
    
    exportToExcel(templateData, fileName, sheetName);
    showMessage(`Template ${type} scaricato!`, 'success');
}

// Esporta dati in Excel
function exportData(type) {
    const data = JSON.parse(localStorage.getItem(`rapportini_${type}`)) || [];
    
    if (data.length === 0) {
        showMessage(`Nessun dato ${type} da esportare`, 'warning');
        return;
    }
    
    // Converti dati per l'esportazione
    let exportData = [];
    
    switch(type) {
        case 'operai':
            exportData = data.map(item => ({
                'Codice': item.codice,
                'Nome': item.nome,
                'Cognome': item.cognome,
                'Qualifica': item.qualifica,
                'Orario': item.orario
            }));
            break;
            
        case 'mezzi':
            exportData = data.map(item => ({
                'Tipo': item.tipo,
                'Targa': item.targa,
                'Modello': item.modello,
                'Ore giornaliere': item.ore_giornaliere,
                'Note': item.note
            }));
            break;
            
        case 'lavorazioni':
            exportData = data.map(item => ({
                'Codice': item.codice,
                'Descrizione': item.descrizione,
                'Unità di misura': item.unita_misura,
                'Costo orario': item.costo_orario,
                'Categoria': item.categoria
            }));
            break;
    }
    
    const fileName = `esportazione_${type}_${new Date().toISOString().split('T')[0]}.xlsx`;
    exportToExcel(exportData, fileName, type.charAt(0).toUpperCase() + type.slice(1));
    showMessage(`${type.charAt(0).toUpperCase() + type.slice(1)} esportati con successo!`, 'success');
}

// Funzione generica per esportare in Excel
function exportToExcel(data, fileName, sheetName = 'Dati') {
    try {
        // Crea workbook
        const wb = XLSX.utils.book_new();
        
        // Crea worksheet
        const ws = XLSX.utils.json_to_sheet(data);
        
        // Aggiungi formattazione
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const address = XLSX.utils.encode_cell({r: 0, c: C});
            if (!ws[address]) continue;
            ws[address].s = {
                font: { bold: true },
                fill: { fgColor: { rgb: "4472C4" } },
                alignment: { horizontal: "center" },
                color: { rgb: "FFFFFF" }
            };
        }
        
        // Imposta larghezza colonne
        const colWidths = Object.keys(data[0] || {}).map(key => ({
            wch: Math.max(key.length, ...data.map(row => String(row[key] || '').length))
        }));
        ws['!cols'] = colWidths;
        
        // Aggiungi worksheet al workbook
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        
        // Esporta file
        XLSX.writeFile(wb, fileName);
        
    } catch (error) {
        showMessage(`Errore nell'esportazione: ${error.message}`, 'error');
        console.error('Export error:', error);
    }
}