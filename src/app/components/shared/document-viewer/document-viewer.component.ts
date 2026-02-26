import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export interface ViewerAction {
  action: 'whatsapp' | 'download' | 'save';
  signature?: string;
}

export interface ViewerDocument {
  id: string;
  title: string;
  type: 'contrato' | 'recibo' | 'orcamento';
  html: string;
  safeHtml?: SafeHtml;
}

@Component({
  selector: 'app-document-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <div class="tabs-container">
            <div class="tabs" *ngIf="documents.length > 0">
              <button *ngFor="let doc of documents" 
                      class="tab-btn" 
                      [class.active]="activeDocId === doc.id" 
                      (click)="setActiveDoc(doc.id)">
                {{ doc.title }}
              </button>
            </div>
            <h3 *ngIf="documents.length === 0">Visualizador de Documentos</h3>
          </div>
          <div class="header-actions" style="display: flex; gap: 10px;">
            <button class="btn btn-primary btn-sm" (click)="printActiveDocument()" *ngIf="activeDocId">
              <i class="fas fa-print"></i> Imprimir
            </button>
            <button class="btn btn-secondary btn-sm" (click)="close()">
              <i class="fas fa-times"></i> Fechar
            </button>
          </div>
        </div>

        <div class="modal-body">
          <div class="document-container" [class.has-signature]="mode === 'sign'">
            <iframe *ngIf="activeDocument && activeDocument.safeHtml" 
                    [srcdoc]="activeDocument.safeHtml" 
                    class="document-frame">
            </iframe>
          </div>

          <div class="signature-section" *ngIf="mode === 'sign' && activeDocument?.type === 'contrato'">
            <div class="signature-header">
              <h4>Assinatura do Locatário</h4>
              <p class="text-muted"><small>Assine no quadro abaixo usando o mouse ou dedo (em telas de toque)</small></p>
            </div>
            
            <div class="canvas-container" *ngIf="signatureState === 'pending'">
              <canvas #signatureCanvas 
                      width="600" 
                      height="200" 
                      (touchstart)="startDrawing($event)" 
                      (touchmove)="draw($event)" 
                      (touchend)="stopDrawing()"
                      (mousedown)="startDrawing($event)" 
                      (mousemove)="draw($event)" 
                      (mouseup)="stopDrawing()" 
                      (mouseleave)="stopDrawing()">
              </canvas>
            </div>
            
            <div class="signature-actions">
              <ng-container *ngIf="signatureState === 'pending'">
                <button class="btn btn-secondary" (click)="clearSignature()">Limpar</button>
                <button class="btn btn-warning" (click)="signDocument()">Assinar</button>
              </ng-container>
              <ng-container *ngIf="signatureState === 'signed'">
                <button class="btn btn-secondary" (click)="resetSignature()">Refazer Assinatura</button>
                <button class="btn btn-primary" (click)="downloadSigned()">Baixar PDF</button>
                <button class="btn btn-success" (click)="sendSigned()">Enviar WhatsApp</button>
              </ng-container>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 2000;
      padding: 1rem;
    }

    .modal-content {
      background: #f8f9fa;
      border-radius: 12px;
      width: 100%;
      max-width: 1000px;
      height: 95vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      overflow: hidden;
    }

    .modal-header {
      background: linear-gradient(135deg, #343a40 0%, #212529 100%);
      padding: 1rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    }

    .tabs-container {
      flex: 1;
    }

    .tabs-container h3 {
      color: white;
      margin: 0;
      font-size: 1.25rem;
    }

    .tabs {
      display: flex;
      gap: 0.5rem;
    }

    .tab-btn {
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: #adb5bd;
      padding: 0.75rem 1.5rem;
      border-radius: 8px 8px 0 0;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .tab-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }

    .tab-btn.active {
      background: white;
      color: #212529;
    }

    .modal-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 1.5rem;
      gap: 1.5rem;
      overflow-y: auto;
      background: #e9ecef;
    }

    .document-container {
      flex: 1;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      min-height: 400px;
    }

    .document-container.has-signature {
      flex: 0 0 50vh;
    }

    .document-frame {
      width: 100%;
      height: 100%;
      border: none;
      background: white;
    }

    .signature-section {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .signature-header {
      text-align: center;
    }

    .signature-header h4 {
      margin: 0 0 0.5rem;
      color: #212529;
    }

    .signature-header p {
      margin: 0;
    }

    .canvas-container {
      background: #f8f9fa;
      border: 2px dashed #ced4da;
      border-radius: 8px;
      padding: 10px;
      touch-action: none;
    }

    canvas {
      background: white;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      cursor: crosshair;
    }

    .signature-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: center;
    }

    /* Missing Button Styles */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.9rem;
    }
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    .btn-sm {
      padding: 0.4rem 0.8rem;
      font-size: 0.8rem;
    }
    .btn-primary {
      background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%);
      color: white;
    }
    .btn-secondary {
      background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%);
      color: white;
    }
    .btn-success {
      background: linear-gradient(135deg, #198754 0%, #157347 100%);
      color: white;
    }
    .btn-warning {
      background: linear-gradient(135deg, #ffc107 0%, #ffca2c 100%);
      color: #212529;
    }
  `]
})
export class DocumentViewerComponent implements AfterViewInit, OnChanges {
  @Input() documents: ViewerDocument[] = [];
  @Input() mode: 'view' | 'sign' = 'view';
  @Input() activeDocId: string = '';

  @Output() onAction = new EventEmitter<ViewerAction>();
  @Output() closeViewer = new EventEmitter<void>();

  @ViewChild('signatureCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  activeDocument: any = null;
  signatureState: 'pending' | 'signed' = 'pending';
  signatureImage: string | null = null;

  // Drawing state
  private cx!: CanvasRenderingContext2D;
  private isDrawing = false;
  private hasSignature = false;

  constructor(private sanitizer: DomSanitizer) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['documents'] || changes['activeDocId']) {
      this.setActiveDoc(this.activeDocId);
    }
  }

  ngAfterViewInit() {
    this.initCanvas();
  }

  setActiveDoc(id: string) {
    if (!this.documents || this.documents.length === 0) return;

    // Default to first if none specified
    const targetId = id || this.documents[0].id;
    this.activeDocId = targetId;
    this.activeDocument = this.documents.find(d => d.id === targetId) || this.documents[0];

    // Ensure SafeHtml is generated once and cached
    if (this.activeDocument && !this.activeDocument.safeHtml) {
      if (!this.activeDocument.html.includes('id="a4-styles"')) {
        this.activeDocument.html = this.wrapWithA4Styles(this.activeDocument.html, this.activeDocument.type);
      }
      this.activeDocument.safeHtml = this.sanitizer.bypassSecurityTrustHtml(this.activeDocument.html);
    }

    // Only reset signature if we switch to a different document type
    if (this.mode === 'sign' && this.activeDocument?.type === 'contrato' && this.signatureState === 'signed') {
      // Keep signed state if already signed this session
    } else {
      // We only allow signing the contrato for now
    }

    setTimeout(() => this.initCanvas(), 100);
  }

  private wrapWithA4Styles(htmlContent: string, docType: string): string {
    const isOrcamento = docType === 'orcamento';
    const bodyPadding = isOrcamento ? '0' : '15mm !important';
    const bodyWidth = isOrcamento ? '100% !important' : '210mm !important';

    const a4Styles = `
      <style id="a4-styles">
        @media screen {
          html { background-color: #f0f0f0 !important; }
          body {
            background-color: ${isOrcamento ? 'transparent' : 'white'} !important;
            width: ${bodyWidth};
            min-height: 297mm !important;
            margin: 20px auto !important;
            padding: ${bodyPadding};
            box-shadow: ${isOrcamento ? 'none' : '0 0 10px rgba(0,0,0,0.1) !important'};
            box-sizing: border-box !important;
          }
        }
        @media print {
          html, body {
            background-color: white !important;
            margin: 0 !important;
            padding: 0 !important;
            width: auto !important;
            min-height: auto !important;
            box-shadow: none !important;
          }
        }
      </style>
    `;

    // Inject styles cleanly without wrapping the entire HTML string in a div
    if (htmlContent.includes('</head>')) {
      return htmlContent.replace('</head>', a4Styles + '</head>');
    } else if (htmlContent.includes('<body')) {
      return htmlContent.replace(/(<body[^>]*>)/i, a4Styles + '$1');
    } else {
      return a4Styles + htmlContent;
    }
  }

  printActiveDocument() {
    if (!this.activeDocument) return;

    const iframe = document.querySelector('.document-frame') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }
  }

  close() {
    this.closeViewer.emit();
  }

  // --- Signature Logic ---

  private initCanvas() {
    if (!this.canvasRef || this.mode !== 'sign' || this.signatureState !== 'pending') return;

    const canvasEl = this.canvasRef.nativeElement;
    // Set internal canvas resolution to match display size to prevent stretching
    canvasEl.width = canvasEl.offsetWidth || 600;
    canvasEl.height = canvasEl.offsetHeight || 200;

    const ctx = canvasEl.getContext('2d');
    if (ctx) {
      this.cx = ctx;
      this.cx.lineWidth = 3;
      this.cx.lineCap = 'round';
      this.cx.strokeStyle = '#000000';
    }
  }

  private getPos(event: MouseEvent | TouchEvent) {
    const canvasEl = this.canvasRef.nativeElement;
    const rect = canvasEl.getBoundingClientRect();
    let clientX, clientY;

    if (event instanceof TouchEvent) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    // Calculate scale in case canvas is resized by CSS
    const scaleX = canvasEl.width / rect.width;
    const scaleY = canvasEl.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  startDrawing(event: MouseEvent | TouchEvent) {
    if (this.signatureState !== 'pending') return;
    event.preventDefault(); // Prevent scrolling on touch

    this.isDrawing = true;
    const pos = this.getPos(event);
    this.cx.beginPath();
    this.cx.moveTo(pos.x, pos.y);
  }

  draw(event: MouseEvent | TouchEvent) {
    if (!this.isDrawing) return;
    event.preventDefault();

    const pos = this.getPos(event);
    this.cx.lineTo(pos.x, pos.y);
    this.cx.stroke();
    this.hasSignature = true;
  }

  stopDrawing() {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    this.cx.closePath();
  }

  clearSignature() {
    if (!this.cx || !this.canvasRef) return;
    const canvasEl = this.canvasRef.nativeElement;
    this.cx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    this.hasSignature = false;
  }

  signDocument() {
    if (!this.hasSignature || !this.activeDocument) {
      alert('Por favor, faça um traço no quadro para assinar.');
      return;
    }

    const signatureDataUrl = this.canvasRef.nativeElement.toDataURL('image/png');
    this.signatureImage = signatureDataUrl;

    // Append signature strictly visually so the user can verify
    // We check if the container placeholder exists (Contrato), otherwise fallback
    const containerId = 'id="assinatura-locataria-container"';
    if (this.activeDocument.html.includes(containerId)) {
      const signatureImgHtml = `<img src="${signatureDataUrl}" style="max-height: 150px; max-width: 350px; width: 100%; object-fit: contain; position: absolute; bottom: 0px; left: 50%; transform: translateX(-10%); z-index: 10;">`;

      // We replace the inner content of the container with the image
      this.activeDocument.html = this.activeDocument.html.replace(
        /(<div id="assinatura-locataria-container"[^>]*>)[\s\S]*?(<\/div>)/i,
        `$1${signatureImgHtml}$2`
      );
    } else {
      // Fallback behavior if the placeholder isn't found (e.g. Recibo or old layout)
      const styledSignature = `
        <div id="injected-signature" style="margin-top: 40px; text-align: center; page-break-inside: avoid;">
          <img src="${signatureDataUrl}" style="max-width: 400px; height: auto; border-bottom: 1px solid #000; margin-bottom: 5px;">
          <p style="margin: 0; font-family: Arial, sans-serif; font-size: 14px;"><strong>ASSINATURA DO LOCATÁRIO</strong></p>
        </div>
      `;

      this.activeDocument.html = this.activeDocument.html.replace('</body>', styledSignature + '</body>');
      if (!this.activeDocument.html.includes('</body>')) { // fallback if there is no body tag
        this.activeDocument.html += styledSignature;
      }
    }

    this.activeDocument.safeHtml = this.sanitizer.bypassSecurityTrustHtml(this.activeDocument.html);
    this.signatureState = 'signed';

    // Output immediate save action
    this.onAction.emit({ action: 'save', signature: signatureDataUrl });
  }

  resetSignature() {
    this.signatureImage = null;
    this.hasSignature = false;
    this.signatureState = 'pending';
    // Let the user sign again. They can clear and retry. 
    // They will just see pending state again and the canvas returns.
    // Notice: We don't restore original HTML here directly because the user hasn't saved yet, 
    // and when they sign again, the replacement regex handles overriding existing img tags!
    setTimeout(() => this.initCanvas(), 100);
  }

  downloadSigned() {
    if (this.signatureImage) {
      this.onAction.emit({ action: 'download', signature: this.signatureImage });
    }
  }

  sendSigned() {
    if (this.signatureImage) {
      this.onAction.emit({ action: 'whatsapp', signature: this.signatureImage });
    }
  }
}
