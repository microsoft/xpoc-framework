// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const template = document.createElement('TEMPLATE');
template.innerHTML = `
<style>

    /* !important keeps the light-dom from overriding our settings */

    :host {
        all: initial;
        position: fixed;
        z-index: 10000; 
    }

    .container {
        border: 1px solid black;
        border-radius: 0.8em;
        background: #EEEEEE;
        width: auto;
        box-shadow: 5px 5px 5px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        font-family: Verdana, sans-serif;
        font-size: 12px;
        padding: 0.8em;
        margin: 1em;
        line-height: 1.25;
        
    }

    .left {
        /* width: 30%; */
        box-sizing: border-box;
        text-align: center;
        display: flex;
        justify-content: center;
        align-items: center;
        padding-right: 0.8em;
    }

    .middle {
        padding-left: 2em;
        border-left: 1px solid rgba(0, 0, 0, 0.1);
        min-width: 20em;
    }

    .right {
        box-sizing: border-box;
        text-align: center;
        display: flex;
        justify-content: center;
        align-items: center;
        padding-right: 0.8em;
    }

    img {
        height: 5em;
        /* opacity: 0.2; */
    }

    label {
        color: black;
        font-weight: 700;
        margin-bottom: 0.4em;
        display: block;
        font-size: 13px;
    }

    td {

    }

    td.key {
        font-weight: 500;
        font-size: 11px;
        color: #808080;
    }

    td.value {
        font-weight: 400;
        font-size: 11px;
        color: #101010;
        padding-left: 2em;
    }

    table {
        margin-left: 0.4em;
    }

    #button {
        display: none;
        margin-left: 0.4em;
        padding: 0.4em 0.8em;
    }


</style>



<div class="container">

    <div class="left">
        <img id="icon"/>
    </div>

    <div class="middle">
        <label id="label"></label><br>
        <label id="label-1">Origin information</label>
        <table id="table-origin">
            <tr>
                <td id="key1" class="key"></td>
                <td id="value1" class="value">---------</td>
            </tr>
            <tr>
                <td id="key2" class="key"></td>
                <td id="value2" class="value">---------</td>
            </tr>
        </table><br>
        <label id="label-2">Account information</label>
        <table id="table-account">
            <tr>
                <td id="key1" class="key"></td>
                <td id="value1" class="value">---------</td>
            </tr>
            <tr>
                <td id="key2" class="key"></td>
                <td id="value2" class="value">---------</td>
            </tr>
            <tr>
                <td id="key3" class="key"></td>
                <td id="value3" class="value">---------</td>
            </tr>
            <tr>
                <td id="key4" class="key"></td>
                <td id="value4" class="value">---------</td>
            </tr>
            <tr>
                <td id="key5" class="key"></td>
                <td id="value5" class="value">---------</td>
            </tr>
        </table>
    </div>

    <div class="right">
        <input id="button" type="button" value="Trust" id="button"/>
    </div>

</div>

</div>`;


interface ControlTableLine {
    label: string;
    value?: string;
    link?: string;
}

type ControlTable = [string, ...ControlTableLine[]];


export class ContentPopup /* extends HTMLElement */ {
    container: HTMLElement;
    #shadowRoot: ShadowRoot;
    #tableOrigin: HTMLTableElement
    #tableAccount: HTMLTableElement
    #icon: HTMLImageElement;
    #label: HTMLLabelElement;
    #label1: HTMLLabelElement;
    #label2: HTMLLabelElement;
    #button: HTMLInputElement;
    #callback: (() => void) | undefined

    constructor() {
        this.container = document.createElement('DIV');
        this.#shadowRoot = this.container.attachShadow({ mode: 'open' });
        this.#shadowRoot.appendChild((template.cloneNode(true) as HTMLTemplateElement).content);

        this.container.style.display = 'none';
        document.body.appendChild(this.container);
        this.#tableOrigin = this.#shadowRoot.querySelector('#table-origin') as HTMLTableElement;
        this.#tableAccount = this.#shadowRoot.querySelector('#table-account') as HTMLTableElement;
        this.#icon = this.#shadowRoot.querySelector('#icon') as HTMLImageElement;
        this.#label = this.#shadowRoot.querySelector('#label') as HTMLLabelElement;
        this.#label1 = this.#shadowRoot.querySelector('#label-1') as HTMLLabelElement;
        this.#label2 = this.#shadowRoot.querySelector('#label-2') as HTMLLabelElement;
        this.#button = this.#shadowRoot.querySelector('#button') as HTMLInputElement;
        this.hide();
    }

