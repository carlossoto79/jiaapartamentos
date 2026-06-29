import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { Upload, ClipboardPaste, X, CheckCircle2, AlertCircle, FileText } from 'lucide-react'
import '../styles/import.css'

const EXPECTED_COLUMNS = ['unit_number', 'building', 'floor', 'address', 'notes']
const HEADER_TOKENS = ['unit_number', 'numero', 'número', 'unidad', 'apartamento', 'building', 'edificio', 'floor', 'piso', 'address', 'direccion', 'dirección', 'notes', 'notas']

// Split a single line on tab OR comma, trimming each cell.
function splitLine(line) {
  const sep = line.includes('\t') ? '\t' : ','
  return line.split(sep).map(c => c.trim().replace(/^"(.*)"$/, '$1'))
}

// Decide whether the first row looks like a header.
function looksLikeHeader(cells) {
  const joined = cells.join(' ').toLowerCase()
  const hasToken = HEADER_TOKENS.some(t => joined.includes(t))
  const floorIsNumber = cells[2] !== undefined && cells[2] !== '' && !isNaN(Number(cells[2]))
  // If it mentions header words and the "floor" cell isn't numeric, treat as header.
  return hasToken && !floorIsNumber
}

function parseRows(text) {
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0)

  if (lines.length === 0) return { rows: [], skippedHeader: false }

  let startIndex = 0
  let skippedHeader = false
  const firstCells = splitLine(lines[0])
  if (looksLikeHeader(firstCells)) {
    startIndex = 1
    skippedHeader = true
  }

  const rows = []
  for (let i = startIndex; i < lines.length; i++) {
    const cells = splitLine(lines[i])
    const [unit_number = '', building = '', floor = '', address = '', notes = ''] = cells
    const errors = []

    if (!unit_number) errors.push('Falta el número de apartamento')
    if (!building) errors.push('Falta el edificio')
    if (floor === '') {
      errors.push('Falta el piso')
    } else if (isNaN(parseInt(floor, 10))) {
      errors.push('El piso debe ser un número')
    }
    if (!address) errors.push('Falta la dirección')

    rows.push({
      lineNumber: i + 1,
      unit_number,
      building,
      floor,
      address,
      notes,
      errors
    })
  }

  return { rows, skippedHeader }
}

