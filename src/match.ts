import { invoke, Channel } from "@tauri-apps/api/core";

export class Match {
  _appContainer = document.getElementById('match-app') as HTMLDivElement;
  _regexInput = document.getElementById('regex_input') as HTMLInputElement;
  _submitButton = document.getElementById('regex-match-button') as HTMLButtonElement;
  _resultList = document.getElementById('regex-match-result') as HTMLParagraphElement;;
  constructor() {
    this._submitButton.addEventListener("click", () => { this.match(); })
  }
  async match() {
    this._resultList.innerHTML = '';
    const re = this._regexInput.value;
    await invoke('match_regex', { regexStr: re }).then((matchResult) => {
      if (matchResult instanceof Array) {
        let iter;
        for (iter in matchResult) {
          let match = matchResult[iter] as RegexMatch;
          const matchListItem = document.createElement("li")
          matchListItem.textContent = 'At: ' + match.start + ': ' + match.text;
          this._resultList.appendChild(matchListItem);
        }
      }
    });
  }
  toggleVisibility() {
    this._appContainer.hidden = true !== this._appContainer.hidden;
  }
  hide() {
    this._appContainer.hidden = true;
  }
  show() {
    this._appContainer.hidden = false;
  }
  isVisible() {
    return this._appContainer.hidden;
  }
}

class RegexMatch {
  start: number = 0;
  end: number = 0;
  text: string = "";
  constructor() { }
}