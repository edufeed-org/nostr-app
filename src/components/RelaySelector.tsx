import { useAppContext } from '@/hooks/useAppContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface RelaySelectorProps {
  className?: string;
}

export function RelaySelector({ className }: RelaySelectorProps) {
  const { config, updateConfig, presetRelays } = useAppContext();

  const handleRelayChange = (value: string) => {
    updateConfig((currentConfig) => ({
      ...currentConfig,
      relayUrl: value,
    }));
  };

  return (
    <div className={className}>
      <Select value={config.relayUrl} onValueChange={handleRelayChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select relay" />
        </SelectTrigger>
        <SelectContent>
          {presetRelays?.map((relay) => (
            <SelectItem key={relay.url} value={relay.url}>
              {relay.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="mt-1 text-xs text-muted-foreground">
        Current relay: {presetRelays?.find(r => r.url === config.relayUrl)?.name || config.relayUrl}
      </p>
    </div>
  );
}