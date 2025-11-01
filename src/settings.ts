import { setLocale } from "./lang";
export class ThemeConfigView {
    _lightThemeButton = document.getElementById('theme-light-button');
    _darkThemeButton = document.getElementById('theme-dark-button');
    _localeSelect = document.getElementById('locale-select') as HTMLSelectElement;
    constructor() {
        this._lightThemeButton?.addEventListener('click', ()=>{onLightTheme()});
        this._darkThemeButton?.addEventListener('click', ()=>{onDarkTheme()});
        this._localeSelect.addEventListener('change', async ()=>{setLocale(this._localeSelect.value)})
    }
}

function onLightTheme() {
    document.documentElement.dataset.theme="light"
}

function onDarkTheme() {
    document.documentElement.dataset.theme="dark"
}
