import { DoublyLinkedList } from '../data-structures/DoublyLinkedList';
import { Song } from '../models/Song';
import { escapeHtml } from '../utils/Formatters';

export class EducationalPanel {
  private container: HTMLElement;
  private isCollapsed: boolean = false;
  private lastActionMessage: string = 'Estructura inicializada correctamente.';
  private lastActionCode: string = '// Lista doblemente enlazada lista para interactuar';

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public setLastAction(message: string, codeSnippet: string): void {
    this.lastActionMessage = message;
    this.lastActionCode = codeSnippet;
  }

  public render(list: DoublyLinkedList<Song>): void {
    const current = list.getCurrent();
    const head = list.head;
    const tail = list.tail;
    const size = list.getSize();

    const currentTitle = current ? escapeHtml(current.data.title) : 'Ninguna (Lista vacía)';
    const currentArtist = current ? escapeHtml(current.data.artist) : '-';
    const currentId = current ? `0x${current.id.slice(-6).toUpperCase()}` : 'null';

    const prevTitle = current?.previous ? escapeHtml(current.previous.data.title) : 'null (Límite inicial)';
    const prevId = current?.previous ? `0x${current.previous.id.slice(-6).toUpperCase()}` : 'null';

    const nextTitle = current?.next ? escapeHtml(current.next.data.title) : 'null (Límite final)';
    const nextId = current?.next ? `0x${current.next.id.slice(-6).toUpperCase()}` : 'null';

    const headTitle = head ? `${escapeHtml(head.data.title)} (0x${head.id.slice(-6).toUpperCase()})` : 'null';
    const tailTitle = tail ? `${escapeHtml(tail.data.title)} (0x${tail.id.slice(-6).toUpperCase()})` : 'null';

    // Build visual ASCII / node diagram
    const allNodes = list.getAllNodes();
    let chainHtml = '';

    if (allNodes.length === 0) {
      chainHtml = '<div class="empty-chain-notice">Lista vacía (HEAD = null, TAIL = null)</div>';
    } else {
      chainHtml = `
        <div class="chain-flow-container">
          <div class="chain-track">
            ${allNodes
              .map((node) => {
                const isCur = node === current;
                const isHd = node === head;
                const isTl = node === tail;

                let classes = 'chain-node-box';
                if (isCur) classes += ' is-current';
                if (isHd) classes += ' is-head';
                if (isTl) classes += ' is-tail';

                return `
                <div class="${classes}" title="${escapeHtml(node.data.title)}">
                  <div class="node-mini-tag">${isHd ? 'HEAD ' : ''}${isTl ? 'TAIL ' : ''}${isCur ? '★' : ''}</div>
                  <div class="node-mini-title">${escapeHtml(node.data.title.substring(0, 11))}</div>
                  <div class="node-mini-ptr">0x${node.id.slice(-4).toUpperCase()}</div>
                </div>
              `;
              })
              .join('<div class="chain-arrows">⇄</div>')}
          </div>
        </div>
      `;
    }

    this.container.innerHTML = `
      <div class="edu-card ${this.isCollapsed ? 'collapsed' : ''}">
        <div class="edu-header">
          <div class="edu-title">
            <span class="edu-icon">⚡</span>
            <span>DIAGNÓSTICO: LISTA DOBLEMENTE ENLAZADA</span>
          </div>
          <button id="btn-toggle-edu" class="btn-icon-subtle" title="Minimizar / Expandir">
            ${this.isCollapsed ? '▼' : '▲'}
          </button>
        </div>

        ${
          this.isCollapsed
            ? ''
            : `
        <div class="edu-content">
          <!-- Pointers Grid -->
          <div class="pointers-grid">
            <div class="pointer-card current-card">
              <span class="pointer-label">★ NODO ACTUAL (current)</span>
              <strong class="pointer-value">${currentTitle}</strong>
              <small class="pointer-sub">${currentArtist} • Ref: <code>${currentId}</code></small>
            </div>

            <div class="pointer-card prev-card">
              <span class="pointer-label">◄ ANTERIOR (current.previous)</span>
              <strong class="pointer-value">${prevTitle}</strong>
              <small class="pointer-sub">Puntero: <code>${prevId}</code></small>
            </div>

            <div class="pointer-card next-card">
              <span class="pointer-label">SIGUIENTE (current.next) ►</span>
              <strong class="pointer-value">${nextTitle}</strong>
              <small class="pointer-sub">Puntero: <code>${nextId}</code></small>
            </div>

            <div class="pointer-card meta-card">
              <span class="pointer-label">ESTRUCTURA GLOBAL</span>
              <div class="meta-row"><span>HEAD:</span> <code>${headTitle}</code></div>
              <div class="meta-row"><span>TAIL:</span> <code>${tailTitle}</code></div>
              <div class="meta-row"><span>TOTAL NODOS (size):</span> <span class="badge-size">${size}</span></div>
            </div>
          </div>

          <!-- Chain Diagram -->
          <div class="edu-section">
            <div class="section-label">MAPA DE ENLACES BIDIRECCIONALES (EN TIEMPO REAL)</div>
            ${chainHtml}
          </div>

          <!-- Operation Trace Log -->
          <div class="edu-section">
            <div class="section-label">ÚLTIMA OPERACIÓN EN MEMORIA</div>
            <div class="trace-box">
              <div class="trace-msg">${escapeHtml(this.lastActionMessage)}</div>
              <pre class="trace-code"><code>${escapeHtml(this.lastActionCode)}</code></pre>
            </div>
          </div>
        </div>
        `
        }
      </div>
    `;

    // Add toggle listener
    const toggleBtn = this.container.querySelector('#btn-toggle-edu');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.isCollapsed = !this.isCollapsed;
        this.render(list);
      });
    }
  }
}
