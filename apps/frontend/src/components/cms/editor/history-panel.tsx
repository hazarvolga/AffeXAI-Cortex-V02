'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface HistoryItem {
  components: any[];
  timestamp: number;
}

interface HistoryPanelProps {
  history: HistoryItem[];
  currentIndex: number;
  onHistorySelect: (index: number) => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  currentIndex,
  onHistorySelect,
}) => {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>History</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full w-full">
          <div className="p-4 space-y-2">
            {history.map((item, index) => (
              <Button
                key={index}
                variant={index === currentIndex ? "default" : "outline"}
                className="w-full justify-start h-auto py-3 px-4"
                onClick={() => onHistorySelect(index)}
              >
                <div className="text-left">
                  <div className="font-medium">
                    {index === 0 ? 'Initial State' : `Action ${index}`}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default HistoryPanel;