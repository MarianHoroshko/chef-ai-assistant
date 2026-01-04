'use client';

import { Box } from '@/components/ui/box';
import { Button, ButtonIcon } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { ArrowUpIcon } from '@/components/ui/icon';
import { Input, InputField } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { FC } from 'react';
import { useMutation } from '@tanstack/react-query';
import { sendQuestionAnswer } from '@/services/form';
import { useForm, Controller } from 'react-hook-form';
import { ConversationItem } from '../../hooks/useChatSession';

type InputAreaProps = {
  questionId: string;
  sessionId: string;
  addUserResponseToConversation: (conversationItem: ConversationItem) => void;
};

type FormValues = {
  userAnswer: string;
};

const InputArea: FC<InputAreaProps> = ({
  questionId,
  sessionId,
  addUserResponseToConversation,
}) => {
  // 1. Initialize RHF
  const { control, handleSubmit, reset, setFocus } = useForm<FormValues>({
    defaultValues: {
      userAnswer: '',
    },
  });

  const { mutate: replyMutate } = useMutation({
    mutationFn: sendQuestionAnswer,
    mutationKey: ['send-question-reply'],
    onError: () => {
      console.error('Error sending reply');
    },
  });

  // 2. Optimized Submit Handler
  const onSubmit = (data: FormValues) => {
    const trimmedValue = data.userAnswer.trim();
    if (!trimmedValue) return;

    replyMutate({ sessionId, questionId, userAnswer: trimmedValue });

    addUserResponseToConversation({
      id: new Date().toISOString(),
      type: 'message',
      questionId,
      text: trimmedValue,
      role: 'user',
    });

    // Reset the form and maintain focus
    reset({ userAnswer: '' });
    setTimeout(() => setFocus('userAnswer'), 10);
  };

  return (
    <Box className="w-full flex-shrink-0 border-t border-border-light bg-surface px-4 pb-4 pt-4 md:px-8 md:pb-8">
      <Box className="mx-auto h-full w-full max-w-3xl">
        <Box className="flex h-full w-full flex-row gap-2 rounded-xl border border-border-light bg-white p-2 shadow-xl transition-all focus-within:border-primary">
          <Input
            className="h-full w-full flex-1 border-none hover:border-none focus:border-none"
            size="lg"
          >
            {/* 3. Use Controller for Gluestack compatibility */}
            <Controller
              name="userAnswer"
              control={control}
              render={({ field: { onChange, onBlur, value, ref } }) => (
                <InputField
                  ref={ref}
                  placeholder="Type your reply..."
                  className="h-full w-full border-none bg-transparent p-0 text-sm text-text-main placeholder-text-muted focus:ring-0 md:text-base"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  // Gluestack/RN specific: trigger submit on enter
                  onSubmitEditing={handleSubmit(onSubmit)}
                  blurOnSubmit={false}
                  returnKeyType="send"
                />
              )}
            />
          </Input>
          <HStack className="items-center gap-1 pb-1">
            <Button
              onPress={handleSubmit(onSubmit)}
              className="h-10 w-10 items-center justify-center rounded-lg bg-primary p-0 shadow-[0_2px_8px_rgba(16,185,129,0.3)] hover:bg-primary-dark"
            >
              <ButtonIcon as={ArrowUpIcon} className="text-white" />
            </Button>
          </HStack>
        </Box>
        <Text className="mt-2 text-center text-[10px] font-medium tracking-wide text-text-muted">
          AI may produce inaccurate information.
        </Text>
      </Box>
    </Box>
  );
};

export default InputArea;
