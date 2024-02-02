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

    * {
        box-sizing: border-box;
        overflow: hidden;
    }

    .container {
        border: 1px solid black;
        border-radius: 0.4em;
        background: #EEEEEE;
        box-shadow: 5px 5px 5px rgba(0, 0, 0, 0.15);
        align-items: center;
        font-family: Verdana, sans-serif;
        font-size: 12px;
        line-height: 1.25;
    }

    .title {
        // background: #5B9BD5;
        color: white;
        padding: 0.4em;
        border-bottom: 1px solid #808080;
        width: 100%;
    }

    .content {
        display: flex;
        align-items: center;
        width: 100%;
    }

    .left {
        padding: 1em;
    }

    .right {
        padding: 0 1em 0 1em;
        margin: 0.5em 0 0.5em 0;
        border-left: 1px solid rgba(0, 0, 0, 0.1);
        min-width: 20em;
        flex-grow: 1;
        flex-shrink: 1;
    }

    img {
        height: 4em;
    }

    .content label {
        color: black;
        font-weight: 600;
        display: block;
    }

    .title label {
        font-weight: 600;
        color: white
    }

    td:first-child {
        font-weight: 500;
        font-size: 11px;
        color: #808080;
    }

    td:last-child {
        font-weight: 400;
        font-size: 11px;
        color: #101010;
        padding-left: 2em;
    }

    table {
        margin-bottom: 0.5em;
    }

</style>

<div class="container" >
    <div class="title">
        <label id="title"></label>
    </div>
    <div class="content">
        <div class="left">
            <img id="icon">
        </div>
        <div class="right"></div>
    </div>
</div>
`;

/**
 * Represents a content popup element.
 */
export class ContentPopup /* extends HTMLElement */ {
    container: HTMLElement;
    #shadowRoot: ShadowRoot;
    #icon: HTMLImageElement;
    #label: HTMLLabelElement;
    #removeFocusTrap: (() => void) | undefined;

    constructor() {
        this.container = document.createElement('DIV');
        this.#shadowRoot = this.container.attachShadow({ mode: 'open' });
        this.#shadowRoot.appendChild(
            (template.cloneNode(true) as HTMLTemplateElement).content,
        );

        this.container.style.display = 'none';
        document.body.appendChild(this.container);
        this.#icon = this.#shadowRoot.querySelector(
            '#icon',
        ) as HTMLImageElement;
        this.#label = this.#shadowRoot.querySelector(
            '#title',
        ) as HTMLLabelElement;
    }

    hide() {
        this.container.style.display = 'none';
    }

    position(element: HTMLElement) {
        element.nodeType === Node.TEXT_NODE &&
            (element = element.parentElement as HTMLElement);

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

    show(
        target: HTMLElement,
        title: string,
        titleColor: string,
        iconUrl: string,
        tables: Record<string, string>[],
    ) {
        this.#label.textContent = title;
        this.#icon.src = iconUrl;
        this.#icon.title = title;
        const dce = document.createElement.bind(document);
        const divRight = this.#shadowRoot.querySelector(
            '.right',
        ) as HTMLDivElement;

        divRight.innerHTML = '';

        tables.forEach((tableSet) => {
            const labelTable = dce('label');
            labelTable.textContent = tableSet.title;
            (this.#label.parentElement as HTMLDivElement).style.background =
                titleColor;
            divRight.appendChild(labelTable);
            const table = dce('table');
            // const tableId = tableSet.title.toLocaleLowerCase().replace(/ /g, '-');
            // table.id = tableId
            // labelTable.htmlFor = tableId;
            Object.keys(tableSet)
                .filter((key) => key !== 'title')
                .forEach((key) => {
                    const value = tableSet[key];
                    const tr = dce('tr');
                    const tdLabel = dce('td');
                    tdLabel.classList.add('key');
                    tdLabel.textContent = key;
                    tr.appendChild(tdLabel);
                    const tdValue = dce('td');
                    value.startsWith('<a ')
                        ? (tdValue.innerHTML = value)
                        : (tdValue.textContent = value);
                    tdValue.classList.add('value');
                    tr.appendChild(tdValue);
                    table.appendChild(tr);
                });
            divRight.appendChild(table);
        });

        // don't position until the icon has loaded or we will get the wrong width
        this.#icon.onload = () => {
            this.position(target);
            this.container.style.display = 'block';
            void this.container.offsetWidth;
            this.#removeFocusTrap = trapFocus(
                this.#shadowRoot.querySelector('.container') as HTMLElement,
            );
        };

        // eslint-disable-next-line no-unused-vars
        const closeListener = (event: Event) => {
            const isClickInsideElement = this.container.contains(
                event.target as Node,
            );
            if (event.type === 'wheel' || !isClickInsideElement) {
                this.#removeFocusTrap && this.#removeFocusTrap();
                this.#removeFocusTrap = undefined;
                this.hide();
                document.removeEventListener('click', closeListener);
                document.removeEventListener('wheel', closeListener);
            }
        };

        document.addEventListener('click', closeListener);
        document.addEventListener('wheel', closeListener);
    }
}

/**
 * Sets up focus trapping within the specified element.
 * @param element - The HTML element to trap focus within.
 * @returns A function that can be called to clean up the focus trapping.
 */
function trapFocus(element: HTMLElement): (() => void) | undefined {
    const focusableElements = element.querySelectorAll<HTMLElement>(
        'a[href], button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusableElements.length === 0) return;

    const firstFocusableElement = focusableElements[0];
    const lastFocusableElement =
        focusableElements[focusableElements.length - 1];

    const handleFocus = (event: KeyboardEvent): void => {
        if (event.key === 'Tab' || event.keyCode === 9) {
            if (event.shiftKey) {
                /* shift + tab */ if (
                    document.activeElement === firstFocusableElement
                ) {
                    lastFocusableElement.focus();
                    event.preventDefault();
                }
            } /* tab */ else {
                if (document.activeElement === lastFocusableElement) {
                    firstFocusableElement.focus();
                    event.preventDefault();
                }
            }
        }
    };

    // When the xpoc popup is opened, set the initial focus and event listeners
    const currentActiveElement = document.activeElement;
    firstFocusableElement.focus();

    element.addEventListener('keydown', handleFocus);

    // Return a function to clean up the event listener when the popup is closed
    return () => {
        (currentActiveElement as HTMLElement).focus();
        element.removeEventListener('keydown', handleFocus);
    };
}

export const contentPopup = new ContentPopup();
