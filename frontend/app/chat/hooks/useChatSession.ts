'use client';

import { useReducer, useEffect, useCallback } from 'react';
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
  noteState?: string;
};

type ChatState = {
  sessionId: string;
  conversation: ConversationItem[];
  questions: ConversationItem[];
  currentQuestionIndex: number;
  hasGeneratedInitialNote: boolean;
  hasCompleted: boolean;
};

type ChatAction =
  | { type: 'SET_SESSION_ID'; payload: string }
  | { type: 'INITIALIZE_CHAT'; payload: ConversationItem[] }
  | { type: 'ADD_USER_MESSAGE'; payload: ConversationItem }
  | { type: 'ADD_ASSISTANT_NOTE'; payload: Note }
  | { type: 'SET_CURRENT_QUESTION_INDEX'; payload: number }
  | { type: 'COMPLETE_SESSION' };

const initialState: ChatState = {
  sessionId: '',
  conversation: [],
  questions: [],
  currentQuestionIndex: 0,
  hasGeneratedInitialNote: false,
  hasCompleted: false,
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_SESSION_ID':
      return { ...state, sessionId: action.payload };
    case 'INITIALIZE_CHAT':
      return {
        ...state,
        questions: action.payload,
        conversation: [action.payload[0]],
      };
    case 'ADD_USER_MESSAGE':
      const nextIndex = state.currentQuestionIndex + 1;
      const updatedConversation = [...state.conversation, action.payload];
      if (nextIndex < state.questions.length) {
        updatedConversation.push(state.questions[nextIndex]);
      }
      return {
        ...state,
        conversation: updatedConversation,
        currentQuestionIndex:
          nextIndex < state.questions.length ? nextIndex : state.currentQuestionIndex,
      };
    case 'ADD_ASSISTANT_NOTE':
      const newItems: ConversationItem[] = [
        {
          role: 'assistant',
          type: 'note',
          id: `note-${Date.now()}`,
          note: action.payload,
        },
      ];

      const isCompleted = action.payload.state === 'complete';

      if (Array.isArray(action.payload.questions) && action.payload.questions.length > 0) {
        const newQuestions: ConversationItem[] = action.payload.questions.map((q) => ({
          ...q,
          type: 'message',
          role: 'assistant',
        }));

        // When new questions arrive, we add the first one immediately to conversation
        newItems.push(newQuestions[0]);

        return {
          ...state,
          conversation: [...state.conversation, ...newItems],
          questions: [...state.questions, ...newQuestions],
          currentQuestionIndex: state.questions.length, // point to first of new questions
          hasGeneratedInitialNote: true,
          hasCompleted: isCompleted,
        };
      }

      return {
        ...state,
        conversation: [...state.conversation, ...newItems],
        hasGeneratedInitialNote: true,
        hasCompleted: isCompleted,
      };
    case 'SET_CURRENT_QUESTION_INDEX':
      return { ...state, currentQuestionIndex: action.payload };
    case 'COMPLETE_SESSION':
      return { ...state, hasCompleted: true };
    default:
      return state;
  }
}

export const useChatSession = () => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { data: initialQuestionsData } = useQuery(queries.form.questions);

  const { mutate: startNewSessionMutate } = useMutation({
    mutationFn: startNewSession,
    onSuccess: (data) => dispatch({ type: 'SET_SESSION_ID', payload: data.sessionId }),
  });

  const { mutate: generateInitialNoteMutate, isPending: isPendingInitial } = useMutation({
    mutationFn: generateInitialNote,
    onSuccess: (data) => dispatch({ type: 'ADD_ASSISTANT_NOTE', payload: data }),
  });

  const { mutate: generateRefineNoteMutate, isPending: isPendingRefined } = useMutation({
    mutationFn: generateRefineNote,
    onSuccess: (data) => dispatch({ type: 'ADD_ASSISTANT_NOTE', payload: data }),
  });

  useEffect(() => {
    if (!state.sessionId) {
      startNewSessionMutate();
    }
  }, [state.sessionId, startNewSessionMutate]);

  useEffect(() => {
    if (initialQuestionsData?.questions && state.questions.length === 0) {
      const allQuestions: ConversationItem[] = initialQuestionsData.questions.map((q: any) => ({
        ...q,
        type: 'message',
        role: 'assistant',
      }));
      dispatch({ type: 'INITIALIZE_CHAT', payload: allQuestions });
    }
  }, [initialQuestionsData, state.questions.length]);

  const addUserResponse = useCallback((userItem: ConversationItem) => {
    dispatch({ type: 'ADD_USER_MESSAGE', payload: userItem });

    // We check if we need to trigger note generation
    // We need the NEW state here, so we might need a useEffect or handle it in the reducer/callback
  }, []);

  // Effect to handle triggers after state updates
  useEffect(() => {
    const lastMessage = state.conversation[state.conversation.length - 1];
    const isUserLast = lastMessage?.role === 'user';
    const isSequenceComplete = state.currentQuestionIndex >= state.questions.length - 1;

    if (state.sessionId && isUserLast && isSequenceComplete) {
      if (!state.hasGeneratedInitialNote) {
        generateInitialNoteMutate({ sessionId: state.sessionId });
      } else if (!state.hasCompleted) {
        generateRefineNoteMutate({ sessionId: state.sessionId });
      }
    }
  }, [
    state.currentQuestionIndex,
    state.questions.length,
    state.conversation,
    state.hasGeneratedInitialNote,
    state.hasCompleted,
    state.sessionId,
    generateInitialNoteMutate,
    generateRefineNoteMutate,
  ]);

  return {
    state,
    addUserResponse,
    isFetching: isPendingInitial || isPendingRefined,
  };
};
