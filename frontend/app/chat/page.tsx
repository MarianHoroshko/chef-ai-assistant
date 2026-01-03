'use client';

import { useState, useEffect, useRef } from 'react';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import Header from './components/header';
import ChatArea from './components/chat/chat-area';
import InputArea from './components/input/input-area';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queries } from '@/queries';
import { startNewSession } from '@/services/session';
import { generateInitialNote, generateRefineNote, Note } from '@/services/agent';

export type ConversationItem = {
  role: string;
  type: string;
  id: string;
  questionId?: string;
  text?: string;
  category?: string;
  note?: Note;
};

const ChatPage = () => {
  const { data } = useQuery(queries.form.questions);
  const [conversation, setConversation] = useState<ConversationItem[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<ConversationItem[]>([]);
  const [sessionId, setNewSessionId] = useState('');

  // Ref to track if we've already requested the final note
  const hasGeneratedInitialNote = useRef(false);
  const hasCompleted = useRef(false);

  const { mutate: startNewSessionMutate } = useMutation({
    mutationFn: startNewSession,
    onSuccess: (data) => setNewSessionId(data.sessionId),
  });

  const { mutate: generateInitialNoteMutate, isPending: isPendingInitial } = useMutation({
    mutationFn: generateInitialNote,
    onSuccess: (data) => {
      const conversationItem: ConversationItem = {
        role: 'assistant',
        type: 'note',
        id: `note-${Date.now()}`,
        note: data,
      };

      setConversation((prev) => [...prev, conversationItem]);

      if (data.state === 'completed') {
        hasCompleted.current = true;
      }

      if (Array.isArray(data.questions) && data.questions.length > 0) {
        const allQuestions: ConversationItem[] = data.questions.map((q) => ({
          ...q,
          type: 'message',
          role: 'assistant',
        }));

        setQuestions((prev) => [...prev, ...allQuestions]);

        // Initial question should always be index 0
        setConversation((prev) => [...prev, allQuestions[0]]);
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
    },
  });

  const { mutate: generateRefineNoteMutate, isPending: isPendingRefined } = useMutation({
    mutationFn: generateRefineNote,
    onSuccess: (data) => {
      const conversationItem: ConversationItem = {
        role: 'assistant',
        type: 'note',
        id: `note-${Date.now()}`,
        note: data,
      };

      setConversation((prev) => [...prev, conversationItem]);

      if (data.state === 'completed') {
        hasCompleted.current = true;
      }

      if (Array.isArray(data.questions) && data.questions.length > 0) {
        const allQuestions: ConversationItem[] = data.questions.map((q) => ({
          ...q,
          type: 'message',
          role: 'assistant',
        }));

        setQuestions((prev) => [...prev, ...allQuestions]);

        // Initial question should always be index 0
        setConversation((prev) => [...prev, allQuestions[0]]);
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
    },
  });

  // 1. Initialize Session
  useEffect(() => {
    if (!sessionId) {
      startNewSessionMutate();
    }
  }, [sessionId, startNewSessionMutate]);

  // 2. Initialize Questions
  useEffect(() => {
    if (data?.questions?.length > 0 && questions.length === 0) {
      const allQuestions: ConversationItem[] = data.questions.map((q) => ({
        ...q,
        // id: new Date().toISOString(),
        type: 'message',
        role: 'assistant',
      }));
      setQuestions(allQuestions);
      setConversation([allQuestions[0]]);
    }
  }, [data?.questions, questions.length]);

  const addUserResponseToConversation = (userItem: ConversationItem) => {
    const nextIndex = currentQuestionIndex + 1;

    // We calculate the new state first
    setConversation((prev) => {
      const updated = [...prev, userItem];

      if (nextIndex < questions.length) updated.push(questions[nextIndex]);

      return updated;
    });

    // 3. Trigger Note Generation if sequence is complete
    if (nextIndex >= questions.length) {
      if (!hasGeneratedInitialNote.current) {
        hasGeneratedInitialNote.current = true; // Lock the trigger

        generateInitialNoteMutate({ sessionId });
      } else if (!hasCompleted.current) {
        generateRefineNoteMutate({ sessionId });
      }
    } else if (nextIndex < questions.length) {
      setCurrentQuestionIndex(nextIndex);
    }
  };

  return (
    <Box className="flex h-screen w-full overflow-hidden bg-background">
      <VStack className="h-full flex-1 overflow-hidden">
        <Header />

        <ChatArea
          sessionId={sessionId}
          conversationItems={conversation}
          isFetching={isPendingInitial || isPendingRefined ? true : false}
        />

        <InputArea
          questionId={questions[currentQuestionIndex]?.id ?? ''}
          sessionId={sessionId}
          addUserResponseToConversation={addUserResponseToConversation}
        />
      </VStack>
    </Box>
  );
};

export default ChatPage;
