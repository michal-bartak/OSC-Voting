// Pure decision logic for the global SPACE play/pause shortcut.
// Extracted from VotingPage so it can be unit-tested without React or a DOM.

export type SpaceAction = 'none' | 'playFirst' | 'resume' | 'pause';

export interface SpaceContext {
  /** The keydown event target (e.target). */
  target: EventTarget | null;
  settingsOpen: boolean;
  aboutOpen: boolean;
  playingId: string | null;
  isPaused: boolean;
}

/**
 * True when the target is a genuine text/value-entry element that should keep
 * SPACE for its own use (typing a space, toggling a focused checkbox). Buttons
 * are intentionally NOT editable here, so they yield SPACE to play/pause.
 */
export function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as (HTMLElement & { isContentEditable?: boolean }) | null;
  if (!el || typeof el.tagName !== 'string') return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (el.isContentEditable) return true;
  return false;
}

/**
 * Resolve what a SPACE press should do. Returns 'none' when SPACE must be left
 * alone (editable target, or a modal is open); otherwise the play/pause action
 * to run. Callers should preventDefault() for any non-'none' result so the
 * native activation of a focused button is suppressed.
 */
export function resolveSpaceAction(ctx: SpaceContext): SpaceAction {
  if (isEditableTarget(ctx.target)) return 'none';
  if (ctx.settingsOpen || ctx.aboutOpen) return 'none';
  if (!ctx.playingId && !ctx.isPaused) return 'playFirst';
  if (ctx.isPaused) return 'resume';
  return 'pause';
}
