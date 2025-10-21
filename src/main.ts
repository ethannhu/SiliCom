import { invoke, Channel } from "@tauri-apps/api/core";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from '@xterm/addon-fit';
import { save, message } from '@tauri-apps/plugin-dialog'
import chalk from "chalk";
const XTERM_WRITE_CHUNK_SIZE = 1 * 1024;


class RegexMatchApp {
  _regexInput = document.getElementById('regex_input') as HTMLInputElement;
  _submitButton = document.getElementById('regex_match_btn') as HTMLButtonElement;
  _resultList = document.getElementById('regex_match_result') as HTMLParagraphElement;;
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
}

class RegexMatch {
  start: number = 0;
  end: number = 0;
  text: string = "";
  constructor() { }
}

class SessionManageApp {
  _portNameInputElement = document.getElementById('port-name-input') as HTMLInputElement;
  _baudRateInputElement = document.getElementById('baud-rate-input') as HTMLInputElement;
  _openSessionButtonElement = document.getElementById('open-session-button') as HTMLButtonElement;
  _closeSessionButtonElement = document.getElementById('close-session-button') as HTMLButtonElement;
  _outputTerminal: TerminalApp;
  _isSessionRunning = false;
  constructor(outputTerminal: TerminalApp) {
    this._outputTerminal = outputTerminal;

    this._openSessionButtonElement.addEventListener('click', () => { this._openSession(); });
    this._closeSessionButtonElement.addEventListener('click', () => { this._closeSession(); });
    window.addEventListener('beforeunload', () => { this._closeSession(); });
  }
  async _openSession() {
    const portName = this._portNameInputElement.value;
    const baudRate = Number(this._baudRateInputElement.value);
    const channel = new Channel<Uint8Array>();
    channel.onmessage = (response) => { this._responseHandler(response); }
    this._isSessionRunning = true;
    this._openSessionButtonElement.disabled = true;
    this._outputTerminal.writeMessage('Starting session on ' + portName, MessageKind.INFO);
    await invoke("open_serial_port", {
      portName: portName,
      baudRate: baudRate,
      reader: channel,
    }).catch(async (reason: string) => {
      await message(reason, { title: 'Unable to start session', kind: 'error' });
    }).then(() => {
      this._outputTerminal.writeMessage('Session closed', MessageKind.INFO);
    }).finally(() => {
      this._openSessionButtonElement.disabled = false;
      this._isSessionRunning = false;
    })
  }
  _closeSession() {
    if (this._isSessionRunning) {
      invoke("close_serial_port").catch(async () => {
        await message('No session is running!', { title: 'Unable to close session', kind: 'warning' })
      }).then(() => {
        this._outputTerminal.writeMessage('Closing session...', MessageKind.WARNING);
      })
    }
  }
  _responseHandler(response: Uint8Array) {
    this._outputTerminal.writeData(response);
  }
}

class WriterApp {
  _inputElement = document.getElementById('port-write-input') as HTMLInputElement;
  _writeButtonElement = document.getElementById('port-write-button') as HTMLButtonElement;
  constructor() {
    this._writeButtonElement.addEventListener('click', () => { this._write() })
  }
  async _write() {

    const str = this._inputElement.value;
    console.log('writing: ' + str)
    await invoke('write_port', {
      inputString: str
    }
    );
  }
}



class BufferUsageApp {
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

class TerminalApp {
  _terminalElement = document.getElementById('terminal') as HTMLDivElement;
  _timestampCheckbox = document.getElementById('timestamp-checkbox') as HTMLInputElement;
  _newlineCheckbox = document.getElementById('newline-checkbox') as HTMLInputElement;
  terminal: Terminal;
  _fitAddon: FitAddon;
  _resizeObserver: ResizeObserver;
  _writeWithTimestamp: boolean = true;
  _writeInNewLine: boolean = true;
  constructor() {
    this.terminal = new Terminal();
    this.terminal.open(this._terminalElement);
    this._fitAddon = new FitAddon();
    this._resizeObserver = new ResizeObserver(() => { this._fitAddon.fit() })
    this.terminal.loadAddon(this._fitAddon);
    this._resizeObserver.observe(this._terminalElement);

    this._timestampCheckbox.addEventListener('change', () => { this._writeWithTimestamp = this._timestampCheckbox.checked });
    this._newlineCheckbox.addEventListener('change', () => { this._writeInNewLine = this._newlineCheckbox.checked });
  }

  writeData(buffer: string | Uint8Array) {
    if (this._writeWithTimestamp) {
      const date: Date = new Date();
      this.terminal.write(chalk.bgWhite.black.bold(date.toLocaleTimeString('en-US')) + ' ');
    }
    this.terminal.write(buffer);
    if (this._writeInNewLine) {
      this.terminal.writeln('');
    }
  }
  writeMessage(message: string, type: MessageKind) {
    const date: Date = new Date();
    this.terminal.write(chalk.bgWhite.black.bold(date.toLocaleTimeString('en-US')) + ' ')
    switch (type) {
      case MessageKind.INFO:
        this.terminal.writeln(chalk.green.bold(message));
        break;
      case MessageKind.ERROR:
        this.terminal.writeln(chalk.red.bold(message));
        break;
      case MessageKind.WARNING:
        this.terminal.writeln(chalk.yellow.bold(message));
    }

  }
  /*
  writeChunkData(buffer: u8, chunkSize: number = XTERM_WRITE_CHUNK_SIZE) {
    console.log(buffer.writeIndex);
    for (let i = 0; i < buffer.writeIndex; i += chunkSize) {
      this.terminal.write(buffer.array.subarray(i, i + chunkSize));
    }
  }
  */
}

enum MessageKind {
  INFO, WARNING, ERROR
}

class MainApp {
  outputTerminal: TerminalApp;
  regexMatchApp: RegexMatchApp;
  sessionManageApp: SessionManageApp;
  writerApp: WriterApp;
  bufferUsageApp: BufferUsageApp;
  constructor() {
    this.outputTerminal = new TerminalApp();
    this.sessionManageApp = new SessionManageApp(this.outputTerminal);
    this.regexMatchApp = new RegexMatchApp();
    this.writerApp = new WriterApp();
    this.bufferUsageApp = new BufferUsageApp();
  }

}

const app = new MainApp();
app.outputTerminal.writeData("Hello from Blanca");
