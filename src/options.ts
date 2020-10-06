import { render, html, customElement, GemElement, attribute } from '@mantou/gem';

import {
  readyPromise,
  builtInHandlers,
  customHandlers,
  Handler,
  updateBuiltInHandler,
  resestBuiltInHandlers,
  updateCustomHandler,
  addCustomHandler,
} from './handlers';

@customElement('options-table')
export class OptionsTable extends GemElement {
  @attribute type: 'built-in' | 'custom';

  async updateHandler(index: number, origin: string, data: Partial<Handler> | null) {
    if (this.type === 'built-in') {
      await updateBuiltInHandler(origin, data);
    } else {
      await updateCustomHandler(index, data);
    }
    this.update();
  }

  async resestBuiltInHandlers() {
    await resestBuiltInHandlers();
    location.reload();
  }

  async addCustomHandler() {
    await addCustomHandler();
    this.update();
  }

  render() {
    const isBuiltIn = this.type === 'built-in';
    const handlers = isBuiltIn ? builtInHandlers : customHandlers;
    return html`
      <style>
        :host {
          display: block;
        }
        h2 {
          font-size: 1.2em;
          font-weight: bolder;
          margin: 0 0 0.5em;
        }
        table {
          border-collapse: collapse;
          border: 2px solid rgb(200, 200, 200);
          margin: 0 0 1em;
          width: 100%;
        }
        th {
          font-weight: bolder;
        }
        td,
        th {
          border: 1px solid rgb(190, 190, 190);
          padding: 10px;
        }
        td {
          text-align: center;
        }
        tr:nth-child(even) {
          background-color: #eee;
        }
        input {
          background-color: transparent;
          border-radius: 2px;
          border: 1px solid rgba(0, 0, 0, 0.3);
        }
        input[readonly] {
          border: none;
        }
        input[readonly]:focus {
          outline: none;
        }
      </style>
      <h2>${isBuiltIn ? 'Built-in rules' : 'Custom rules'}</h2>
      <table>
        <thead>
          <tr>
            <th>Enable</th>
            <th>Origin</th>
            <th>Paths</th>
            <th>Exclude Paths</th>
            <th>Refresh</th>
            ${isBuiltIn
              ? null
              : html`
                  <th>Operate</th>
                `}
          </tr>
        </thead>
        <tbody>
          ${handlers.length
            ? null
            : html`
                <tr>
                  <td colspan="6">No rules</td>
                </tr>
              `}
          ${handlers.map(
            (e, index) => html`
              <tr>
                <td>
                  <input
                    type="checkbox"
                    ?checked=${e.enable}
                    @change=${() => this.updateHandler(index, e.origin, { enable: !e.enable })}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    ?readonly=${isBuiltIn}
                    value=${e.origin}
                    @change=${(e: any) => this.updateHandler(index, e.origin, { origin: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    ?readonly=${isBuiltIn}
                    value=${e.paths}
                    @change=${(e: any) => this.updateHandler(index, e.origin, { paths: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    ?readonly=${isBuiltIn}
                    value=${e.exclude_paths}
                    @change=${(e: any) => this.updateHandler(index, e.origin, { exclude_paths: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    ?disabled=${isBuiltIn}
                    ?checked=${e.refresh}
                    @change=${() => this.updateHandler(index, e.origin, { refresh: !e.refresh })}
                  />
                </td>
                ${isBuiltIn
                  ? null
                  : html`
                      <td><button @click=${() => this.updateHandler(index, e.origin, null)}>Delete</button></td>
                    `}
              </tr>
            `,
          )}
        </tbody>
      </table>
      ${isBuiltIn
        ? html`
            <button @click=${() => this.resestBuiltInHandlers()}>
              Reset built-in rule
            </button>
          `
        : html`
            <button @click=${() => this.addCustomHandler()}>
              Add custom rule
            </button>
          `}
    `;
  }
}

@customElement('options-app')
export class OptionsApp extends GemElement {
  render() {
    return html`
      <style>
        options-table + options-table {
          margin: 1.5em 0 0;
        }
      </style>
      <options-table type="built-in"></options-table>
      <options-table type="custom"></options-table>
    `;
  }
}

readyPromise.then(() => {
  render(
    html`
      <style>
        html {
          font-size: 62.5%;
          background: white;
        }
        body {
          font-size: 1.6rem;
          margin: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          margin: 2.5rem;
        }
        options-app {
          width: 80rem;
          padding: 1em;
        }
      </style>
      <options-app></options-app>
    `,
    document.body,
  );
});
