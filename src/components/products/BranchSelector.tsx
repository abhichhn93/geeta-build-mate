import { useLanguage } from '@/hooks/useLanguage';
import { useBranches } from '@/hooks/useBranches';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';

interface BranchSelectorProps {
  selectedBranch: string;
  onBranchChange: (branchId: string) => void;
}

export function BranchSelector({ selectedBranch, onBranchChange }: BranchSelectorProps) {
  const { t } = useLanguage();
  const { data: branches, isLoading } = useBranches();

  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 px-2">
        <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
        <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
      <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      
      <Button
        variant={selectedBranch === 'all' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onBranchChange('all')}
        className="shrink-0 rounded-full h-6 text-[10px] px-2.5"
      >
        {t('All Branches', 'सभी शाखाएं')}
      </Button>
      
      {branches?.map((branch) => (
        <Button
          key={branch.id}
          variant={selectedBranch === branch.id ? 'default' : 'outline'}
          size="sm"
          onClick={() => onBranchChange(branch.id)}
          className="shrink-0 rounded-full h-6 text-[10px] px-2.5"
        >
          {branch.name}
        </Button>
      ))}
    </div>
  );
}
