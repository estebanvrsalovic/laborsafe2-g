# Tipificador DT — instrucciones para importar la base de conocimiento

Este archivo explica cómo convertir `docs/tipificador_base_conocimiento.docx` (original Word con 1.283 registros) a un JSON consumible por la UI (`docs/tipificador.json`).

Pasos recomendados (local):

1. Instale python y la librería `python-docx` y `pandoc` si desea otras opciones.

```bash
python -m pip install python-docx
```

2. Ejemplo de script rápido (guardar como `scripts/parse_tipificador.py`) — este es un punto de partida: adapte la extracción según la estructura real del docx.

```python
from docx import Document
import json

doc = Document('docs/tipificador_base_conocimiento.docx')
records = []
current = {}

for p in doc.paragraphs:
    text = p.text.strip()
    if not text:
        continue
    # Ejemplo: si cada registro empieza con "CÓDIGO: <n>" o similar, parsear aquí
    if text.startswith('CÓDIGO') or text.startswith('Código'):
        if current:
            records.append(current)
        current = {'raw': text}
    else:
        # agregar a tipificacion o enunciado según corresponda
        current['raw'] = current.get('raw', '') + '\n' + text

if current:
    records.append(current)

with open('docs/tipificador.json', 'w', encoding='utf-8') as f:
    json.dump(records, f, ensure_ascii=False, indent=2)

print('Wrote', len(records), 'records to docs/tipificador.json')
```

3. Coloque el archivo `docs/tipificador.json` en la carpeta `docs/` del repositorio. La UI (`/tipificador`) intentará cargar `/api/tipificador` y devolverá esa JSON.

Notas:
- El script anterior es un ejemplo mínimo. La extracción correcta requiere inspeccionar la estructura real del docx (tablas, títulos, estilos). Ajuste la lógica para mapear a los campos: `codigo`, `norma`, `enunciado`, `tipificacion`, `naturaleza`, `monto_multa`, `utm`.
- Si prefiere, genere el JSON fuera del repo y cárguelo manualmente en `docs/tipificador.json`.

Si quiere, puedo crear el script de parsing más avanzado si compartes una porción representativa del `tipificador_base_conocimiento.docx` (por ejemplo, las primeras 2-3 entradas en bruto).
