import { Badge } from '@/components/ui/badge';
import { STAGE_LABEL, STAGE_COLOR, type Stage } from '@/lib/mock';

const toneMap: Record<string, any> = {
  sky: 'sky', primary: 'primary', amber: 'amber',
  emerald: 'emerald', rose: 'rose', muted: 'muted',
};

export function StatusBadge({ stage }: { stage: Stage }) {
  return <Badge tone={toneMap[STAGE_COLOR[stage]]} dot>{STAGE_LABEL[stage]}</Badge>;
}

export function IntentBadge({ intent }: { intent: 'ALTA' | 'MEDIA' | 'BAJA' }) {
  const tone = intent === 'ALTA' ? 'emerald' : intent === 'MEDIA' ? 'amber' : 'muted';
  const label = intent === 'ALTA' ? 'Intención alta' : intent === 'MEDIA' ? 'Intención media' : 'Intención baja';
  return <Badge tone={tone as any}>{label}</Badge>;
}
