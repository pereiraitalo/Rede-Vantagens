import React from 'react';
import { Modal } from '../common/Modal';
import { STAGE_CONFIG } from '../partners/PartnerStageBadge';
import { PartnerStage } from '../../types';
import { Info, CheckCircle2, ArrowRight } from 'lucide-react';

interface StageLegendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STAGES_ORDER: PartnerStage[] = [
  'mapped',
  'prospecting',
  'waiting_docs',
  'in_analysis',
  'approved',
  'rejected',
  'gave_up',
  'inactive',
];

export const StageLegendModal: React.FC<StageLegendModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Legenda das Etapas do Funil"
      subtitle="Definições regimentais e fluxo de adesão de parceiros • Programa Rede+ Vantagens TJPA"
      size="xl"
    >
      <div className="space-y-6">
        {/* Intro Banner */}
        <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-700 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-900 leading-relaxed">
            O fluxo de adesão e gestão de convênios do Tribunal de Justiça do Pará é composto por <strong>8 etapas regimentais</strong>. Você pode arrastar os cartões ou utilizar os botões de transição para avançar um parceiro entre as fases com validações de dados automáticas.
          </div>
        </div>

        {/* Stages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {STAGES_ORDER.map((stageKey, idx) => {
            const config = STAGE_CONFIG[stageKey];
            const Icon = config.icon;

            return (
              <div
                key={stageKey}
                className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black text-slate-400">
                        0{idx + 1}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${config.bg} ${config.text} ${config.border}`}>
                        <Icon className="w-3.5 h-3.5" />
                        {config.label}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    {config.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-start gap-1.5 text-[11px] text-slate-500">
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong className="text-slate-700">Ação recomendada:</strong> {config.actionHint}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Entendido / Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
};
