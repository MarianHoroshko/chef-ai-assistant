'use client';

import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import Header from './components/header';
import ChatArea from './components/chat/chat-area';
import InputArea from './components/input/input-area';
import { useChatSession } from './hooks/useChatSession';

const ChatPage = () => {
  const { state, addUserResponse, isFetching } = useChatSession();
  const { conversation, sessionId, questions, currentQuestionIndex } = state;

  return (
    <Box className="flex h-screen w-full overflow-hidden bg-background">
      <VStack className="h-full flex-1 overflow-hidden">
        <Header />

        <ChatArea sessionId={sessionId} conversationItems={conversation} isFetching={isFetching} />

        <InputArea
          questionId={questions[currentQuestionIndex]?.id ?? ''}
          sessionId={sessionId}
          addUserResponseToConversation={addUserResponse}
        />
      </VStack>
    </Box>
  );
};

export default ChatPage;
