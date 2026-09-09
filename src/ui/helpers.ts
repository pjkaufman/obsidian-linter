import { sanitizeHTMLToDom } from 'obsidian';

export function hideEl(el: HTMLElement) {
  el.addClass('linter-visually-hidden');
}

export function unhideEl(el: HTMLElement) {
  el.removeClass('linter-visually-hidden');
}

export function setElContent(text: string, el: HTMLElement) {
  if (text.includes('</')) {
    el.append(sanitizeHTMLToDom(text));
  } else {
    el.setText(text);
  }
}

// Parse a locale string into a DocumentFragment if it contains HTML (e.g. <a>,
// <code>, <b>), otherwise return the plain string. Suitable for `desc` fields
// on SettingDefinitionItem and for setting.setDesc(...) in render callbacks.
export function richDescription(text: string): string | DocumentFragment {
  if (!text.includes('</')) return text;
  return sanitizeHTMLToDom(text);
}
