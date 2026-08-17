export function isTouchLikePointer(pointerType: string | undefined): boolean {
  return pointerType === 'touch' || pointerType === 'pen'
}

export function shouldOpenEditorContextMenu(
  event: { button: number; ctrlKey: boolean },
  lastPointerType: string | undefined,
): boolean {
  if (event.button === 2 || event.ctrlKey) return true
  return !isTouchLikePointer(lastPointerType)
}
