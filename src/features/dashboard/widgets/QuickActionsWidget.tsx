import React from 'react';
import { Card, CardContent, Button } from '../../../components/ui';
import {
  PlusIcon,
  CalendarIcon,
  CheckCircleIcon,
  SvgIcon,
  type IconProps,
} from '../../../components/common';

// BookIcon is not in the common icons, so we define it inline
function BookIcon({ className }: IconProps): React.ReactElement {
  return (
    <SvgIcon className={className}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="2" fill="none" />
      <path
        d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
    </SvgIcon>
  );
}

interface QuickActionsWidgetProps {
  onCreateContent: () => void;
  onViewCalendar: () => void;
  onViewApprovals: () => void;
  onOpenGuidelines: () => void;
  pendingCount?: number;
}

export function QuickActionsWidget({
  onCreateContent,
  onViewCalendar,
  onViewApprovals,
  onOpenGuidelines,
  pendingCount = 0,
}: QuickActionsWidgetProps): React.ReactElement {
  return (
    <Card className="shadow-md">
      <CardContent className="py-4">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="default"
            className="flex items-center justify-center gap-2"
            onClick={onCreateContent}
          >
            <PlusIcon className="h-4 w-4" />
            Create
          </Button>
          <Button
            variant="outline"
            className="flex items-center justify-center gap-2"
            onClick={onViewCalendar}
          >
            <CalendarIcon className="h-4 w-4" />
            Calendar
          </Button>
          <Button
            variant="outline"
            className="relative flex items-center justify-center gap-2"
            onClick={onViewApprovals}
          >
            <CheckCircleIcon className="h-4 w-4" />
            Approvals
            {pendingCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </Button>
          <Button
            variant="outline"
            className="flex items-center justify-center gap-2"
            onClick={onOpenGuidelines}
          >
            <BookIcon className="h-4 w-4" />
            Guidelines
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
