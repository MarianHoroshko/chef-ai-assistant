'use client';

import { useEffect, useRef } from 'react';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { ConversationItem } from '../../page';
import EventSummaryCard from '../summary-card/summary-card';
import LoadingMessage from './loading-message';

type ChatAreaProps = {
  sessionId: string;
  conversationItems: ConversationItem[];
  isFetching?: boolean;
};

const ChatArea = ({ sessionId, conversationItems, isFetching }: ChatAreaProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationItems]);

  return (
    <Box className="flex-1 overflow-y-auto bg-background p-4 md:p-8">
      {conversationItems?.map((conversationItem) => (
        <VStack key={conversationItem.id} className="mx-auto mb-8 w-full max-w-3xl flex-shrink-0">
          {conversationItem.role === 'assistant' && conversationItem.type === 'note' && (
            <EventSummaryCard sessionId={sessionId} note={conversationItem?.note} />
          )}

          {conversationItem.role === 'assistant' && conversationItem.type === 'message' && (
            // Assistant Message
            <HStack space="md" className="flex w-full flex-row items-start">
              <VStack className="max-w-[85%] gap-2 md:max-w-[75%]">
                <Box className="w-fit rounded-2xl rounded-tl-none border border-border-light bg-surface p-4 shadow-sm">
                  <Text className="text-sm leading-relaxed text-text-main md:text-base">
                    {conversationItem.text}
                  </Text>
                </Box>
              </VStack>
            </HStack>
          )}

          {conversationItem.role === 'user' && conversationItem.type === 'message' && (
            <HStack space="md" className="w-full items-start justify-end">
              <VStack className="max-w-[85%] items-end gap-2 md:max-w-[75%]">
                <Box className="w-fit rounded-2xl rounded-tr-none bg-primary-dark p-4 shadow-md">
                  <Text className="text-sm leading-relaxed text-white md:text-base">
                    {conversationItem.text}
                  </Text>
                </Box>
              </VStack>
            </HStack>
          )}
        </VStack>
      ))}

      {isFetching && <LoadingMessage />}

      <div ref={messagesEndRef} />
    </Box>
  );
};

export default ChatArea;
