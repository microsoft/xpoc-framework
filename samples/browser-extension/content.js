// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const PATTERN = /xpoc:\/\/([a-zA-Z0-9.-]+)(\/[^!\s<]*)?!?/;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'displayXpocAccount') {
        if (request.result) {
            uwaContentPopup.show(
                lastContextMenuTarget,
                'XPOC Information',
                chrome.runtime.getURL('icons/xpoc_logo.svg'),
                [
                    'Origin information',
                    { label: 'Name', value: request.result.name },
                    {
                        label: 'Website',
                        link: `<a href='https://${request.result.baseurl}' target='_blank'>${request.result.baseurl}<a/>`,
                    },
                ],
                [
                    'Account information',
                    {
                        label: 'URL',
                        link: `<a href='${request.result.account.url}' target='_blank'>${request.result.account.url}<a/>`,
                    },
                    { label: 'Account', value: request.result.account.account },
                ],
            );
        }
    }
    if (request.action === 'displayXpocContent') {
        if (request.result) {
            uwaContentPopup.show(
                lastContextMenuTarget,
                'XPOC Information',
                chrome.runtime.getURL('icons/xpoc_logo.svg'),
                [
                    'Origin information',
                    { label: 'Name', value: request.result.name },
                    { label: 'Website', value: request.result.baseurl },
                ],
                [
                    'Content information',
                    { label: 'Description', value: request.result.content.desc },
                    { label: 'URL', value: request.result.content.url },
                    { label: 'PUID', value: request.result.content.puid },
                    { label: 'Account', value: request.result.content.account },
                    { label: 'Timestamp', value: request.result.content.timestamp},
                ],
            );
        }
    }
    if (request.action === 'xpocNotFound') {
        alert('Page not found in XPOC manifest');
    }
});

/*
    When we right-click on a node, we save a reference to it
    When the background script responds to the context menu click,
    we'll know what node we right-clicked on
*/
let lastContextMenuTarget = undefined;

/*
    Determines if specific word we right-clicked on is a valid XPOC URI
    If so, show send a message to background.js to make the context menu visible

    if we wait for the contextmenu event, then the round trip to the background script
    will be too slow to show modify context menu in time

    if we use the mousedown event, then we can't get the selected text (text we right-clicked on)

    mouseup works early enough
*/
document.addEventListener(
    'mouseup',
    function (event) {
        if (event.button === 2 /* right click */) {
            const clickedText = getSubstringAtClick(
                event.target.textContent,
                PATTERN,
                event,
            );
            if (clickedText) {
                lastContextMenuTarget = event.target;
            }
            chrome.runtime.sendMessage({
                action: 'showContextMenu',
                data: clickedText,
            });
        }
    },
    true,
);

/*
    This will determine if the specific word we click on, even if part of a larger string,
    matches the regex pattern
*/
function getSubstringAtClick(textContent, regex, event) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return undefined;

    const range = selection.getRangeAt(0);
    const clickIndex = range.startOffset;

    let match = textContent.match(regex);

    if (!match) return undefined;

    const startIndex = match.index;
    const endIndex = startIndex + match[0].length;

    if (clickIndex >= startIndex && clickIndex <= endIndex) {
        return match[0];
    }

    return undefined;
}

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

class UwaContentPopup /* extends HTMLElement */ {
    container;
    #shadowRoot;
    #tableOrigin;
    #tableAccount;
    #icon;
    #label;
    #label1;
    #label2;
    #button;
    #callback;

    constructor() {
        this.container = document.createElement('DIV');
        this.#shadowRoot = this.container.attachShadow({ mode: 'open' });
        this.#shadowRoot.appendChild(template.cloneNode(true).content);
        this.container.style.display = 'none';
        document.body.appendChild(this.container);
        this.#tableOrigin = this.#shadowRoot.querySelector('#table-origin');
        this.#tableAccount = this.#shadowRoot.querySelector('#table-account');
        this.#icon = this.#shadowRoot.querySelector('#icon');
        this.#label = this.#shadowRoot.querySelector('#label');
        this.#label1 = this.#shadowRoot.querySelector('#label-1');
        this.#label2 = this.#shadowRoot.querySelector('#label-2');
        this.#button = this.#shadowRoot.querySelector('#button');
        this.hide();
    }

    show(element, label, iconUrl, table1, table2, buttonLabel, callback) {
        this.#label.textContent = label;
        this.#label.style.display = 'block';
        if (iconUrl != null) {
            this.#icon.style.display = 'block';
            this.#icon.src = iconUrl;
        }
        table1.forEach((line, index) => {
            if (index === 0) {
                this.#label1.textContent = line;
                return;
            }
            const tr = this.#tableOrigin.rows[index - 1];
            tr.style.display = 'table-row';
            if (line.value !== undefined || line.link !== undefined) {
                tr.cells[0].textContent = line.label;
                if (line.value != null) {
                    tr.cells[1].textContent = line.value;
                } else if (line.link != null) {
                    tr.cells[1].innerHTML = line.link;
                }
            }
        });
        table2.forEach((line, index) => {
            if (index === 0) {
                this.#label2.textContent = line;
                return;
            }
            const tr = this.#tableAccount.rows[index - 1];
            tr.style.display = 'table-row';
            if (line.value !== undefined || line.link !== undefined) {
                tr.cells[0].textContent = line.label;
                if (line.value != null) {
                    tr.cells[1].textContent = line.value;
                } else if (line.link != null) {
                    tr.cells[1].innerHTML = line.link;
                }
            }
        });

        if (buttonLabel != null) {
            this.#button.style.display = 'block';
            this.#button.value = buttonLabel;
            this.#callback = callback;
            this.#button.addEventListener('click', callback);
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
        const closeListener = (event) => {
            const isClickInsideElement = this.container.contains(event.target);

            if (!isClickInsideElement) {
                this.hide();
                document.removeEventListener('click', closeListener);
            }
        };

        document.addEventListener('click', closeListener);
    }

    hide() {
        this.#label.textContent = '';
        Array.from(this.#tableOrigin.rows).forEach((tr) => {
            Array.from(tr.cells).forEach((td) => {
                td.textContent = '';
            });
            tr.style.display = 'none';
        });
        Array.from(this.#tableAccount.rows).forEach((tr) => {
            Array.from(tr.cells).forEach((td) => {
                td.textContent = '';
            });
            tr.style.display = 'none';
        });
        this.#icon.style.display = 'none';
        this.#button.style.display = 'none';
        this.#button.removeEventListener('click', this.#callback);
        this.#callback = undefined;
        this.container.style.display = 'none';
    }

    position(element) {
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

const uwaContentPopup = new UwaContentPopup();