    show(element: HTMLElement, label: string | null, iconUrl: string | null | undefined, table1?: ControlTable, table2?: ControlTable, buttonLabel?: string | null | undefined, callback?: (() => void) | undefined) {
        this.#label.textContent = label;
        this.#label.style.display = 'block';
        if (iconUrl != null) {
            this.#icon.style.display = 'block';
            this.#icon.src = iconUrl;
        }
        this.#label1.style.display = 'none';
        this.#label2.style.display = 'none';
        table1 && table1.forEach((line, index) => {
            if (index === 0) {
                this.#label1.textContent = line as string;
                return;
            }
            this.#label1.style.display = 'block';
            const tr = this.#tableOrigin.rows[index - 1];
            tr.style.display = 'table-row';
            const tableLine = line as ControlTableLine;
            if (tableLine.value !== undefined || line.link !== undefined) {
                tr.cells[0].textContent = tableLine.label;
                if (tableLine.value != null) {
                    tr.cells[1].textContent = tableLine.value;
                } else if (line.link != null) {
                    tr.cells[1].innerHTML = line.link as string;
                }
            }
        });
        table2 && table2.forEach((line, index) => {
            if (index === 0) {
                this.#label2.textContent = line as string;
                return;
            }
            this.#label2.style.display = 'block';
            const tr = this.#tableAccount.rows[index - 1];
            tr.style.display = 'table-row';
            const tableLine = line as ControlTableLine;
            if (tableLine.value !== undefined || tableLine.link !== undefined) {
                tr.cells[0].textContent = tableLine.label;
                if (tableLine.value != null) {
                    tr.cells[1].textContent = tableLine.value;
                } else if (line.link != null) {
                    tr.cells[1].innerHTML = tableLine.link as string;
                }
            }
        });

        if (buttonLabel != null) {
            this.#button.style.display = 'block';
            this.#button.value = buttonLabel;
            this.#callback = callback;
            this.#button.addEventListener('click', callback as () => void);
        }
        this.container.style.display = 'block';

        // eslint-disable-next-line no-void
        void this.container.offsetWidth;

        // don't position until the icon has loaded or we will get the wrong width
        this.#icon.onload = () => {
            this.position(element);
        };

        if (iconUrl === undefined) {
            this.position(element);
        }

        // eslint-disable-next-line no-unused-vars
        const closeListener = (event: Event) => {
            const isClickInsideElement = this.container.contains(event.target as Node);

            if (!isClickInsideElement) {
                this.hide();
                document.removeEventListener('click', closeListener);
            }
        };

        document.addEventListener('click', closeListener);
    }

    hide() {
        this.#label.textContent = '';
        Array.from<HTMLTableRowElement>(this.#tableOrigin.rows).forEach((tr) => {
            Array.from(tr.cells).forEach((td) => {
                td.textContent = '';
            });
            tr.style.display = 'none';
        });
        Array.from<HTMLTableRowElement>(this.#tableAccount.rows).forEach((tr) => {
            Array.from(tr.cells).forEach((td) => {
                td.textContent = '';
            });
            tr.style.display = 'none';
        });
        this.#icon.style.display = 'none';
        this.#button.style.display = 'none';
        this.#callback && this.#button.removeEventListener('click', this.#callback);
        this.#callback = undefined;
        this.container.style.display = 'none';
    }

    position(element: HTMLElement) {
        const boundRect = element.getBoundingClientRect();

        // check if the fixed element will go off the right edge of the screen
        this.container.style.left =
            boundRect.right + this.container.offsetWidth > window.innerWidth
                ? `${window.innerWidth - this.container.offsetWidth - 10}px`
                : `${boundRect.right}px`;

        // check if the fixed element will go off the bottom edge of the screen
        this.container.style.top =
            boundRect.bottom + this.container.offsetHeight > window.innerHeight
                ? `${window.innerHeight - this.container.offsetHeight - 10}px`
                : (this.container.style.top = `${boundRect.bottom}px`);
    }
}

// eslint-disable-next-line no-unused-vars
export const contentPopup = new ContentPopup()
