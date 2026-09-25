(() => {
  'use strict';
  const KEY = 'carpetas.archivo.v1';
  const COLORS = { amarillo: ['Amarillo', '#e5be55'], verde: ['Verde', '#89ac79'], azul: ['Azul', '#7da8d3'], rojo: ['Rojo', '#d97b70'], naranja: ['Naranja', '#dfa569'], violeta: ['Violeta', '#ad93c7'], rosa: ['Rosa', '#dba0b8'], blanco: ['Blanco', '#e6e6df'], negro: ['Negro', '#52605b'], marron: ['Marrón', '#ac8968'] };
  const $ = id => document.getElementById(id);
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
  const uid = () => globalThis.crypto?.randomUUID?.() || `folder-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const element = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
  const ICONS = {
    search: 'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
    plus: 'M12 5v14M5 12h14',
    edit: 'M14 5l5 5M4 20l5-1L21 7a2.8 2.8 0 0 0-4-4L5 15z',
    trash: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7',
    close: 'M6 6l12 12M18 6L6 18',
    shelf: 'M3 3h18v18H3zM12 3v18M3 9h18M3 15h18',
    download: 'M12 3v12M7 10l5 5 5-5M4 16v5h16v-5',
    upload: 'M12 15V3M7 8l5-5 5 5M4 16v5h16v-5',
    archive: 'M3 3h18v5H3zM5 8v13h14V8M10 12h4'
  };
  function uiIcon(name) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    for (const [key,value] of Object.entries({viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':'1.7','stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true',focusable:'false',class:'ui-icon'})) svg.setAttribute(key,value);
    const path = document.createElementNS(svg.namespaceURI, 'path'); path.setAttribute('d', ICONS[name]); svg.append(path); return svg;
  }
  function highlightedName(name) {
    const heading = element('h3'), positions = [], ranges = [];
    let folded = '';
    for (const {segment,index} of new Intl.Segmenter('es', {granularity:'grapheme'}).segment(name)) {
      const normalized = normalize(segment);
      for (let i = 0; i < normalized.length; i++) positions.push([index,index + segment.length]);
      folded += normalized;
    }
    for (const word of new Set(normalize($('search').value).trim().split(/\s+/).filter(Boolean))) {
      for (let start = folded.indexOf(word); start !== -1; start = folded.indexOf(word,start + 1)) ranges.push([positions[start][0],positions[start + word.length - 1][1]]);
    }
    ranges.sort((a,b) => a[0] - b[0]);
    const merged = [];
    for (const range of ranges) { const last = merged[merged.length - 1]; if (last && range[0] <= last[1]) last[1] = Math.max(last[1],range[1]); else merged.push([...range]); }
    let cursor = 0;
    for (const [start,end] of merged) { heading.append(document.createTextNode(name.slice(cursor,start)),element('mark','search-highlight',name.slice(start,end))); cursor = end; }
    heading.append(document.createTextNode(name.slice(cursor))); return heading;
  }
  for (const [id,name,label] of [['add-folder','plus','Nueva carpeta'],['export','download','Exportar'],['import','upload','Importar'],['close-form','close',''],['close-import','close',''],['dismiss-toast','close','']]) {
    $(id).replaceChildren(uiIcon(name),document.createTextNode(label));
  }
  document.querySelector('.search-field > span').replaceChildren(uiIcon('search'));
  document.querySelector('.shelf-panel .section-heading > span').replaceChildren(uiIcon('shelf'));
  document.querySelector('.backup-icon').replaceChildren(uiIcon('archive'));
  let folders = [], editingId = null, deletingId = null, pendingImport = null, undoRecord = null, storageBlocked = false;

  function validate(data) {
    if (!Array.isArray(data) && (!data || data.version !== 1)) throw new Error('La versión del archivo no es compatible. Usá un respaldo de versión 1.');
    const rows = Array.isArray(data) ? data : data.carpetas;
    if (!Array.isArray(rows)) throw new Error('El JSON debe contener una lista de carpetas. Consultá ejemplo.json.');
    const ids = new Set();
    return rows.map((row, i) => {
      if (!row || typeof row.nombre !== 'string' || !row.nombre.trim() || !Object.hasOwn(COLORS, row.color) || ![1,2].includes(row.columna) || ![1,2,3].includes(row.fila)) throw new Error(`La carpeta ${i + 1} tiene datos inválidos: revisá nombre, color, columna y fila.`);
      const id = typeof row.id === 'string' && row.id.trim() ? row.id : uid();
      if (ids.has(id)) throw new Error(`La carpeta ${i + 1} repite un identificador. Los nombres sí pueden repetirse.`);
      ids.add(id);
      return { id, nombre: row.nombre.trim(), color: row.color, columna: row.columna, fila: row.fila, creado: typeof row.creado === 'string' && Number.isFinite(Date.parse(row.creado)) ? row.creado : new Date().toISOString() };
    });
  }
  function notify(message, undo = false) { $('toast-message').textContent = message; $('undo').hidden = !undo; $('toast').hidden = false; }
  function save(next) {
    if (storageBlocked) { notify('El archivo guardado no se pudo leer. Exportá una copia e importá un respaldo válido para recuperarlo.'); return false; }
    try { localStorage.setItem(KEY, JSON.stringify({ version: 1, carpetas: next })); }
    catch { $('storage-status').textContent = '⚠ No se pudo guardar'; notify('No se pudo guardar. Revisá el espacio y los permisos del navegador. Tus cambios anteriores siguen disponibles.'); return false; }
    folders = next; $('storage-status').textContent = '● Guardado en este dispositivo'; render(); return true;
  }
  function filtered() {
    const words = normalize($('search').value).trim().split(/\s+/).filter(Boolean);
    return folders.filter(folder => words.every(word => normalize(folder.nombre).includes(word)) && (!$('filter-color').value || folder.color === $('filter-color').value) && (!$('filter-column').value || folder.columna === +$('filter-column').value) && (!$('filter-row').value || folder.fila === +$('filter-row').value)).sort((a,b) => $('sort').value === 'recent' ? Date.parse(b.creado) - Date.parse(a.creado) : $('sort').value === 'location' ? a.columna - b.columna || a.fila - b.fila || a.nombre.localeCompare(b.nombre, 'es') : a.nombre.localeCompare(b.nombre, 'es'));
  }
  function resetFilters() { for (const id of ['search','filter-color','filter-column','filter-row']) $(id).value = ''; render(); }
  function setLocation(column, row) { const same = $('filter-column').value === String(column) && $('filter-row').value === String(row); $('filter-column').value = same ? '' : column; $('filter-row').value = same ? '' : row; render(); }
  function render() {
    const visible = filtered();
    const searching = $('search').value.trim().length > 0;
    $('total').textContent = folders.length;
    $('result-count').textContent = `${visible.length} ${visible.length === 1 ? 'carpeta' : 'carpetas'}${visible.length !== folders.length ? ` de ${folders.length}` : ' en tu archivo'}`;
    $('results').replaceChildren();
    if (!visible.length) {
      const empty = element('div', 'empty'); empty.append(element('span','folder-icon empty-art'), element('h3','', folders.length ? 'No encontramos esa carpeta' : 'Todo empieza con una carpeta'), element('p','', folders.length ? 'Probá con menos palabras o cambiá los filtros para ampliar la búsqueda.' : 'Agregá su nombre, elegí un color y marcá su lugar. La próxima vez, encontrarla será mucho más fácil.'));
      const button = element('button','primary',folders.length ? 'Limpiar búsqueda' : 'Agregar mi primera carpeta'); if (!folders.length) button.prepend(uiIcon('plus')); button.onclick = folders.length ? resetFilters : () => openForm(); empty.append(button); $('results').append(empty);
    }
    for (const folder of visible) {
      const card = element('article','card');
      const top = element('div','card-top'), icon = element('span','folder-icon'); icon.style.setProperty('--folder-color', COLORS[folder.color][1]); icon.setAttribute('aria-hidden','true');
      top.append(icon, element('span','color-tag',COLORS[folder.color][0]));
      const bottom = element('div','card-bottom'), location = element('button','location-button');
      location.append(uiIcon('shelf'),element('span','',`Columna ${folder.columna} · Fila ${folder.fila}`));
      location.setAttribute('aria-label', `Filtrar por columna ${folder.columna}, fila ${folder.fila}`); location.onclick = () => setLocation(folder.columna, folder.fila);
      const actions = element('div','card-actions'), edit = element('button','icon-button'), remove = element('button','icon-button');
      edit.append(uiIcon('edit')); remove.append(uiIcon('trash'));
      edit.setAttribute('aria-label',`Editar ${folder.nombre}`); edit.title = 'Editar carpeta'; edit.onclick = () => openForm(folder);
      remove.setAttribute('aria-label',`Eliminar ${folder.nombre}`); remove.title = 'Eliminar carpeta'; remove.onclick = () => { deletingId = folder.id; $('delete-name').textContent = folder.nombre; $('delete-dialog').showModal(); $('cancel-delete').focus(); };
      actions.append(edit, remove); bottom.append(location, actions); card.append(top,highlightedName(folder.nombre),bottom); $('results').append(card);
    }
    $('shelf').replaceChildren();
    for (let row = 3; row >= 1; row--) {
      $('shelf').append(element('span','row-label',`Fila ${row}`));
      for (let column = 1; column <= 2; column++) {
        const all = folders.filter(f => f.columna === column && f.fila === row), matching = visible.filter(f => f.columna === column && f.fila === row);
        const cell = element('button','shelf-cell'), mini = element('span','mini-folders');
        cell.classList.toggle('search-match', searching && matching.length > 0);
        for (const folder of all.slice(0,8)) { const bar = element('span','mini-folder'); bar.style.setProperty('--folder-color', COLORS[folder.color][1]); mini.append(bar); }
        if (!all.length) mini.append(element('span','mini-placeholder','—'));
        cell.append(mini, element('span','',all.length ? `${matching.length}/${all.length} carpetas` : 'Sin carpetas'));
        cell.setAttribute('aria-label', `Columna ${column}, fila ${row}: ${all.length} carpetas, ${matching.length} coinciden`);
        cell.setAttribute('aria-pressed', String($('filter-column').value === String(column) && $('filter-row').value === String(row)));
        cell.onclick = () => setLocation(column,row); $('shelf').append(cell);
      }
    }
  }
  function openForm(folder) {
    editingId = folder?.id || null; $('folder-form').reset(); $('form-error').textContent = '';
    $('form-title').textContent = folder ? 'Editar carpeta' : 'Nueva carpeta'; $('folder-name').value = folder?.nombre || '';
    document.querySelector(`input[name="color"][value="${folder?.color || 'amarillo'}"]`).checked = true;
    $('folder-column').value = folder?.columna || $('filter-column').value || 1; $('folder-row').value = folder?.fila || $('filter-row').value || 1;
    $('folder-dialog').showModal(); $('folder-name').focus();
  }
  for (const [value,[name,hex]] of Object.entries(COLORS)) {
    const option = element('option','',name); option.value = value; $('filter-color').append(option);
    const label = element('label','color-choice'), input = element('input'), span = element('span'), dot = element('i'); input.type = 'radio'; input.name = 'color'; input.value = value; input.required = true; dot.style.setProperty('--folder-color',hex); dot.setAttribute('aria-hidden','true'); span.append(dot,document.createTextNode(name)); label.append(input,span); $('color-options').append(label);
  }
  $('folder-form').onsubmit = event => {
    event.preventDefault(); const nombre = $('folder-name').value.trim(); if (!nombre) { $('form-error').textContent = 'Escribí un nombre para la carpeta.'; $('folder-name').focus(); return; }
    const folder = { id: editingId || uid(), nombre, color: document.querySelector('input[name="color"]:checked').value, columna: +$('folder-column').value, fila: +$('folder-row').value, creado: folders.find(f => f.id === editingId)?.creado || new Date().toISOString() };
    const next = editingId ? folders.map(f => f.id === editingId ? folder : f) : [...folders,folder];
    if (save(next)) { $('folder-dialog').close(); resetFilters(); notify(editingId ? 'Carpeta actualizada.' : 'Carpeta agregada. Ya tiene su lugar.'); }
  };
  $('add-folder').onclick = () => openForm();
  for (const id of ['close-form','cancel-form']) $(id).onclick = () => $('folder-dialog').close();
  for (const id of ['search','filter-color','filter-column','filter-row','sort']) $(id).addEventListener('input',render);
  $('clear-filters').onclick = resetFilters;
  $('cancel-delete').onclick = () => $('delete-dialog').close();
  $('confirm-delete').onclick = () => { const removed = folders.find(f => f.id === deletingId); if (removed && save(folders.filter(f => f.id !== deletingId))) { undoRecord = removed; $('delete-dialog').close(); notify('Carpeta eliminada.',true); } };
  $('undo').onclick = () => { if (undoRecord && !folders.some(f => f.id === undoRecord.id) && save([...folders,undoRecord])) { undoRecord = null; notify('Carpeta recuperada.'); } };
  $('dismiss-toast').onclick = () => { $('toast').hidden = true; };
  $('export').onclick = () => {
    const data = storageBlocked ? localStorage.getItem(KEY) : JSON.stringify({version:1,exportado:new Date().toISOString(),carpetas:folders},null,2);
    const url = URL.createObjectURL(new Blob([data],{type:'application/json'})), link = element('a'); link.href = url; link.download = `carpetas-${new Date().toISOString().slice(0,10)}${storageBlocked ? '-recuperacion' : ''}.json`; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url),1000); notify('Se descargó una copia de tu archivo.');
  };
  $('import').onclick = () => $('import-file').click();
  $('import-file').onchange = async event => {
    const file = event.target.files[0]; if (!file) return;
    try { if (file.size > 10 * 1024 * 1024) throw new Error('El archivo supera el máximo de 10 MB.'); pendingImport = validate(JSON.parse(await file.text())); $('import-summary').textContent = `${file.name}: ${pendingImport.length} carpetas listas para importar.`; $('import-error').textContent = ''; $('import-dialog').showModal(); }
    catch (error) { pendingImport = null; notify(error instanceof SyntaxError ? 'El archivo no contiene JSON válido. No se modificó tu archivo.' : error.message); }
    finally { event.target.value = ''; }
  };
  $('close-import').onclick = () => $('import-dialog').close();
  function importFolders(replace) {
    if (!pendingImport) return;
    if (storageBlocked && !replace) { $('import-error').textContent = 'El archivo actual no se pudo leer. Exportá una copia de recuperación y elegí Reemplazar todo.'; return; }
    const ids = new Set(folders.map(f => f.id)), added = pendingImport.filter(f => !ids.has(f.id)); const next = replace ? pendingImport : [...folders,...added];
    const blockedBefore = storageBlocked; storageBlocked = false;
    if (save(next)) { undoRecord = null; $('import-dialog').close(); notify(replace ? `Archivo reemplazado: ${next.length} carpetas.` : `${added.length} carpetas agregadas; ${pendingImport.length - added.length} ya existían.`); pendingImport = null; resetFilters(); } else storageBlocked = blockedBefore;
  }
  $('merge-import').onclick = () => importFolders(false); $('replace-import').onclick = () => importFolders(true);
  document.addEventListener('keydown', event => { if (event.key === '/' && !event.ctrlKey && !event.metaKey && !document.querySelector('dialog[open]') && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) { event.preventDefault(); $('search').focus(); } });
  function load() { try { const raw = localStorage.getItem(KEY); folders = raw === null ? [] : validate(JSON.parse(raw)); storageBlocked = false; } catch { storageBlocked = true; $('storage-status').textContent = '⚠ Revisar almacenamiento'; notify('No se pudieron leer los datos guardados. No se sobrescribirán. Importá un respaldo válido para recuperarlos.'); } render(); }
  window.addEventListener('storage', event => { if (event.key === KEY || event.key === null) { for (const dialog of document.querySelectorAll('dialog[open]')) dialog.close(); undoRecord = null; load(); if (!storageBlocked) notify('Archivo actualizado desde otra pestaña.'); } });
  load();
})();
