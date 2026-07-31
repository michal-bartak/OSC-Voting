import { describe, expect, it } from 'vitest';
import { isEditableTarget, resolveSpaceAction, SpaceContext } from './spaceShortcut';

// Lightweight stand-ins for DOM targets — resolveSpaceAction only reads
// `tagName` / `isContentEditable`, so we avoid needing a real DOM.
const el = (tagName: string, isContentEditable = false) =>
  ({ tagName, isContentEditable } as unknown as EventTarget);

const base: Omit<SpaceContext, 'target'> = {
  settingsOpen: false,
  aboutOpen: false,
  playingId: null,
  isPaused: false,
};

describe('isEditableTarget', () => {
  it('treats text/value-entry elements as editable', () => {
    expect(isEditableTarget(el('INPUT'))).toBe(true);
    expect(isEditableTarget(el('TEXTAREA'))).toBe(true);
    expect(isEditableTarget(el('SELECT'))).toBe(true);
    expect(isEditableTarget(el('DIV', true))).toBe(true); // contentEditable
  });

  it('does NOT treat buttons or other elements as editable (the core fix)', () => {
    expect(isEditableTarget(el('BUTTON'))).toBe(false);
    expect(isEditableTarget(el('DIV'))).toBe(false);
    expect(isEditableTarget(el('A'))).toBe(false);
  });

  it('handles null / non-element targets safely', () => {
    expect(isEditableTarget(null)).toBe(false);
    expect(isEditableTarget({} as EventTarget)).toBe(false);
  });
});

describe('resolveSpaceAction', () => {
  it('starts the first song when nothing is playing', () => {
    expect(resolveSpaceAction({ ...base, target: el('BODY') })).toBe('playFirst');
  });

  it('resumes when paused', () => {
    expect(
      resolveSpaceAction({ ...base, target: el('BODY'), playingId: 's1', isPaused: true }),
    ).toBe('resume');
  });

  it('pauses when playing', () => {
    expect(
      resolveSpaceAction({ ...base, target: el('BODY'), playingId: 's1', isPaused: false }),
    ).toBe('pause');
  });

  it('toggles play/pause even when a BUTTON has focus (the reported bug)', () => {
    // Next / Prev / vote buttons keep focus after a click; SPACE must still
    // resolve to play/pause instead of re-firing the button.
    expect(
      resolveSpaceAction({ ...base, target: el('BUTTON'), playingId: 's1', isPaused: false }),
    ).toBe('pause');
    expect(resolveSpaceAction({ ...base, target: el('BUTTON') })).toBe('playFirst');
  });

  it('does nothing while typing in a text field', () => {
    expect(resolveSpaceAction({ ...base, target: el('INPUT') })).toBe('none');
    expect(resolveSpaceAction({ ...base, target: el('TEXTAREA') })).toBe('none');
  });

  it('does nothing while the Settings modal is open', () => {
    expect(
      resolveSpaceAction({ ...base, target: el('BODY'), settingsOpen: true }),
    ).toBe('none');
  });

  it('does nothing while the About modal is open', () => {
    expect(
      resolveSpaceAction({ ...base, target: el('BODY'), aboutOpen: true }),
    ).toBe('none');
  });
});
