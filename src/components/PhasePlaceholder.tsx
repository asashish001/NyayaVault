import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function PhasePlaceholder({
  title,
  phase,
  summary,
}: {
  title: string;
  phase: string;
  summary: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Badge tone="saffron">{phase}</Badge>
        <p className="text-sm text-slate-600">{summary}</p>
        <p className="text-xs text-slate-500">
          Navigation is present for the demo journey. Core behaviour is implemented when the
          matching phase is complete — this is not a fake government integration.
        </p>
      </CardContent>
    </Card>
  );
}
