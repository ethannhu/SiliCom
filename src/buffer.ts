import { invoke, Channel } from "@tauri-apps/api/core";
import { save, message } from '@tauri-apps/plugin-dialog'

export class BufferManager {
  _usageParagraph = document.getElementById('usage-p') as HTMLParagraphElement;
  _saveBufferButton = document.getElementById('save-button') as HTMLButtonElement;
  _saveBytesCheckbox = document.getElementById('save-bytes-check') as HTMLInputElement;
  _dumpCheckbox = document.getElementById('dump-check') as HTMLInputElement;
  _clearBufferButton = document.getElementById('clear-button') as HTMLButtonElement;
  constructor() {
    setInterval(() => { this.get_usage() }, 1000)
    this._saveBufferButton.addEventListener('click', ()=>{this.saveBuffer()});
    this._clearBufferButton.addEventListener('click', ()=>{this.clearBuffer()});
  }
  async get_usage() {
    await invoke('get_read_buffer_usage').then((usage) => {
      const usage_str = (usage as number).toString();
      this._usageParagraph.textContent = usage_str;
    })
  }

  async saveBuffer() {
    await save({
      filters: [
        {
          name: 'Log',
          extensions: ['txt'],
        },
      ]
    }).then(async (path) => {
      await invoke('save_buffer', {
        path: path,
        inBytes: this._saveBytesCheckbox.checked,
        shouldDump: this._dumpCheckbox.checked,
      }).then((byte_count) => {
        console.log('written ' + byte_count)
      })
    })
  }

  clearBuffer() {
    invoke('clear_buffer');
  }
}