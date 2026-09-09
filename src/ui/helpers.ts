export function hideEl(el: HTMLElement) {
  el.addClass('linter-visually-hidden');
}

export function unhideEl(el: HTMLElement) {
  el.removeClass('linter-visually-hidden');
}

export function setElContent(text: string, el: HTMLElement) {
  if (text.includes('</')) {
    const range = document.createRange();
    // eslint-disable-next-line no-unsanitized/method -- this is only used for entries I already know are safe, so it should not need to be sanitized
    el.append(range.createContextualFragment(text));
  } else {
    el.setText(text);
  }
}

// Parse a locale string into a DocumentFragment if it contains HTML (e.g. <a>,
// <code>, <b>), otherwise return the plain string. Suitable for `desc` fields
// on SettingDefinitionItem and for setting.setDesc(...) in render callbacks.
export function richDescription(text: string): string | DocumentFragment {
  if (!text.includes('</')) return text;
  // eslint-disable-next-line no-unsanitized/method -- this is only used for entries I already know are safe, so it should not need to be sanitized
  return document.createRange().createContextualFragment(text);
}
