import { resolveResource } from '@tauri-apps/api/path';
import { readTextFile } from '@tauri-apps/plugin-fs';

let currentLang = {};
const localeMap = new Map(
    [
        ['en', 'locales/en.json'],
        ['zh_CN', 'locales/zh_CN.json']
    ]
)

async function loadLang(locale: string): Promise<void> {
    const resourcePath = await resolveResource(localeMap.get(locale) as string);
    currentLang = JSON.parse(await readTextFile(resourcePath));
}

function t(key: string): string {
    return currentLang[key] || key;
}

function translateAllElements(t: (key: string) => string): void {
    const elements = document.getElementsByClassName('multilang');
    Array.from(elements).forEach(element => {
        // 基础翻译键（从元素原始文本或 data-i18n 属性获取，优先取 data-i18n）
        const key = element.id || '';
        if (!key) {
            console.warn('Multilang element has no translation key', element);
        }
        const translatedText = t(key);
        if (key !== translatedText) { element.textContent = translatedText; }
    });
}

export async function setLocale(locale: string) {
    await loadLang(locale);
    translateAllElements(t);
    //console.log(currentLang['timestamp-label']);
}