import { Terminal } from "@xterm/xterm";
import { FitAddon } from '@xterm/addon-fit';
import chalk from "chalk";
import { invoke, Channel } from "@tauri-apps/api/core";

export class TerminalWrapper {
    _terminalElement = document.getElementById('terminal') as HTMLDivElement;
    _timestampCheckbox = document.getElementById('timestamp-checkbox') as HTMLInputElement;
    _newlineCheckbox = document.getElementById('newline-checkbox') as HTMLInputElement;
    _inputElement = document.getElementById('port-write-input') as HTMLInputElement;
    _writeButtonElement = document.getElementById('port-write-button') as HTMLButtonElement;
    terminal: Terminal;
    _fitAddon: FitAddon;
    _resizeObserver: ResizeObserver;
    _printWithTimestamp: boolean = true;
    _printNewLine: boolean = true;
    constructor() {
        this.terminal = new Terminal();
        this.terminal.open(this._terminalElement);
        this._fitAddon = new FitAddon();
        this._resizeObserver = new ResizeObserver(() => { this._fitAddon.fit() })
        this.terminal.loadAddon(this._fitAddon);
        this._resizeObserver.observe(this._terminalElement);
        this._writeButtonElement.addEventListener('click', () => { this._writePort() })
        this._timestampCheckbox.addEventListener('change', () => { this._printWithTimestamp = this._timestampCheckbox.checked });
        this._newlineCheckbox.addEventListener('change', () => { this._printNewLine = this._newlineCheckbox.checked });
    }

    printData(buffer: string | Uint8Array) {
        if (this._printWithTimestamp) {
            const date: Date = new Date();
            this.terminal.write(chalk.bgWhite.black.bold(date.toLocaleTimeString('en-US')) + ' ');
        }
        this.terminal.write(buffer);
        if (this._printNewLine) {
            this.terminal.writeln('');
        }
    }
    printMessage(message: string, type: MessageKind) {
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

    async _writePort() {
        const str = this._inputElement.value;
        console.log('writing: ' + str)
        await invoke('write_port', {
            inputString: str
        }
        );
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

export enum MessageKind {
    INFO, WARNING, ERROR
}