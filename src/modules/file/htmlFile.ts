export function readFileText(file: Blob): Promise<string> {
  if (typeof file.text === 'function') {
    return file.text()
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

export function isHtmlFile(file: File): boolean {
  const name = file.name.toLowerCase()
  return file.type === 'text/html' || name.endsWith('.html') || name.endsWith('.htm')
}

export function dataTransferHasFiles(dataTransfer: DataTransfer | null): boolean {
  if (!dataTransfer) return false
  const types = Array.from(dataTransfer.types ?? [])
  if (types.includes('Files')) return true
  if (dataTransfer.files && dataTransfer.files.length > 0) return true
  const items = dataTransfer.items
  if (items) {
    for (let i = 0; i < items.length; i++) {
      if (items[i]?.kind === 'file') return true
    }
  }
  return false
}

function filesFromDataTransfer(dataTransfer: DataTransfer): File[] {
  const collected: File[] = []
  const list = dataTransfer.files
  if (list) {
    for (let i = 0; i < list.length; i++) {
      const file = list.item?.(i) ?? list[i]
      if (file) collected.push(file)
    }
  }
  if (collected.length === 0 && dataTransfer.items) {
    for (let i = 0; i < dataTransfer.items.length; i++) {
      const item = dataTransfer.items[i]
      if (item?.kind !== 'file') continue
      const file = item.getAsFile()
      if (file) collected.push(file)
    }
  }
  return collected
}

export function findDroppedHtmlFile(dataTransfer: DataTransfer | null): File | null {
  if (!dataTransfer) return null
  return filesFromDataTransfer(dataTransfer).find(isHtmlFile) ?? null
}
