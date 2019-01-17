// @flow
/* eslint import/no-extraneous-dependencies: 0 */
import { app, Menu, shell, BrowserWindow, dialog } from 'electron';
import {
  OPEN_FILE_CHANNEL,
  DELETE_ROW_CHANNEL,
  DELETE_TABLE_CHANNEL
} from './types/channels';

export default class MenuBuilder {
  mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  buildMenu() {
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.DEBUG_PROD === 'true'
    ) {
      this.setupDevelopmentEnvironment();
    }

    const template =
      process.platform === 'darwin'
        ? this.buildDarwinTemplate()
        : this.buildDefaultTemplate();

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    return menu;
  }

  setupDevelopmentEnvironment() {
    this.mainWindow.openDevTools();
    this.mainWindow.webContents.on('context-menu', (e, props) => {
      const { x, y } = props;

      Menu.buildFromTemplate([
        {
          label: 'Inspect element',
          click: () => {
            this.mainWindow.inspectElement(x, y);
          }
        }
      ]).popup(this.mainWindow);
    });
  }

  buildDarwinTemplate() {
    const subMenuAbout = {
      label: 'Falcon',
      submenu: [
        {
          label: 'About Falcon',
          selector: 'orderFrontStandardAboutPanel:'
        },
        { type: 'separator' },
        { label: 'Services', submenu: [] },
        { type: 'separator' },
        {
          label: 'Hide Falcon',
          accelerator: 'Command+H',
          selector: 'hide:'
        },
        {
          label: 'Hide Others',
          accelerator: 'Command+Shift+H',
          selector: 'hideOtherApplications:'
        },
        { label: 'Show All', selector: 'unhideAllApplications:' },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    };
    const subMenuFile = {
      label: 'File',
      submenu: [
        {
          label: 'Open File',
          accelerator: 'Command+O',
          click: () => {
            const selectedFiles = dialog.showOpenDialog({
              filters: [
                { name: 'SQLite', extensions: ['sqlite', 'db', 'sqlite3'] }
              ],
              title: 'Set a database'
            });
            if (!selectedFiles) return;
            // @TODO: Hardcoded to use only first database selected
            this.mainWindow.webContents.send(
              OPEN_FILE_CHANNEL,
              selectedFiles[0]
            );
          }
        },
        {
          label: 'Show Favorites Menu',
          accelerator: 'Alt+Command+N',
          click: () => {}
        },
        {
          label: 'New Window',
          accelerator: 'Command+N',
          click: () => {}
        },
        {
          label: 'New Tab',
          accelerator: 'Command+T',
          click: () => {}
        }
      ]
    };
    const subMenuEdit = {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'Command+Z', selector: 'undo:' },
        { label: 'Redo', accelerator: 'Shift+Command+Z', selector: 'redo:' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'Command+X', selector: 'cut:' },
        { label: 'Copy', accelerator: 'Command+C', selector: 'copy:' },
        { label: 'Paste', accelerator: 'Command+V', selector: 'paste:' },
        {
          label: 'Select All',
          accelerator: 'Command+A',
          selector: 'selectAll:'
        },
        { type: 'separator' },
        {
          label: 'Delete Table Row',
          accelerator: 'Backspace',
          click: () => {
            this.mainWindow.webContents.send(DELETE_ROW_CHANNEL);
          }
        },
        {
          label: 'Delete Table',
          accelerator: 'Command+Backspace',
          click: () => {
            this.mainWindow.webContents.send(DELETE_TABLE_CHANNEL);
          }
        }
      ]
    };
    const subMenuViewDev = {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'Command+R',
          click: () => {
            this.mainWindow.webContents.reload();
          }
        },
        {
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Command+F',
          click: () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
          }
        }
      ]
    };
    const subMenuViewProd = {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Command+F',
          click: () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
          }
        }
      ]
    };
    const subMenuDatabase = {
      label: 'Database',
      submenu: [
        {
          label: 'Import',
          accelerator: '',
          click: () => {
            dialog.showSaveDialog();
          }
        },
        {
          label: 'Export',
          accelerator: '',
          click: async () => {
            // const exportPath = dialog.showSaveDialog(this.mainWindow, {
            //   filters: [
            //     { name: 'JSON', extensions: ['json'] },
            //     { name: 'CSV', extensions: ['csv'] }
            //   ],
            //   title: 'Export a database',
            //   // @TODO: Change foo to current database table
            //   defaultPath: '~/foo.csv'
            // });
            // const fileType: 'json' | 'csv' = exportPath.substring(
            //   exportPath.lastIndexOf('.') + 1
            // );
            // await exportFile(fileType, exportPath, {
            //   // @TODO: HARDCODE
            //   table: 'albums'
            // });
          }
        }
      ]
    };
    const subMenuHistory = {
      label: 'History',
      submenu: []
    };
    const subMenuBookmarks = {
      label: 'Bookmarks',
      submenu: []
    };
    const subMenuDevelop = {
      label: 'Develop',
      submenu: []
    };
    const subMenuWindow = {
      label: 'Window',
      submenu: [
        {
          label: 'Minimize',
          accelerator: 'Command+M',
          selector: 'performMiniaturize:'
        },
        { label: 'Close', accelerator: 'Command+W', selector: 'performClose:' },
        { type: 'separator' },
        { label: 'Bring All to Front', selector: 'arrangeInFront:' }
      ]
    };
    const subMenuHelp = {
      label: 'Help',
      submenu: [
        {
          label: 'Learn More',
          click() {
            shell.openExternal('https://github.com/falcon-client/falcon');
          }
        },
        {
          label: 'Documentation',
          click() {
            shell.openExternal(
              'https://github.com/falcon-client/falcon#readme'
            );
          }
        },
        {
          label: 'Community Discussions',
          click() {
            shell.openExternal(
              'https://github.com/falcon-client/falcon/issues'
            );
          }
        },
        {
          label: 'Search Issues',
          click() {
            shell.openExternal(
              'https://github.com/falcon-client/falcon/issues'
            );
          }
        }
      ]
    };

    const subMenuView =
      process.env.NODE_ENV === 'development' ? subMenuViewDev : subMenuViewProd;

    return [
      subMenuAbout,
      subMenuFile,
      subMenuEdit,
      subMenuView,
      subMenuDatabase,
      subMenuHistory,
      subMenuBookmarks,
      subMenuDevelop,
      subMenuWindow,
      subMenuHelp
    ];
  }

  buildDefaultTemplate() {
    const templateDefault = [
      {
        label: '&File',
        submenu: [
          {
            label: '&Open',
            accelerator: 'Ctrl+O'
          },
          {
            label: '&Close',
            accelerator: 'Ctrl+W',
            click: () => {
              this.mainWindow.close();
            }
          }
        ]
      },
      {
        label: '&View',
        submenu:
          process.env.NODE_ENV === 'development'
            ? [
                {
                  label: '&Reload',
                  accelerator: 'Ctrl+R',
                  click: () => {
                    this.mainWindow.webContents.reload();
                  }
                },
                {
                  label: 'Toggle &Full Screen',
                  accelerator: 'F11',
                  click: () => {
                    this.mainWindow.setFullScreen(
                      !this.mainWindow.isFullScreen()
                    );
                  }
                }
              ]
            : [
                {
                  label: 'Toggle &Full Screen',
                  accelerator: 'F11',
                  click: () => {
                    this.mainWindow.setFullScreen(
                      !this.mainWindow.isFullScreen()
                    );
                  }
                }
              ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'Learn More',
            click() {
              shell.openExternal('https://github.com/falcon-client/falcon');
            }
          },
          {
            label: 'Documentation',
            click() {
              shell.openExternal(
                'https://github.com/falcon-client/falcon#readme'
              );
            }
          },
          {
            label: 'Community Discussions',
            click() {
              shell.openExternal(
                'https://github.com/falcon-client/falcon/issues'
              );
            }
          },
          {
            label: 'Search Issues',
            click() {
              shell.openExternal(
                'https://github.com/falcon-client/falcon/issues'
              );
            }
          }
        ]
      }
    ];

    return templateDefault;
  }
}
