'use client';

import Badge from '@/components/shared/Badge';
import CodeBlock from '@/components/shared/CodeBlock';
import { useLifecycleStore } from '@/stores/lifecycle-store';

interface StepDetailProps {
  hook: string;
}

export default function StepDetail({ hook }: StepDetailProps) {
  const currentTurn = useLifecycleStore((s) => s.currentTurn);
  const history = useLifecycleStore((s) => s.history);
  const turn = currentTurn ?? history[history.length - 1];
  const step = turn?.steps.find((item) => item.hook === hook);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <h3 className="text-xs font-medium text-text">{hook}</h3>
        <Badge variant={step?.status === 'error' ? 'red' : 'blue'}>
          {step?.status ?? 'detail'}
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Input tab */}
        <section>
          <h4 className="text-[10px] text-muted uppercase tracking-wider mb-2">input</h4>
          <CodeBlock
            code={step?.inputData ? JSON.stringify(step.inputData, null, 2) : '// no input data'}
            language="json"
          />
        </section>

        {/* Output tab */}
        <section>
          <h4 className="text-[10px] text-muted uppercase tracking-wider mb-2">output</h4>
          <CodeBlock
            code={step?.outputData ? JSON.stringify(step.outputData, null, 2) : '// no output data'}
            language="json"
          />
        </section>
      </div>
    </div>
  );
}
