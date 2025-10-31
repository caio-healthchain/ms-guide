export interface GuideResponse {
  id: number;
  numeroGuiaPrestador: string;
  numeroGuiaOperadora?: string;
  numeroCarteira?: string;
  tipoGuia?: string;
  loteGuia?: string;
  diagnostico?: string;
  valorTotalProcedimentos?: number;
  valorTotalGeral?: number;
  createdAt: Date;
  updatedAt: Date;
  patientId?: string;
  // Campos adicionais conforme necessário
}

export interface ProcedimentoResponse {
  id: number;
  sequencialItem: string;
  codigoProcedimento?: string;
  descricaoProcedimento?: string;
  quantidadeExecutada?: number;
  valorUnitario?: number;
  valorTotal?: number;
  dataExecucao?: string;
  guiaId: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp: string;
}