export default function BulkImportUnits({ onClose, onImported }) {
  const [rawText, setRawText] = useState('')
  const [rows, setRows] = useState([])
  const [skippedHeader, setSkippedHeader] = useState(false)
  const [parsed, setParsed] = useState(false)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const validRows = rows.filter(r => r.errors.length === 0)
  const invalidRows = rows.filter(r => r.errors.length > 0)

  const handleParse = (text) => {
    setError(null)
    setResult(null)
    const { rows: parsedRows, skippedHeader: skipped } = parseRows(text)
    setRows(parsedRows)
    setSkippedHeader(skipped)
    setParsed(true)
  }

  const handleTextChange = (e) => {
    setRawText(e.target.value)
    setParsed(false)
    setRows([])
  }

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target.result
      setRawText(text)
      handleParse(text)
    }
    reader.onerror = () => setError('No se pudo leer el archivo')
    reader.readAsText(file)
    // reset so the same file can be re-selected
    e.target.value = ''
  }

  const handleImport = async () => {
    if (validRows.length === 0) return
    setImporting(true)
    setError(null)
    try {
      const payload = validRows.map(r => ({
        unit_number: r.unit_number,
        building: r.building,
        floor: parseInt(r.floor, 10),
        address: r.address,
        notes: r.notes || null
      }))

      const { data, error: err } = await supabase
        .from('units')
        .insert(payload)
        .select()

      if (err) throw err

      setResult({ inserted: data?.length || 0 })
      if (onImported) onImported()
    } catch (err) {
      setError(err.message || 'Error al importar los apartamentos')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="import-overlay" onClick={onClose}>
      <div className="import-modal" onClick={(e) => e.stopPropagation()}>
        <div className="import-header">
          <h2>Importar apartamentos</h2>
          <button className="btn-close" onClick={onClose} aria-label="Cerrar">
            <X size={22} />
          </button>
        </div>

        {result ? (
          <div className="import-success">
            <CheckCircle2 size={40} />
            <p><strong>{result.inserted}</strong> apartamento{result.inserted !== 1 ? 's' : ''} importado{result.inserted !== 1 ? 's' : ''} correctamente.</p>
            <button className="btn-primary" onClick={onClose}>Listo</button>
          </div>
        ) : (
          <>
            <div className="import-instructions">
              <p>
                Pega las filas o sube un archivo CSV con las columnas en este orden:
              </p>
              <code>número de apartamento, edificio, piso, dirección, notas</code>
              <p className="import-hint">
                Las notas son opcionales. La primera fila puede ser un encabezado (se detecta y omite automáticamente). Puedes pegar directamente desde Excel o Google Sheets.
              </p>
            </div>

            <div className="import-input-row">
              <button
                className="btn-secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={16} /> Subir CSV
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,text/csv"
                onChange={handleFile}
                style={{ display: 'none' }}
              />
              <span className="import-or">o pega abajo</span>
            </div>

            <textarea
              className="import-textarea"
              value={rawText}
              onChange={handleTextChange}
              placeholder={'4B, Edificio Norte, 4, Calle 10 #43-22, Calentador nuevo 2024\n7C, Edificio Sur, 7, Carrera 5 #12-30\n101, Edificio Maruja, 1, Avenida Las Palmas #8-15'}
              rows={7}
            />

            <div className="import-actions-row">
              <button
                className="btn-secondary"
                onClick={() => handleParse(rawText)}
                disabled={!rawText.trim()}
              >
                <ClipboardPaste size={16} /> Previsualizar
              </button>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {parsed && rows.length > 0 && (
              <div className="import-preview">
                <div className="import-summary">
                  <span className="import-count valid">
                    <CheckCircle2 size={15} /> {validRows.length} válido{validRows.length !== 1 ? 's' : ''}
                  </span>
                  {invalidRows.length > 0 && (
                    <span className="import-count invalid">
                      <AlertCircle size={15} /> {invalidRows.length} con errores
                    </span>
                  )}
                  {skippedHeader && (
                    <span className="import-count note">
                      <FileText size={15} /> encabezado omitido
                    </span>
                  )}
                </div>

                <div className="import-table-wrap">
                  <table className="import-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Apartamento</th>
                        <th>Edificio</th>
                        <th>Piso</th>
                        <th>Dirección</th>
                        <th>Notas</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, idx) => (
                        <tr key={idx} className={r.errors.length ? 'row-error' : ''}>
                          <td className="muted">{idx + 1}</td>
                          <td>{r.unit_number || <span className="muted">—</span>}</td>
                          <td>{r.building || <span className="muted">—</span>}</td>
                          <td>{r.floor || <span className="muted">—</span>}</td>
                          <td>{r.address || <span className="muted">—</span>}</td>
                          <td>{r.notes || <span className="muted">—</span>}</td>
                          <td className="cell-status">
                            {r.errors.length === 0 ? (
                              <CheckCircle2 size={15} className="ok" />
                            ) : (
                              <span className="row-error-text" title={r.errors.join('; ')}>
                                {r.errors.join('; ')}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {invalidRows.length > 0 && (
                  <p className="import-hint">
                    Solo se importarán las filas válidas. Corrige las filas con errores y vuelve a previsualizar si quieres incluirlas.
                  </p>
                )}

                <div className="import-confirm">
                  <button className="btn-secondary" onClick={onClose}>Cancelar</button>
                  <button
                    className="btn-primary"
                    onClick={handleImport}
                    disabled={validRows.length === 0 || importing}
                  >
                    {importing
                      ? 'Importando...'
                      : `Importar ${validRows.length} apartamento${validRows.length !== 1 ? 's' : ''}`}
                  </button>
                </div>
              </div>
            )}

            {parsed && rows.length === 0 && (
              <div className="alert alert-warning">No se encontraron filas para importar.</div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
