import { invoke, Channel } from "@tauri-apps/api/core";
import { save, message } from '@tauri-apps/plugin-dialog'
import { Menu, MenuItem, Submenu } from '@tauri-apps/api/menu';
import {TerminalWrapper} from './terminal';
import {Match} from './match';
import {SessionManager} from './session';
import {BufferManager} from './buffer'

class MainApp {
  _appContainer = document.getElementById('main-grid') as HTMLDivElement;
  outputTerminal: TerminalWrapper;
  regexMatchApp: Match;
  sessionManageApp: SessionManager;
  bufferUsageApp: BufferManager;
  constructor() {
    this.outputTerminal = new TerminalWrapper();
    this.sessionManageApp = new SessionManager(this.outputTerminal);
    this.regexMatchApp = new Match();
    this.bufferUsageApp = new BufferManager();
  }
  switchView(componentId: string) {
    const components = document.querySelectorAll('.component');
    components.forEach(component => {
          component.classList.remove('active');
        });
    document.getElementById(componentId)?.classList.add('active');
  }
}




const app = new MainApp();
app.outputTerminal.printData("Hello from Blanca");


const fileSubmenu = await Submenu.new({
  text: 'File',
  items: [
    await MenuItem.new({
      id: 'new',
      text: 'New',
      action: () => {
        console.log('New clicked');
      },
    }),
    await MenuItem.new({
      id: 'open',
      text: 'Open',
      action: () => {
        console.log('Open clicked');
      },
    }),
    await MenuItem.new({
      id: 'save_as',
      text: 'Save As...',
      action: () => {
        console.log('Save As clicked');
      },
    }),
  ],
});

const menu = await Menu.new({
  items: [
    await MenuItem.new({
      id: 'terminal',
      text: 'Terminal',
      action: () => {
        app.switchView('terminal-container')
      },
    }),
    await MenuItem.new({
      id: 'match',
      text: 'Match',
      action: () => {
        app.switchView('match-container')
      },
    }),
    await MenuItem.new({
      id: 'session',
      text: 'Session',
      action: () => {
        app.switchView('session-container');
      },
    }),
    await MenuItem.new({
      id: 'buffer',
      text: 'Buffer',
      action: () => {
        app.switchView('buffer-container');
      },
    }),
  ],
});

menu.setAsAppMenu();

