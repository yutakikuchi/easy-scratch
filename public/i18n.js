import { ENGLISH_PATTERNS, ENGLISH_TEXT } from "./i18n-en.js?v=20260718b";

const JAPANESE_PATTERN = /[ぁ-んァ-ヶ一-龠々]/;
const textRecords = new WeakMap();
const attributeRecords = new WeakMap();
let language = new URLSearchParams(window.location.search).get("lang") === "en" ? "en" : "ja";
let applying = false;

function translateText(value) {
  const source = String(value ?? "");
  const leading = source.match(/^\s*/)?.[0] ?? "";
  const trailing = source.match(/\s*$/)?.[0] ?? "";
  const body = source.trim().replace(/\s+/g, " ");
  if (!body || !JAPANESE_PATTERN.test(body)) return source;
  if (ENGLISH_TEXT[body]) return `${leading}${ENGLISH_TEXT[body]}${trailing}`;
  for (const [pattern, replacement] of ENGLISH_PATTERNS) {
    if (pattern.test(body)) return `${leading}${body.replace(pattern, replacement)}${trailing}`;
  }
  return source;
}

function translateTextNode(node) {
  const current = node.nodeValue ?? "";
  let record = textRecords.get(node);
  if (!record || (language === "en" && current !== record.translated)) {
    record = { original: current, translated: null };
    textRecords.set(node, record);
  }
  if (language === "en") {
    record.translated = translateText(record.original);
    if (current !== record.translated) node.nodeValue = record.translated;
  } else if (record.translated !== null && current === record.translated) {
    node.nodeValue = record.original;
    record.translated = null;
  }
}

function attributeRecord(element) {
  let record = attributeRecords.get(element);
  if (!record) {
    record = new Map();
    attributeRecords.set(element, record);
  }
  return record;
}

function translateAttribute(element, name) {
  if (!element.hasAttribute(name)) return;
  const current = element.getAttribute(name) ?? "";
  const records = attributeRecord(element);
  let record = records.get(name);
  if (!record || (language === "en" && current !== record.translated)) {
    record = { original: current, translated: null };
    records.set(name, record);
  }
  if (language === "en") {
    record.translated = translateText(record.original);
    if (current !== record.translated) element.setAttribute(name, record.translated);
  } else if (record.translated !== null && current === record.translated) {
    element.setAttribute(name, record.original);
    record.translated = null;
  }
}

function updateLink(anchor) {
  const raw = anchor.getAttribute("href");
  if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("javascript:")) return;
  const url = new URL(raw, window.location.href);
  if (url.origin !== window.location.origin) return;
  if (language === "en") url.searchParams.set("lang", "en");
  else url.searchParams.delete("lang");
  const nextHref = `${url.pathname}${url.search}${url.hash}`;
  if (raw !== nextHref) anchor.setAttribute("href", nextHref);
}

function translateTree(root) {
  applying = true;
  try {
    if (root.nodeType === Node.TEXT_NODE) {
      translateTextNode(root);
      return;
    }
    if (!(root instanceof Element) && root !== document) return;
    const element = root instanceof Element ? root : null;
    if (element) {
      ["aria-label", "alt", "title", "placeholder", "content"].forEach((name) => translateAttribute(element, name));
      if (element instanceof HTMLAnchorElement) updateLink(element);
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let node = walker.nextNode();
    while (node) {
      if (node.nodeType === Node.TEXT_NODE) translateTextNode(node);
      else if (node instanceof Element) {
        ["aria-label", "alt", "title", "placeholder", "content"].forEach((name) => translateAttribute(node, name));
        if (node instanceof HTMLAnchorElement) updateLink(node);
      }
      node = walker.nextNode();
    }
  } finally {
    applying = false;
  }
}

function renderSwitcher() {
  let switcher = document.querySelector("[data-language-switcher]");
  if (!switcher) {
    switcher = document.createElement("nav");
    switcher.className = "language-switcher";
    switcher.dataset.languageSwitcher = "";
    switcher.setAttribute("aria-label", "Language / 言語");
    switcher.innerHTML = `
      <span class="language-switcher-icon" aria-hidden="true">🌐</span>
      <button type="button" data-language="ja">にほんご</button>
      <button type="button" data-language="en">English</button>
    `;
    switcher.addEventListener("click", (event) => {
      const button = event.target.closest("[data-language]");
      if (button) setLanguage(button.dataset.language);
    });
    document.body.append(switcher);
  }
  switcher.querySelectorAll("[data-language]").forEach((button) => {
    const active = button.dataset.language === language;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function updateMetadata() {
  document.documentElement.lang = language === "en" ? "en" : "ja";
  const url = new URL(window.location.href);
  if (language === "en") url.searchParams.set("lang", "en");
  else url.searchParams.delete("lang");
  window.history.replaceState(window.history.state, "", url);
}

export function setLanguage(nextLanguage) {
  const next = nextLanguage === "en" ? "en" : "ja";
  if (next === language) return;
  language = next;
  updateMetadata();
  translateTree(document);
  renderSwitcher();
  document.dispatchEvent(new CustomEvent("easy-scratch-languagechange", { detail: { language } }));
}

export function getLanguage() {
  return language;
}

export function t(value) {
  return language === "en" ? translateText(value) : value;
}

function init() {
  updateMetadata();
  renderSwitcher();
  // 日本語表示では、画面を描き直すたびに全DOMを走査する必要がない。
  // iPadではこの走査がリンクをタップした直後の反応を遅らせるため、
  // 英語表示のときだけ翻訳対象を監視する。
  if (language === "en") translateTree(document);
  const observer = new MutationObserver((mutations) => {
    if (applying || language !== "en") return;
    mutations.forEach((mutation) => {
      if (mutation.type === "characterData") translateTree(mutation.target);
      mutation.addedNodes.forEach((node) => translateTree(node));
      if (mutation.type === "attributes") translateTree(mutation.target);
    });
  });
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["aria-label", "alt", "title", "placeholder", "content", "href"]
  });
  window.easyScratchI18n = Object.freeze({ getLanguage, setLanguage, t });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
else init();
