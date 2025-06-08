import { delay } from '../../../utils.js';
import { waitForFrame } from './src/lib/wait.js';
import { Settings } from './src/Settings.js';


const NAME = new URL(import.meta.url).pathname.split('/').at(-2);
const watchCss = async()=>{
    if (new URL(import.meta.url).pathname.split('/').includes('reload')) return;
    try {
        const FilesPluginApi = (await import('../SillyTavern-FilesPluginApi/api.js')).FilesPluginApi;
        // watch CSS for changes
        const style = document.createElement('style');
        document.body.append(style);
        const path = [
            '~',
            'extensions',
            NAME,
            'style.css',
        ].join('/');
        const ev = await FilesPluginApi.watch(path);
        ev.addEventListener('message', async(/**@type {boolean}*/exists)=>{
            if (!exists) return;
            style.innerHTML = await (await FilesPluginApi.get(path)).text();
            document.querySelector(`#third-party_${NAME}-css`)?.remove();
        });
    } catch { /* empty */ }
};
watchCss();

export const settings = new Settings();
settings.render();

const originalBtn = /**@type {HTMLElement}*/(document.querySelector('#send_but'));
originalBtn.addEventListener('contextmenu', (evt)=>{
    evt.preventDefault();
    evt.stopPropagation();
    evt.stopImmediatePropagation();
    showMenu();
});
export const ta = /**@type {HTMLTextAreaElement}*/(document.querySelector('#send_textarea'));

export const updateBtn = ()=>{
    const btn = settings.button ? settings.button.render() : originalBtn;
    btn.classList.remove('displayNone');
    document.querySelector('#send_but').replaceWith(btn);
};
updateBtn();

/**@type {HTMLElement} */
let menu;
const hideMenu = async()=>{
    menu.classList.remove('stsb--active');
    await delay(210);
    menu.remove();
    menu = null;
};
export const showMenu = async()=>{
    if (menu) {
        hideMenu();
        return;
    }
    menu = document.createElement('div'); {
        menu.classList.add('stsb--menu');
        menu.addEventListener('pointerdown', (evt)=>{
            evt.preventDefault();
            evt.stopPropagation();
            evt.stopImmediatePropagation();
        });
        menu.addEventListener('click', (evt)=>{
            evt.preventDefault();
            evt.stopPropagation();
            evt.stopImmediatePropagation();
        });
        menu.addEventListener('pointerup', (evt)=>{
            evt.preventDefault();
            evt.stopPropagation();
            evt.stopImmediatePropagation();
        });
        if (settings.buttonId !== null) {
            const item = document.createElement('div'); {
                item.classList.add('stsb--item');
                item.addEventListener('pointerdown', (evt)=>{
                    evt.preventDefault();
                    evt.stopPropagation();
                    evt.stopImmediatePropagation();
                });
                const lbl = document.createElement('div'); {
                    lbl.classList.add('stsb--label');
                    lbl.textContent = originalBtn.title;
                    lbl.title = 'Switch to default send button';
                    lbl.addEventListener('click', async(evt)=>{
                        evt.preventDefault();
                        evt.stopPropagation();
                        evt.stopImmediatePropagation();
                        await hideMenu();
                        settings.buttonId = null;
                        updateBtn();
                        settings.save();
                    });
                    item.append(lbl);
                }
                const btn = /**@type {HTMLElement}*/(originalBtn.cloneNode(true)); {
                    btn.id = '';
                    btn.classList.remove('displayNone');
                    btn.classList.add('stsb--icon');
                    btn.title = `Send / Execute\n---\n${btn.title}`;
                    btn.addEventListener('click', async(evt)=>{
                        evt.preventDefault();
                        evt.stopPropagation();
                        evt.stopImmediatePropagation();
                        await hideMenu();
                        originalBtn.click();
                    });
                    item.append(btn);
                }
                menu.append(item);
            }
        }
        for (const sb of settings.buttonList) {
            if (sb == settings.button) continue;
            const item = document.createElement('div'); {
                item.classList.add('stsb--item');
                item.addEventListener('pointerdown', (evt)=>{
                    evt.preventDefault();
                    evt.stopPropagation();
                    evt.stopImmediatePropagation();
                });
                item.addEventListener('click', (evt)=>{
                    evt.preventDefault();
                    evt.stopPropagation();
                    evt.stopImmediatePropagation();
                });
                item.addEventListener('pointerup', (evt)=>{
                    evt.preventDefault();
                    evt.stopPropagation();
                    evt.stopImmediatePropagation();
                });
                const lbl = document.createElement('div'); {
                    lbl.classList.add('stsb--label');
                    lbl.textContent = sb.title;
                    lbl.title = `Switch to [${sb.title}]\n---\nCtrl+click to edit\n---\n${sb.command}`;
                    lbl.addEventListener('click', async(evt)=>{
                        evt.preventDefault();
                        evt.stopPropagation();
                        evt.stopImmediatePropagation();
                        await hideMenu();
                        if (evt.ctrlKey) {
                            return sb.qr?.showEditor();
                        }
                        settings.buttonId = sb.id;
                        updateBtn();
                        settings.save();
                    });
                    item.append(lbl);
                }
                const btn = sb.buildDom(); {
                    btn.id = '';
                    btn.classList.add('stsb--icon');
                    btn.title = `Send / Execute\n---\n${btn.title}`;
                    btn.addEventListener('click', async(evt)=>{
                        evt.preventDefault();
                        evt.stopPropagation();
                        evt.stopImmediatePropagation();
                        await hideMenu();
                        if (evt.ctrlKey) {
                            return sb.qr?.showEditor();
                        }
                        sb.trigger(evt);
                    });
                    item.append(btn);
                }
                menu.append(item);
            }
        }
        if (settings.button) settings.button.dom.root.append(menu);
        else originalBtn.append(menu);
        await waitForFrame();
        menu.classList.add('stsb--active');
    }
};

let Callback;
let KeyCombo;
try {
    (async()=>{
        Callback = (await import('../SillyTavern-Keyboard/src/Callback.js')).Callback;
        KeyCombo = (await import('../SillyTavern-Keyboard/src/KeyCombo.js')).KeyCombo;
        const cb = Callback.index['send'].callback;
        Callback.index['send'].callback = async(evt)=>{
            if (settings.button && (settings.button.trapScript || ta.value[0] != '/')) {
                return settings.button.trigger(evt);
            } else {
                return cb(evt);
            }
        };
    })();
} catch { /* empty */ }

document.querySelector('#send_textarea').addEventListener('keydown', (/**@type {KeyboardEvent}*/evt)=>{
    if (KeyCombo && KeyCombo.list.find(it=>it.callbackId == 'send')) return;
    if (evt.key == 'Enter' && !evt.ctrlKey && !evt.altKey && !evt.shiftKey && settings.button && this.value[0] != ('/')) {
        settings.button.trigger(evt);
    }
});
